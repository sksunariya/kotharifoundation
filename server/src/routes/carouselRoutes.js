const express = require('express');
const router = express.Router();
const { getPublicSlides } = require('../controllers/carouselController');

router.get('/', getPublicSlides);

module.exports = router;
