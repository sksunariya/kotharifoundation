const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/status/:ref', getBookingStatus); // public
router.use(protect);
router.post('/', createBooking);
router.get('/my', getMyBookings);

module.exports = router;
