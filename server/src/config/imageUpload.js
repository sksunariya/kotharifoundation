const multer = require('multer');

// Accepts images (JPEG, PNG, WebP, etc.) and PDFs for payment screenshots.
// 5 MB ceiling keeps storage costs in check while supporting scanned receipts.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, etc.) or PDF are allowed'), false);
    }
  },
});

module.exports = { upload };
