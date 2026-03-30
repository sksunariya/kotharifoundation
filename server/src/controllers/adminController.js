const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const SessionSlot = require('../models/SessionSlot');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// GET /api/admin/dashboard
const getDashboard = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalBookings,
    pendingPayments,
    confirmedBookings,
    totalRevenue,
    recentBookings,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isDeleted: false }),
    Booking.countDocuments({ isDeleted: false }),
    Payment.countDocuments({ status: { $in: ['submitted', 'under_review'] }, isDeleted: false }),
    Booking.countDocuments({ status: 'confirmed', isDeleted: false }),
    Payment.aggregate([{ $match: { status: 'verified', isDeleted: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Booking.find({ isDeleted: false })
      .populate('studentId', 'name email')
      .populate({ path: 'slotId', select: 'title startTime', populate: { path: 'categoryId', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalBookings,
      pendingPayments,
      confirmedBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
    recentBookings,
  });
});

// GET /api/admin/users  — admin sees all users including soft-deleted
const getUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20, search, includeDeleted } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (!includeDeleted) filter.isDeleted = false;
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
});

// PUT /api/admin/users/:id
const updateUser = catchAsync(async (req, res) => {
  const { isActive, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Cannot modify your own account via admin panel.');
  }
  if (isActive !== undefined) user.isActive = isActive;
  if (role) user.role = role;
  await user.save();
  res.json({ success: true, user });
});

// DELETE /api/admin/users/:id — soft delete
const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Cannot delete your own account.');
  }
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'User deleted.' });
});

module.exports = { getDashboard, getUsers, updateUser, deleteUser };
