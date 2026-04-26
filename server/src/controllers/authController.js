const crypto = require('crypto');
const User = require('../models/User');
const SiteConfig = require('../models/SiteConfig');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendTokens, verifyRefreshToken, generateAccessToken } = require('../utils/tokenHelper');
const { sendPasswordReset, sendOtpEmail } = require('../services/email');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
// Creates user (unverified), sends OTP. Does NOT log in yet.
const register = catchAsync(async (req, res) => {
  const { name, email, password, phone, institute } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new ApiError(400, 'Email already registered.');
    }
    // Update user details in case they changed them and resend OTP
    existingUser.name = name;
    if (phone) existingUser.phone = phone;
    if (institute) existingUser.institute = institute;
    existingUser.password = password; // triggers pre-save hash
    const otp = generateOtp();
    existingUser.emailVerificationOtp = otp;
    existingUser.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await existingUser.save();
    await sendOtpEmail({ email: existingUser.email, name: existingUser.name, otp });
    return res.json({ success: true, requiresVerification: true, message: 'OTP resent to your email.' });
  }

  const otp = generateOtp();
  const user = new User({
    name,
    email,
    password,
    phone,
    institute,
    isEmailVerified: false,
    emailVerificationOtp: otp,
    emailVerificationOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
  });
  await user.save();

  await sendOtpEmail({ email: user.email, name: user.name, otp });

  res.status(201).json({ success: true, requiresVerification: true, message: 'OTP sent to your email. Please verify to complete registration.' });
});

// POST /api/auth/verify-otp
const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, 'Email and OTP are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+emailVerificationOtp +emailVerificationOtpExpires');
  if (!user) throw new ApiError(400, 'Invalid request.');
  if (user.isEmailVerified) throw new ApiError(400, 'Email already verified.');
  if (!user.emailVerificationOtp || user.emailVerificationOtpExpires < Date.now()) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }
  if (user.emailVerificationOtp !== otp.trim()) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  user.isEmailVerified = true;
  user.isVerified = true;
  user.emailVerificationOtp = undefined;
  user.emailVerificationOtpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendTokens(res, user, 200);
});

// POST /api/auth/resend-otp
const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(400, 'No account found with this email.');
  if (user.isEmailVerified) throw new ApiError(400, 'Email already verified.');

  const otp = generateOtp();
  user.emailVerificationOtp = otp;
  user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendOtpEmail({ email: user.email, name: user.name, otp });
  res.json({ success: true, message: 'OTP resent to your email.' });
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
  if (!user.isEmailVerified) throw new ApiError(403, 'Please verify your email before logging in.');

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

  if (user && user.isActive) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Use siteUrl from config or fall back to env variable
    const config = await SiteConfig.getConfig();
    const baseUrl = (config.siteUrl && config.siteUrl.trim()) || process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password/${rawToken}`;

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

module.exports = { register, login, refresh, logout, getMe, forgotPassword, resetPassword, verifyOtp, resendOtp };
