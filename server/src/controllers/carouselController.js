const CarouselSlide = require('../models/CarouselSlide');
const { getImagePresignedUrl } = require('../services/s3');
const { uploadToS3, deleteFromS3 } = require('../services/upload');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// Attach a presigned URL (or pass through the external URL) for each slide.
const resolveUrl = async (slide) => {
  const obj = slide.toObject ? slide.toObject() : { ...slide };
  if (obj.s3Key) {
    obj.imageUrl = await getImagePresignedUrl(obj.s3Key);
  }
  return obj;
};

exports.getPublicSlides = catchAsync(async (req, res) => {
  const slides = await CarouselSlide.find({ isActive: true }).sort({ order: 1 });
  const resolved = await Promise.all(slides.map(resolveUrl));
  res.json({ success: true, slides: resolved });
});

exports.getAllSlides = catchAsync(async (req, res) => {
  const slides = await CarouselSlide.find().sort({ order: 1 });
  const resolved = await Promise.all(slides.map(resolveUrl));
  res.json({ success: true, slides: resolved });
});

exports.createSlide = catchAsync(async (req, res) => {
  const { title, link, order, isActive, imageUrl } = req.body;

  let s3Key = null;
  let finalImageUrl = imageUrl || '';

  if (req.file) {
    s3Key = await uploadToS3(req.file, 'carousel-images');
    finalImageUrl = '';
  }

  if (!s3Key && !finalImageUrl) {
    throw new ApiError(400, 'Image file or URL is required');
  }

  const slide = await CarouselSlide.create({
    imageUrl: finalImageUrl,
    s3Key,
    title: title || '',
    link: link || '',
    order: order !== undefined ? Number(order) : 0,
    isActive: isActive === undefined ? true : (isActive === 'true' || isActive === true),
  });

  const resolved = await resolveUrl(slide);
  res.status(201).json({ success: true, slide: resolved });
});

exports.updateSlide = catchAsync(async (req, res) => {
  const slide = await CarouselSlide.findById(req.params.id);
  if (!slide) throw new ApiError(404, 'Slide not found');

  const { title, link, order, isActive, imageUrl } = req.body;

  if (req.file) {
    await deleteFromS3(slide.s3Key);
    slide.s3Key = await uploadToS3(req.file, 'carousel-images');
    slide.imageUrl = '';
  } else if (imageUrl !== undefined && imageUrl !== slide.imageUrl) {
    await deleteFromS3(slide.s3Key);
    slide.s3Key = null;
    slide.imageUrl = imageUrl;
  }

  if (title !== undefined) slide.title = title;
  if (link !== undefined) slide.link = link;
  if (order !== undefined) slide.order = Number(order);
  if (isActive !== undefined) slide.isActive = isActive === 'true' || isActive === true;

  await slide.save();
  const resolved = await resolveUrl(slide);
  res.json({ success: true, slide: resolved });
});

exports.deleteSlide = catchAsync(async (req, res) => {
  const slide = await CarouselSlide.findById(req.params.id);
  if (!slide) throw new ApiError(404, 'Slide not found');

  await deleteFromS3(slide.s3Key);
  await slide.deleteOne();
  res.json({ success: true, message: 'Slide deleted' });
});

exports.reorderSlides = catchAsync(async (req, res) => {
  const { slides } = req.body;
  if (!Array.isArray(slides)) throw new ApiError(400, 'slides must be an array');

  await Promise.all(
    slides.map(({ id, order }) => CarouselSlide.findByIdAndUpdate(id, { order: Number(order) }))
  );

  res.json({ success: true, message: 'Slides reordered' });
});
