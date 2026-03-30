const express = require('express');
const router = express.Router();
const { submitPayment, resubmitPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(protect);
router.post('/', upload.single('screenshot'), submitPayment);
router.put('/:id/resubmit', upload.single('screenshot'), resubmitPayment);

module.exports = router;
