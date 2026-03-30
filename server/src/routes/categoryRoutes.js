const express = require('express');
const router = express.Router();
const { getCategories, getCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

// Optional auth — admin sees inactive categories too
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return require('../middleware/auth').protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getCategories);
router.get('/:id', getCategory);

module.exports = router;
