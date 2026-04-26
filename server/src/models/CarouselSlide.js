const mongoose = require('mongoose');

const carouselSlideSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, default: '' },  // external URL (when s3Key is absent)
    s3Key: { type: String, default: null },   // S3 object key (when uploaded via file)
    title: { type: String, default: '' },
    link: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CarouselSlide', carouselSlideSchema);
