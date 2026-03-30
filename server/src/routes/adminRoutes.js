const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getDashboard, getUsers, updateUser, deleteUser } = require('../controllers/adminController');
const { getAdminConfig, updateConfig } = require('../controllers/configController');
const { createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { createSlot, updateSlot, deleteSlot } = require('../controllers/slotController');
const { getAllBookings, cancelBooking, updateMeetLink } = require('../controllers/bookingController');
const { getAdminPayments, verifyPayment, rejectPayment } = require('../controllers/paymentController');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Config
router.get('/config', getAdminConfig);
router.put('/config', updateConfig);

// Categories
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Slots
router.post('/slots', createSlot);
router.put('/slots/:id', updateSlot);
router.delete('/slots/:id', deleteSlot);

// Bookings
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/bookings/:id/meet-link', updateMeetLink);

// Payments
router.get('/payments', getAdminPayments);
router.put('/payments/:id/verify', verifyPayment);
router.put('/payments/:id/reject', rejectPayment);

// Users
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
