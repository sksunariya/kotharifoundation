const Instructor = require('../models/Instructor');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// GET /api/instructors  — public, active only
const getInstructors = catchAsync(async (req, res) => {
  const instructors = await Instructor.find({ isActive: true, isDeleted: false })
    .sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, instructors });
});

// GET /api/instructors/:id  — public
const getInstructor = catchAsync(async (req, res) => {
  const instructor = await Instructor.findOne({ _id: req.params.id, isActive: true, isDeleted: false });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');
  res.json({ success: true, instructor });
});

// POST /api/admin/instructors
const createInstructor = catchAsync(async (req, res) => {
  const instructor = await Instructor.create(req.body);
  res.status(201).json({ success: true, instructor });
});

// PUT /api/admin/instructors/:id
const updateInstructor = catchAsync(async (req, res) => {
  const instructor = await Instructor.findOne({ _id: req.params.id, isDeleted: false });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');
  Object.assign(instructor, req.body);
  await instructor.save();
  res.json({ success: true, instructor });
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
  res.json({ success: true, instructors });
});

module.exports = { getInstructors, getInstructor, createInstructor, updateInstructor, deleteInstructor, getAdminInstructors };
