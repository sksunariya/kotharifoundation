const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendTokens, verifyRefreshToken, generateAccessToken } = require('../utils/tokenHelper');
const { sendPasswordReset } = require('../services/email');

// POST /api/auth/register
const register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(400, 'Email already registered.');

  const user = await User.create({ name, email, password, phone });
  sendTokens(res, user, 201);
});

// POST /api/auth/login
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Please provide email and password.');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated.');

  sendTokens(res, user);
});

// POST /api/auth/refresh
const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided.');

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid refresh token.');

  const accessToken = generateAccessToken(user._id);
  res.json({ success: true, accessToken });
});

// POST /api/auth/logout
const logout = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
const getMe = catchAsync(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/forgot-password
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Please provide your email address.');

  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

  // Always respond the same way to prevent email enumeration
  if (user && user.isActive) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    try {
      await sendPasswordReset({ email: user.email, name: user.name, resetUrl });
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new ApiError(500, 'Failed to send reset email. Please try again.');
    }
  }

  res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
});

// POST /api/auth/reset-password/:token
const resetPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    isDeleted: false,
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired.');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokens(res, user);
});

module.exports = { register, login, refresh, logout, getMe, forgotPassword, resetPassword };
