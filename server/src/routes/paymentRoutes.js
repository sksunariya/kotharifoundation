const express = require('express');
const router = express.Router();
const { submitPayment, resubmitPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { screenshotUpload } = require('../services/upload');

router.use(protect);
router.post('/', screenshotUpload.single('screenshot'), submitPayment);
router.put('/:id/resubmit', screenshotUpload.single('screenshot'), resubmitPayment);

module.exports = router;
