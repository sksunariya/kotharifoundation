const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getDashboard, getUsers, updateUser, deleteUser } = require('../controllers/adminController');
const { getAdminConfig, updateConfig, uploadBranding } = require('../controllers/configController');
const { createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { createSlot, updateSlot, deleteSlot } = require('../controllers/slotController');
const { getAllBookings, cancelBooking, updateMeetLink } = require('../controllers/bookingController');
const { getAdminPayments, verifyPayment, rejectPayment } = require('../controllers/paymentController');
const { getAdminInstructors, createInstructor, updateInstructor, deleteInstructor } = require('../controllers/instructorController');
const { getAdminResources, createResource, uploadResource, updateResource, deleteResource } = require('../controllers/resourceController');
const { getAdminReviews, createAdminReview, updateReview, approveReview, rejectReview, deleteReview } = require('../controllers/reviewController');
const { getAdminQueries, updateQuery, deleteQuery } = require('../controllers/queryController');
const { getAllSlides, createSlide, updateSlide, deleteSlide, reorderSlides } = require('../controllers/carouselController');
const { imageUpload, mediaUpload } = require('../services/upload');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Config
router.get('/config', getAdminConfig);
router.put('/config', updateConfig);
router.post('/config/branding', imageUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), uploadBranding);

// Categories
router.post('/categories', imageUpload.single('icon'), createCategory);
router.put('/categories/:id', imageUpload.single('icon'), updateCategory);
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

// Instructors
router.get('/instructors', getAdminInstructors);
router.post('/instructors', imageUpload.single('photo'), createInstructor);
router.put('/instructors/:id', imageUpload.single('photo'), updateInstructor);
router.delete('/instructors/:id', deleteInstructor);

// Resources
router.get('/resources/:slotId', getAdminResources);
router.post('/resources', createResource);
router.put('/resources/:id', updateResource);
router.delete('/resources/:id', deleteResource);
router.post('/resources/upload', mediaUpload.single('file'), uploadResource);

// Reviews
router.get('/reviews', getAdminReviews);
router.post('/reviews', createAdminReview);
router.put('/reviews/:id', updateReview);
router.put('/reviews/:id/approve', approveReview);
router.put('/reviews/:id/reject', rejectReview);
router.delete('/reviews/:id', deleteReview);

// Queries
router.get('/queries', getAdminQueries);
router.put('/queries/:id', updateQuery);
router.delete('/queries/:id', deleteQuery);

// Carousel
router.get('/carousel', getAllSlides);
router.post('/carousel', imageUpload.single('image'), createSlide);
router.put('/carousel/reorder', reorderSlides);
router.put('/carousel/:id', imageUpload.single('image'), updateSlide);
router.delete('/carousel/:id', deleteSlide);

module.exports = router;
