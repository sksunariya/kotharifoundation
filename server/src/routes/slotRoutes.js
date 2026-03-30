const express = require('express');
const router = express.Router();
const { getSlots, getSlot } = require('../controllers/slotController');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return require('../middleware/auth').protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getSlots);
router.get('/:id', getSlot);

module.exports = router;
