require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { startAutoScheduler } = require('./services/autoScheduler');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const resourceRoutes  = require('./routes/resourceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const queryRoutes = require('./routes/queryRoutes');
const carouselRoutes = require('./routes/carouselRoutes');

const app = express();

// Connect to database
connectDB();

// Start background jobs
startAutoScheduler();

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // cache preflight for 24 hours — eliminates repeated OPTIONS requests
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logger
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/carousel', carouselRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
