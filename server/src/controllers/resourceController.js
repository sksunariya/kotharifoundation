const Resource     = require('../models/Resource');
const Booking      = require('../models/Booking');
const SessionSlot  = require('../models/SessionSlot');
const ApiError     = require('../utils/ApiError');
const catchAsync   = require('../utils/catchAsync');
const { getPresignedUrl, putObject } = require('../services/s3');

// ── S3 key naming ─────────────────────────────────────────────────────────────
// e.g. sessions/abc123/2025-04-05_14-30_dsa_crash_course_recording.mp4
// Extract YYYY-MM-DD and HH-MM in IST regardless of server timezone
const toISTParts = (d) => {
  const parts = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).forEach(({ type, value }) => { parts[type] = value; });
  return parts;
};

const makeS3Key = (slot, type, index, mimeType) => {
  const d = new Date(slot.startTime);
  const p = toISTParts(d);
  const date = `${p.year}-${p.month}-${p.day}`;
  const time = `${p.hour}-${p.minute}`;
  const name = slot.title.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase().slice(0, 30);
  const suffix = type === 'video'
    ? (index === 0 ? 'recording' : `video_${index + 1}`)
    : `pdf_${index + 1}`;
  const ext = mimeType === 'application/pdf' ? 'pdf' : 'mp4';
  return `sessions/${slot._id}/${date}_${time}_${name}_${suffix}.${ext}`;
};

// ── Attach presigned GET URL to a resource object ────────────────────────────
const withSignedUrl = async (resource) => {
  const r = resource.toObject ? resource.toObject() : { ...resource };
  if ((r.type === 'video' || r.type === 'pdf') && r.s3Key) {
    try {
      r.signedUrl = await getPresignedUrl(r.s3Key, r.type, r.s3Bucket);
    } catch {
      r.signedUrl = null;
    }
  }
  return r;
};

// ─────────────────────────────────────────────
// STUDENT  GET /api/resources/:slotId
// ─────────────────────────────────────────────
const getResources = catchAsync(async (req, res) => {
  const { slotId } = req.params;

  const booking = await Booking.findOne({
    slotId,
    studentId: req.user._id,
    status: 'confirmed',
    isDeleted: false,
  });
  if (!booking) {
    throw new ApiError(403, 'Resources are only available after your booking is confirmed.');
  }

  const resources = await Resource.find({ slotId, isActive: true, isDeleted: false })
    .sort({ sortOrder: 1, createdAt: 1 });

  const signed = await Promise.all(resources.map(withSignedUrl));

  res.json({
    success: true,
    videos: signed.filter(r => r.type === 'video'),
    pdfs:   signed.filter(r => r.type === 'pdf'),
    links:  signed.filter(r => r.type === 'link'),
  });
});

// ─────────────────────────────────────────────
// ADMIN  GET /api/admin/resources/:slotId
// ─────────────────────────────────────────────
const getAdminResources = catchAsync(async (req, res) => {
  const resources = await Resource.find({ slotId: req.params.slotId, isDeleted: false })
    .sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, resources });
});

// ─────────────────────────────────────────────
// ADMIN  POST /api/admin/resources/upload
// Receives multipart file, uploads to S3 server-side, saves DB record.
// ─────────────────────────────────────────────
const uploadResource = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');

  const { slotId, type, title, isRecording } = req.body;
  if (!slotId || !type || !title) throw new ApiError(400, 'slotId, type, and title are required.');

  const slot = await SessionSlot.findById(slotId);
  if (!slot || slot.isDeleted) throw new ApiError(404, 'Session slot not found.');

  // Count existing to determine index for filename
  const existingCount = await Resource.countDocuments({ slotId, type, isDeleted: false });
  const s3Key = makeS3Key(slot, type, existingCount, req.file.mimetype);

  // Upload buffer → S3
  await putObject(s3Key, req.file.buffer, req.file.mimetype);

  // Enforce single recording per slot
  const markAsRecording = isRecording === 'true' && type === 'video';
  if (markAsRecording) {
    await Resource.updateMany({ slotId, isRecording: true }, { isRecording: false });
  }

  const resource = await Resource.create({
    slotId,
    type,
    title,
    s3Key,
    isRecording: markAsRecording,
  });

  res.status(201).json({ success: true, resource });
});

// ─────────────────────────────────────────────
// ADMIN  POST /api/admin/resources  (link-only, no file)
// ─────────────────────────────────────────────
const createResource = catchAsync(async (req, res) => {
  const { slotId, type, title, url } = req.body;
  if (!slotId || !type || !title) throw new ApiError(400, 'slotId, type, and title are required.');
  if (type !== 'link') throw new ApiError(400, 'Use /upload for video and PDF resources.');
  if (!url) throw new ApiError(400, 'URL is required for link resources.');

  const resource = await Resource.create({ slotId, type, title, url });
  res.status(201).json({ success: true, resource });
});

// ─────────────────────────────────────────────
// ADMIN  PUT /api/admin/resources/:id
// ─────────────────────────────────────────────
const updateResource = catchAsync(async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.id, isDeleted: false });
  if (!resource) throw new ApiError(404, 'Resource not found.');

  if (req.body.isRecording && resource.type === 'video') {
    await Resource.updateMany(
      { slotId: resource.slotId, isRecording: true, _id: { $ne: resource._id } },
      { isRecording: false }
    );
  }

  Object.assign(resource, req.body);
  await resource.save();
  res.json({ success: true, resource });
});

// ─────────────────────────────────────────────
// ADMIN  DELETE /api/admin/resources/:id
// ─────────────────────────────────────────────
const deleteResource = catchAsync(async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.id, isDeleted: false });
  if (!resource) throw new ApiError(404, 'Resource not found.');
  resource.isDeleted = true;
  resource.deletedAt = new Date();
  await resource.save();
  res.json({ success: true, message: 'Resource removed.' });
});

module.exports = {
  getResources,
  getAdminResources,
  uploadResource,
  createResource,
  updateResource,
  deleteResource,
};
