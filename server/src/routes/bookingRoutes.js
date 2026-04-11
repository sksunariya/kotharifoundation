const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBookingStatus, getResubmitDetails } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/status/:ref', getBookingStatus); // public
router.use(protect);
router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id/resubmit-details', getResubmitDetails);

module.exports = router;
