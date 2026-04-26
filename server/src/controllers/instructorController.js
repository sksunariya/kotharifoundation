const Instructor = require('../models/Instructor');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { uploadToS3, deleteFromS3 } = require('../services/upload');
const { getImagePresignedUrl } = require('../services/s3');

// Resolve the photo URL: generate a presigned URL if stored in S3,
// otherwise return the plain external URL stored in `photo`.
const resolvePhoto = async (instructor) => {
  const obj = instructor.toObject ? instructor.toObject() : { ...instructor };
  if (obj.s3Key) {
    obj.photo = await getImagePresignedUrl(obj.s3Key);
  }
  return obj;
};

// GET /api/instructors  — public, active only
const getInstructors = catchAsync(async (req, res) => {
  const instructors = await Instructor.find({ isActive: true, isDeleted: false })
    .sort({ sortOrder: 1, createdAt: 1 });
  const resolved = await Promise.all(instructors.map(resolvePhoto));
  res.json({ success: true, instructors: resolved });
});

// GET /api/instructors/:id  — public
const getInstructor = catchAsync(async (req, res) => {
  const instructor = await Instructor.findOne({ _id: req.params.id, isActive: true, isDeleted: false });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');
  const resolved = await resolvePhoto(instructor);
  res.json({ success: true, instructor: resolved });
});

// POST /api/admin/instructors
const createInstructor = catchAsync(async (req, res) => {
  const body = { ...req.body };

  // Parse JSON-encoded fields sent via FormData
  if (typeof body.expertise === 'string') {
    try { body.expertise = JSON.parse(body.expertise); } catch { body.expertise = body.expertise.split(',').map(s => s.trim()).filter(Boolean); }
  }
  if (typeof body.qualifications === 'string') {
    try { body.qualifications = JSON.parse(body.qualifications); } catch { /* leave as-is */ }
  }
  if (typeof body.achievements === 'string') {
    try { body.achievements = JSON.parse(body.achievements); } catch { /* leave as-is */ }
  }
  if (typeof body.socialLinks === 'string') {
    try { body.socialLinks = JSON.parse(body.socialLinks); } catch { /* leave as-is */ }
  }
  if (body.isActive !== undefined) body.isActive = body.isActive === 'true' || body.isActive === true;
  if (body.experience !== undefined && body.experience !== '') body.experience = Number(body.experience);

  // Handle uploaded photo file
  if (req.file) {
    body.s3Key = await uploadToS3(req.file, 'instructor-photos');
    body.photo = ''; // stored in S3, not as an external URL
  }

  const instructor = await Instructor.create(body);
  const resolved = await resolvePhoto(instructor);
  res.status(201).json({ success: true, instructor: resolved });
});

// PUT /api/admin/instructors/:id
const updateInstructor = catchAsync(async (req, res) => {
  const instructor = await Instructor.findOne({ _id: req.params.id, isDeleted: false });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');

  const body = { ...req.body };

  // Parse JSON-encoded fields sent via FormData
  if (typeof body.expertise === 'string') {
    try { body.expertise = JSON.parse(body.expertise); } catch { body.expertise = body.expertise.split(',').map(s => s.trim()).filter(Boolean); }
  }
  if (typeof body.qualifications === 'string') {
    try { body.qualifications = JSON.parse(body.qualifications); } catch { /* leave as-is */ }
  }
  if (typeof body.achievements === 'string') {
    try { body.achievements = JSON.parse(body.achievements); } catch { /* leave as-is */ }
  }
  if (typeof body.socialLinks === 'string') {
    try { body.socialLinks = JSON.parse(body.socialLinks); } catch { /* leave as-is */ }
  }
  if (body.isActive !== undefined) body.isActive = body.isActive === 'true' || body.isActive === true;
  if (body.experience !== undefined && body.experience !== '') body.experience = Number(body.experience);

  if (req.file) {
    // New file uploaded — replace old S3 object if there was one
    await deleteFromS3(instructor.s3Key);
    body.s3Key = await uploadToS3(req.file, 'instructor-photos');
    body.photo = '';
  } else if (body.photo !== undefined && body.photo !== '') {
    // Admin switched to an external URL — remove any stored S3 object
    await deleteFromS3(instructor.s3Key);
    body.s3Key = null;
  }

  Object.assign(instructor, body);
  await instructor.save();
  const resolved = await resolvePhoto(instructor);
  res.json({ success: true, instructor: resolved });
});

// DELETE /api/admin/instructors/:id  — soft delete
const deleteInstructor = catchAsync(async (req, res) => {
  const instructor = await Instructor.findOne({ _id: req.params.id, isDeleted: false });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');
  instructor.isDeleted = true;
  instructor.deletedAt = new Date();
  await instructor.save();
  res.json({ success: true, message: 'Instructor deleted.' });
});

// GET /api/admin/instructors  — admin, includes inactive
const getAdminInstructors = catchAsync(async (req, res) => {
  const instructors = await Instructor.find({ isDeleted: false }).sort({ sortOrder: 1, createdAt: 1 });
  const resolved = await Promise.all(instructors.map(resolvePhoto));
  res.json({ success: true, instructors: resolved });
});

module.exports = { getInstructors, getInstructor, createInstructor, updateInstructor, deleteInstructor, getAdminInstructors };
