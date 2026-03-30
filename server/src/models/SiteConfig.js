const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String },
  content: { type: String, required: true },
  avatar: { type: String },
  rating: { type: Number, min: 1, max: 5, default: 5 },
});

const siteConfigSchema = new mongoose.Schema(
  {
    platformName: { type: String, default: 'Kothari Foundation' },
    tagline: { type: String, default: 'Empowering students through expert mentorship' },
    upiId: { type: String, required: true },
    upiDisplayName: { type: String, required: true },
    supportEmail: { type: String },
    supportPhone: { type: String },
    heroVideoUrl: { type: String },
    heroTitle: { type: String, default: 'Book a Session With Expert Mentors' },
    heroSubtitle: { type: String, default: 'Choose from a wide range of mentorship categories' },
    testimonials: [testimonialSchema],
    socialLinks: {
      instagram: { type: String },
      twitter: { type: String },
      linkedin: { type: String },
      youtube: { type: String },
    },
    verificationTimeNote: { type: String, default: 'Payments are verified within 2-4 hours on business days' },
    maintenanceMode: { type: Boolean, default: false },
    allowNewRegistrations: { type: Boolean, default: true },
    footerText: { type: String, default: '© 2024 Kothari Foundation. All rights reserved.' },
  },
  { timestamps: true }
);

// Enforce singleton pattern
siteConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      upiId: 'kotharifoundation@upi',
      upiDisplayName: 'Kothari Foundation',
    });
  }
  return config;
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
