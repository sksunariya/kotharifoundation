const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitQuery } = require('../controllers/queryController');

const queryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many queries submitted. Please try again later.' },
});

router.post('/', queryLimiter, submitQuery);

module.exports = router;
