const multer = require('multer');
const { randomUUID } = require('crypto');
const path = require('path');
const { putObject, deleteS3Object } = require('./s3');

// ── Multer instances ───────────────────────────────────────────────────────────

/** For image uploads (carousel, profile photos, etc.) — max 10 MB */
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted.'), false);
  },
});

/**
 * For payment screenshot uploads (images + PDFs for scanned receipts) — max 5 MB.
 * Kept separate from imageUpload because it allows PDFs and uses a tighter size limit.
 */
const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only image files or PDF are allowed.'), false);
  },
});

/** For session resource uploads (video, PDF) — limit via AWS_UPLOAD_LIMIT_MB env var */
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.AWS_UPLOAD_LIMIT_MB || '500', 10) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only video and PDF files are accepted.'), false);
  },
});

// ── S3 helpers ────────────────────────────────────────────────────────────────

/**
 * Upload a multer file buffer to S3.
 *
 * Pass `folder` to auto-generate a UUID-based key inside that folder.
 * Pass `customKey` to use an explicit S3 key (resource controller does its own naming).
 *
 * @param {Express.Multer.File} file
 * @param {string|null} folder  - e.g. 'carousel-images'
 * @param {string} [customKey] - overrides auto key when provided
 * @returns {Promise<string>} the S3 key used
 */
const uploadToS3 = async (file, folder, customKey) => {
  const key = customKey ?? `${folder}/${randomUUID()}${path.extname(file.originalname)}`;
  await putObject(key, file.buffer, file.mimetype);
  return key;
};

/**
 * Delete an S3 object by key. Silently swallows errors (object may already be gone).
 * @param {string|null} s3Key
 */
const deleteFromS3 = async (s3Key) => {
  if (!s3Key) return;
  await deleteS3Object(s3Key).catch(() => {});
};

module.exports = { imageUpload, screenshotUpload, mediaUpload, uploadToS3, deleteFromS3 };
