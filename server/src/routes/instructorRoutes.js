const express = require('express');
const router = express.Router();
const { getInstructors, getInstructor } = require('../controllers/instructorController');

router.get('/', getInstructors);
router.get('/:id', getInstructor);

module.exports = router;
