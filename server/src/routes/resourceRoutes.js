const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getResources } = require('../controllers/resourceController');

// GET /api/resources/:slotId  — student, must have confirmed booking
router.get('/:slotId', protect, getResources);

module.exports = router;
