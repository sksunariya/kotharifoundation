const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true }, // e.g. "Senior Software Engineer at Google"
    shortBio: { type: String, trim: true },              // shown on landing page card
    detailedBio: { type: String, trim: true },           // shown on full profile / instructors page
    photo: { type: String },                             // image URL
    expertise: [{ type: String, trim: true }],           // e.g. ["DSA", "System Design", "FAANG Prep"]
    experience: { type: Number },                        // years of experience
    qualifications: [{ type: String, trim: true }],      // e.g. ["B.Tech IIT Delhi", "M.S. Stanford"]
    achievements: [{ type: String, trim: true }],        // e.g. ["Ex-Google", "500+ students mentored"]
    socialLinks: {
      linkedin: { type: String },
      twitter:  { type: String },
      youtube:  { type: String },
      instagram: { type: String },
      website:  { type: String },
    },
    isActive:  { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Instructor', instructorSchema);
