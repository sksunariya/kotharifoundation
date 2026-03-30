const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const SessionSlot = require('../models/SessionSlot');
const SiteConfig = require('../models/SiteConfig');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { generateUpiQR } = require('../services/qr-generator');
const { sendBookingCancellation } = require('../services/email');

// POST /api/bookings — student creates a booking
const createBooking = catchAsync(async (req, res) => {
  const { slotId, notes } = req.body;

  const slot = await SessionSlot.findById(slotId);
  if (!slot || !slot.isActive || slot.isDeleted) throw new ApiError(404, 'Session slot not found or inactive.');
  if (slot.bookedCount >= slot.capacity) throw new ApiError(400, 'This session is fully booked.');
  if (new Date(slot.startTime) < new Date()) throw new ApiError(400, 'Cannot book a past session.');

  // If a pending_payment booking already exists, resume it with a fresh QR
  const existing = await Booking.findOne({ studentId: req.user._id, slotId, status: 'pending_payment', isDeleted: false });
  if (existing) {
    const config = await SiteConfig.getConfig();
    const qrCode = await generateUpiQR({
      upiId: config.upiId,
      displayName: config.upiDisplayName,
      amount: slot.price,
      bookingRef: existing.bookingRef,
    });
    await existing.populate([{ path: 'slotId', populate: { path: 'categoryId', select: 'name icon' } }]);
    return res.status(200).json({ success: true, booking: existing, qrCode, upiId: config.upiId, upiDisplayName: config.upiDisplayName });
  }

  // Block if already booked with a non-recoverable status
  const blocked = await Booking.findOne({
    studentId: req.user._id,
    slotId,
    isDeleted: false,
    status: { $nin: ['cancelled', 'rejected', 'pending_payment'] },
  });
  if (blocked) throw new ApiError(400, 'You have already booked this session.');

  const booking = await Booking.create({ studentId: req.user._id, slotId, notes });

  // Create pending payment record
  await Payment.create({ bookingId: booking._id, amount: slot.price });

  // Generate UPI QR code
  const config = await SiteConfig.getConfig();
  const qrCode = await generateUpiQR({
    upiId: config.upiId,
    displayName: config.upiDisplayName,
    amount: slot.price,
    bookingRef: booking.bookingRef,
  });

  await booking.populate([{ path: 'slotId', populate: { path: 'categoryId', select: 'name icon' } }]);

  res.status(201).json({ success: true, booking, qrCode, upiId: config.upiId, upiDisplayName: config.upiDisplayName });
});

// GET /api/bookings/my — student's own bookings (never show deleted)
const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ studentId: req.user._id, isDeleted: false })
    .populate({ path: 'slotId', populate: { path: 'categoryId', select: 'name icon' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, bookings });
});

// GET /api/bookings/status/:ref — public status check
const getBookingStatus = catchAsync(async (req, res) => {
  const booking = await Booking.findOne({ bookingRef: req.params.ref, isDeleted: false })
    .populate({ path: 'slotId', select: 'title startTime endTime price', populate: { path: 'categoryId', select: 'name icon' } })
    .populate('studentId', 'name email');

  if (!booking) throw new ApiError(404, 'Booking not found.');

  const payment = await Payment.findOne({ bookingId: booking._id, isDeleted: false });

  res.json({ success: true, booking, payment });
});

// GET /api/admin/bookings — admin sees all including deleted if requested
const getAllBookings = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20, includeDeleted } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (!includeDeleted) filter.isDeleted = false;

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate('studentId', 'name email phone')
    .populate({ path: 'slotId', populate: { path: 'categoryId', select: 'name icon' } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, bookings, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
});

// PUT /api/admin/bookings/:id/cancel
const cancelBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('studentId', 'name email')
    .populate('slotId', 'title startTime endTime bookedCount');

  if (!booking || booking.isDeleted) throw new ApiError(404, 'Booking not found.');
  if (['cancelled', 'completed'].includes(booking.status)) {
    throw new ApiError(400, `Booking is already ${booking.status}.`);
  }

  const prevStatus = booking.status;
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user._id;
  await booking.save();

  // Decrement slot booked count if it was confirmed
  if (['confirmed', 'under_review', 'submitted'].includes(prevStatus)) {
    await SessionSlot.findByIdAndUpdate(booking.slotId._id, { $inc: { bookedCount: -1 } });
  }

  try {
    await sendBookingCancellation({
      studentEmail: booking.studentId.email,
      studentName: booking.studentId.name,
      bookingRef: booking.bookingRef,
      slotTitle: booking.slotId.title,
    });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }

  res.json({ success: true, booking });
});

// PUT /api/admin/bookings/:id/meet-link — admin sets meet link on a specific booking
const updateMeetLink = catchAsync(async (req, res) => {
  const { meetLink } = req.body;
  if (!meetLink || !meetLink.trim()) throw new ApiError(400, 'Meet link is required.');

  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.isDeleted) throw new ApiError(404, 'Booking not found.');
  if (booking.status !== 'confirmed') throw new ApiError(400, 'Meet link can only be set on confirmed bookings.');

  booking.meetLink = meetLink.trim();
  await booking.save();

  res.json({ success: true, booking });
});

module.exports = { createBooking, getMyBookings, getBookingStatus, getAllBookings, cancelBooking, updateMeetLink };
