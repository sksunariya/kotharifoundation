const mongoose = require('mongoose');

// A Resource is any piece of content attached to a session slot.
// type='video' and type='pdf' store an S3 key → presigned URL is generated on-request.
// type='link' stores a direct external URL (no S3 involved).
const resourceSchema = new mongoose.Schema(
  {
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionSlot',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['video', 'pdf', 'link'],
      required: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // S3 fields — used when type is 'video' or 'pdf'
    s3Key: { type: String, trim: true },    // e.g. "sessions/abc123/recording.mp4"
    s3Bucket: { type: String, trim: true }, // defaults to env AWS_S3_BUCKET if omitted

    // Link field — used when type is 'link'
    url: { type: String, trim: true },

    // True for the primary session recording (first item in the video playlist)
    isRecording: { type: Boolean, default: false },

    sortOrder: { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);
