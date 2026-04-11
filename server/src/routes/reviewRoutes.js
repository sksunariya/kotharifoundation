const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitReview, getPublishedReviews, getMyReviews } = require('../controllers/reviewController');

router.get('/published', getPublishedReviews);
router.post('/', protect, submitReview);
router.get('/my', protect, getMyReviews);

module.exports = router;
