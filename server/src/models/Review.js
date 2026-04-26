const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', unique: true, sparse: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionSlot' },
    // Used for admin-created testimonials
    isAdminCreated: { type: Boolean, default: false },
    reviewerName: { type: String, trim: true },
    reviewerRole: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNotes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
