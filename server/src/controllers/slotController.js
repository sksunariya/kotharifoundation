const SessionSlot = require('../models/SessionSlot');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// GET /api/slots
const getSlots = catchAsync(async (req, res) => {
  const { category, upcoming } = req.query;
  const filter = {};

  if (req.user?.role !== 'admin') {
    filter.isActive = true;
    filter.isDeleted = false;  // users never see deleted slots
  }

  if (category) filter.categoryId = category;
  if (upcoming === 'true') filter.startTime = { $gte: new Date() };

  const slots = await SessionSlot.find(filter)
    .populate('categoryId', 'name slug icon')
    .populate('mentorId', 'name avatar')
    .sort({ startTime: 1 });

  res.json({ success: true, slots });
});

// GET /api/slots/:id
const getSlot = catchAsync(async (req, res) => {
  const slot = await SessionSlot.findById(req.params.id)
    .populate('categoryId', 'name slug icon description')
    .populate('mentorId', 'name avatar');

  if (!slot || (slot.isDeleted && req.user?.role !== 'admin')) {
    throw new ApiError(404, 'Session slot not found.');
  }
  res.json({ success: true, slot });
});

// POST /api/admin/slots
const createSlot = catchAsync(async (req, res) => {
  const slot = await SessionSlot.create(req.body);
  await slot.populate('categoryId', 'name slug icon');
  res.status(201).json({ success: true, slot });
});

// PUT /api/admin/slots/:id
const updateSlot = catchAsync(async (req, res) => {
  const slot = await SessionSlot.findById(req.params.id);
  if (!slot) throw new ApiError(404, 'Session slot not found.');

  Object.assign(slot, req.body);
  await slot.save();
  await slot.populate('categoryId', 'name slug icon');
  res.json({ success: true, slot });
});

// DELETE /api/admin/slots/:id — soft delete
const deleteSlot = catchAsync(async (req, res) => {
  const slot = await SessionSlot.findById(req.params.id);
  if (!slot) throw new ApiError(404, 'Session slot not found.');
  slot.isDeleted = true;
  slot.deletedAt = new Date();
  await slot.save();
  res.json({ success: true, message: 'Slot deleted.' });
});

module.exports = { getSlots, getSlot, createSlot, updateSlot, deleteSlot };
