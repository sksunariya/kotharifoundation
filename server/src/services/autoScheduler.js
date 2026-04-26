const cron = require('node-cron');
const SessionSlot = require('../models/SessionSlot');
const Booking = require('../models/Booking');

const rescheduleExpiredSlots = async () => {
  const now = new Date();

  // Find slots whose session has fully ended and have auto-schedule enabled
  const expiredSlots = await SessionSlot.find({
    isDeleted: false,
    autoSchedule: true,
    endTime: { $lt: now },
  });

  if (expiredSlots.length === 0) return;

  for (const slot of expiredSlots) {
    // Check if there are any active bookings (cancelled and rejected don't count —
    // rejected means payment was declined, no confirmed spot exists)
    const bookingCount = await Booking.countDocuments({
      slotId: slot._id,
      isDeleted: false,
      status: { $nin: ['cancelled', 'rejected'] },
    });

    if (bookingCount > 0) continue;

    // Shift start/end times forward by the minimum number of autoScheduleDays
    // intervals needed to land in the future
    const shiftMs = slot.autoScheduleDays * 24 * 60 * 60 * 1000;
    const intervalsPassed = Math.ceil((now - slot.startTime) / shiftMs);
    const totalShiftMs = intervalsPassed * shiftMs;

    slot.startTime = new Date(slot.startTime.getTime() + totalShiftMs);
    slot.endTime = new Date(slot.endTime.getTime() + totalShiftMs);
    await slot.save();

    console.log(
      `[autoScheduler] Rescheduled slot "${slot.title}" (${slot._id}) → new start: ${slot.startTime.toISOString()}`
    );
  }
};

const startAutoScheduler = () => {
  // Run at 00:00 (midnight) and 06:00 every day.
  // Redundant updates are structurally impossible: once a slot is rescheduled
  // its endTime moves to the future, so the second run's { $lt: now } query
  // never matches the same slot again within the same day.
  cron.schedule('0 0,6 * * *', async () => {
    try {
      await rescheduleExpiredSlots();
    } catch (err) {
      console.error('[autoScheduler] Error:', err.message);
    }
  });

  console.log('[autoScheduler] Started — runs at 00:00 and 06:00 daily.');
};

module.exports = { startAutoScheduler, rescheduleExpiredSlots };
