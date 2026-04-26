const mongoose = require('mongoose');

const sessionSlotSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, default: 1, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    meetLink: { type: String },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    autoSchedule: { type: Boolean, default: false },
    autoScheduleDays: { type: Number, default: 2, min: 1 },
  },
  { timestamps: true }
);

sessionSlotSchema.virtual('isFull').get(function () {
  return this.bookedCount >= this.capacity;
});

sessionSlotSchema.virtual('availableSpots').get(function () {
  return Math.max(0, this.capacity - this.bookedCount);
});

sessionSlotSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SessionSlot', sessionSlotSchema);
