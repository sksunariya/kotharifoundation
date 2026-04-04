const multer = require('multer');

// Files are held in memory (Buffer) so the controller can stream them straight
// to S3 via PutObjectCommand — nothing is written to disk.
// 500 MB ceiling is sufficient for compressed session recordings.
// Raise AWS_UPLOAD_LIMIT_MB in .env for larger files if needed.
const limitMB = parseInt(process.env.AWS_UPLOAD_LIMIT_MB || '500', 10);

const s3Upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: limitMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only video and PDF files are accepted.'), false);
    }
  },
});

module.exports = s3Upload;
