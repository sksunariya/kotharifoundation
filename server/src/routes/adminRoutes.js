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
const { getAdminInstructors, createInstructor, updateInstructor, deleteInstructor } = require('../controllers/instructorController');
const { getAdminResources, createResource, uploadResource, updateResource, deleteResource } = require('../controllers/resourceController');
const { getAdminReviews, approveReview, rejectReview, deleteReview } = require('../controllers/reviewController');
const { getAdminQueries, updateQuery, deleteQuery } = require('../controllers/queryController');
const { getAllSlides, createSlide, updateSlide, deleteSlide, reorderSlides } = require('../controllers/carouselController');
const s3Upload = require('../config/s3Upload');
const carouselUpload = require('../config/carouselUpload');

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

// Instructors
router.get('/instructors', getAdminInstructors);
router.post('/instructors', createInstructor);
router.put('/instructors/:id', updateInstructor);
router.delete('/instructors/:id', deleteInstructor);

// Resources
router.get('/resources/:slotId', getAdminResources);
router.post('/resources', createResource);
router.put('/resources/:id', updateResource);
router.delete('/resources/:id', deleteResource);
router.post('/resources/upload', s3Upload.single('file'), uploadResource);

// Reviews
router.get('/reviews', getAdminReviews);
router.put('/reviews/:id/approve', approveReview);
router.put('/reviews/:id/reject', rejectReview);
router.delete('/reviews/:id', deleteReview);

// Queries
router.get('/queries', getAdminQueries);
router.put('/queries/:id', updateQuery);
router.delete('/queries/:id', deleteQuery);

// Carousel
router.get('/carousel', getAllSlides);
router.post('/carousel', carouselUpload.single('image'), createSlide);
router.put('/carousel/reorder', reorderSlides);
router.put('/carousel/:id', carouselUpload.single('image'), updateSlide);
router.delete('/carousel/:id', deleteSlide);

module.exports = router;
