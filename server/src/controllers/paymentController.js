const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const SessionSlot = require('../models/SessionSlot');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { createMeetLink } = require('../services/google-meet');
const { sendBookingConfirmation, sendPaymentRejection } = require('../services/email');

// POST /api/payments — student submits UTR + screenshot
const submitPayment = catchAsync(async (req, res) => {
  const { bookingId, utrNumber } = req.body;

  const booking = await Booking.findById(bookingId).populate('studentId', 'name email');
  if (!booking || booking.isDeleted) throw new ApiError(404, 'Booking not found.');
  if (booking.studentId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized.');
  }
  if (!['pending_payment', 'rejected'].includes(booking.status)) {
    throw new ApiError(400, 'Payment cannot be submitted for this booking status.');
  }

  const payment = await Payment.findOne({ bookingId });
  if (!payment) throw new ApiError(404, 'Payment record not found.');

  payment.utrNumber = utrNumber;
  payment.screenshotUrl = req.file?.path || req.body.screenshotUrl;
  payment.status = 'submitted';
  payment.submittedAt = new Date();
  await payment.save();

  booking.status = 'submitted';
  await booking.save();

  res.json({ success: true, payment, booking });
});

// PUT /api/payments/:id/resubmit — student resubmits after rejection
const resubmitPayment = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'bookingId',
    populate: { path: 'studentId', select: 'name email' },
  });

  if (!payment) throw new ApiError(404, 'Payment not found.');
  if (payment.bookingId.studentId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized.');
  }
  if (payment.status !== 'rejected') throw new ApiError(400, 'Only rejected payments can be resubmitted.');

  const { utrNumber } = req.body;
  payment.utrNumber = utrNumber;
  payment.screenshotUrl = req.file?.path || req.body.screenshotUrl;
  payment.status = 'submitted';
  payment.submittedAt = new Date();
  payment.adminNotes = undefined;
  await payment.save();

  await Booking.findByIdAndUpdate(payment.bookingId._id, { status: 'submitted', rejectionReason: undefined });

  res.json({ success: true, payment });
});

// GET /api/admin/payments
const getAdminPayments = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20, includeDeleted } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (!includeDeleted) filter.isDeleted = false;

  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'studentId', select: 'name email phone' },
        { path: 'slotId', select: 'title startTime endTime price', populate: { path: 'categoryId', select: 'name' } },
      ],
    })
    .sort({ submittedAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, payments, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
});

// PUT /api/admin/payments/:id/verify — admin approves payment
const verifyPayment = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'bookingId',
    populate: [
      { path: 'studentId', select: 'name email' },
      { path: 'slotId' },
    ],
  });

  if (!payment) throw new ApiError(404, 'Payment not found.');
  if (payment.status === 'verified') throw new ApiError(400, 'Payment already verified.');

  payment.status = 'verified';
  payment.verifiedBy = req.user._id;
  payment.verifiedAt = new Date();
  payment.adminNotes = req.body.adminNotes;
  await payment.save();

  const booking = payment.bookingId;
  const slot = booking.slotId;

  const warnings = [];

  // Create Google Meet link
  let meetLink = slot.meetLink;
  if (!meetLink) {
    try {
      const confirmedBookings = await Booking.find({ slotId: slot._id, status: 'confirmed' }).populate('studentId', 'email');
      const attendeeEmails = confirmedBookings.map((b) => b.studentId.email);
      attendeeEmails.push(booking.studentId.email);

      meetLink = await createMeetLink({
        title: slot.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendeeEmails,
        description: `Kothari Foundation Session - Booking Ref: ${booking.bookingRef}`,
      });

      if (meetLink && slot.capacity > 1) {
        await SessionSlot.findByIdAndUpdate(slot._id, { meetLink });
      }
    } catch (e) {
      console.error('Meet link creation failed:', e.message);
      warnings.push('meet_link_failed');
    }
  }

  booking.status = 'confirmed';
  booking.meetLink = meetLink || null;
  await booking.save();

  // Increment slot booked count
  await SessionSlot.findByIdAndUpdate(slot._id, { $inc: { bookedCount: 1 } });

  // Send confirmation email
  try {
    await sendBookingConfirmation({
      studentEmail: booking.studentId.email,
      studentName: booking.studentId.name,
      bookingRef: booking.bookingRef,
      slotTitle: slot.title,
      startTime: slot.startTime,
      meetLink,
    });
  } catch (e) {
    console.error('Email send failed:', e.message);
    warnings.push('email_failed');
  }

  res.json({ success: true, payment, booking, warnings });
});

// PUT /api/admin/payments/:id/reject — admin rejects payment
const rejectPayment = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'bookingId',
    populate: { path: 'studentId', select: 'name email' },
  });

  if (!payment) throw new ApiError(404, 'Payment not found.');
  if (payment.status === 'verified') throw new ApiError(400, 'Cannot reject an already verified payment.');

  const { reason } = req.body;

  payment.status = 'rejected';
  payment.adminNotes = reason;
  payment.verifiedBy = req.user._id;
  payment.verifiedAt = new Date();
  await payment.save();

  const booking = payment.bookingId;
  booking.status = 'rejected';
  booking.rejectionReason = reason;
  await booking.save();

  const warnings = [];

  // Send rejection email
  try {
    await sendPaymentRejection({
      studentEmail: booking.studentId.email,
      studentName: booking.studentId.name,
      bookingRef: booking.bookingRef,
      reason,
    });
  } catch (e) {
    console.error('Email send failed:', e.message);
    warnings.push('email_failed');
  }

  res.json({ success: true, payment, booking, warnings });
});

module.exports = { submitPayment, resubmitPayment, getAdminPayments, verifyPayment, rejectPayment };
