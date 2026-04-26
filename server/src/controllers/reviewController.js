const Review = require('../models/Review');
const Booking = require('../models/Booking');
const SiteConfig = require('../models/SiteConfig');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// POST /api/reviews — student submits a review for a completed booking
const submitReview = catchAsync(async (req, res) => {
  const { bookingId, rating, content } = req.body;
  if (!bookingId || !rating || !content) throw new ApiError(400, 'bookingId, rating, and content are required.');

  const config = await SiteConfig.getConfig();
  if (!config.allowReviews) throw new ApiError(403, 'Reviews are currently disabled.');

  const booking = await Booking.findOne({ _id: bookingId, studentId: req.user._id, isDeleted: false });
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (booking.status !== 'completed') throw new ApiError(400, 'Reviews can only be submitted for completed sessions.');

  const existing = await Review.findOne({ bookingId, isDeleted: false });
  if (existing) throw new ApiError(400, 'You have already submitted a review for this booking.');

  const status = config.requireReviewApproval ? 'pending' : 'approved';
  const review = await Review.create({
    bookingId,
    studentId: req.user._id,
    slotId: booking.slotId,
    rating: Number(rating),
    content,
    status,
  });

  res.status(201).json({ success: true, review, message: config.requireReviewApproval ? 'Review submitted and awaiting approval.' : 'Review published.' });
});

// GET /api/reviews/published — public, approved reviews
const getPublishedReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ status: 'approved', isDeleted: false })
    .populate('studentId', 'name avatar')
    .populate('slotId', 'title')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, reviews });
});

// GET /api/reviews/my — student's own reviews
const getMyReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ studentId: req.user._id, isDeleted: false })
    .select('bookingId status rating content createdAt')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});

// GET /api/admin/reviews
const getAdminReviews = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = { isDeleted: false };
  if (status) filter.status = status;

  const reviews = await Review.find(filter)
    .populate('studentId', 'name email')
    .populate('slotId', 'title')
    .populate('bookingId', 'bookingRef')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});

// POST /api/admin/reviews — admin creates a testimonial directly
const createAdminReview = catchAsync(async (req, res) => {
  const { reviewerName, reviewerRole, rating, content } = req.body;
  if (!reviewerName || !rating || !content) throw new ApiError(400, 'reviewerName, rating, and content are required.');

  const review = await Review.create({
    isAdminCreated: true,
    reviewerName,
    reviewerRole: reviewerRole || '',
    rating: Number(rating),
    content,
    status: 'approved',
  });

  res.status(201).json({ success: true, review });
});

// PUT /api/admin/reviews/:id — admin edits a review
const updateReview = catchAsync(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, isDeleted: false });
  if (!review) throw new ApiError(404, 'Review not found.');

  const { rating, content, reviewerName, reviewerRole, adminNotes } = req.body;
  if (rating !== undefined) review.rating = Number(rating);
  if (content !== undefined) review.content = content;
  if (reviewerName !== undefined) review.reviewerName = reviewerName;
  if (reviewerRole !== undefined) review.reviewerRole = reviewerRole;
  if (adminNotes !== undefined) review.adminNotes = adminNotes;

  await review.save();
  res.json({ success: true, review });
});

// PUT /api/admin/reviews/:id/approve
const approveReview = catchAsync(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, isDeleted: false });
  if (!review) throw new ApiError(404, 'Review not found.');

  review.status = 'approved';
  if (req.body.adminNotes !== undefined) review.adminNotes = req.body.adminNotes;
  if (req.body.rating !== undefined) review.rating = Number(req.body.rating);
  if (req.body.content !== undefined) review.content = req.body.content;

  await review.save();
  res.json({ success: true, review });
});

// PUT /api/admin/reviews/:id/reject
const rejectReview = catchAsync(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, isDeleted: false });
  if (!review) throw new ApiError(404, 'Review not found.');

  review.status = 'rejected';
  if (req.body.adminNotes !== undefined) review.adminNotes = req.body.adminNotes;

  await review.save();
  res.json({ success: true, review });
});

// DELETE /api/admin/reviews/:id
const deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, isDeleted: false });
  if (!review) throw new ApiError(404, 'Review not found.');
  review.isDeleted = true;
  await review.save();
  res.json({ success: true, message: 'Review deleted.' });
});

module.exports = { submitReview, getPublishedReviews, getMyReviews, getAdminReviews, createAdminReview, updateReview, approveReview, rejectReview, deleteReview };
