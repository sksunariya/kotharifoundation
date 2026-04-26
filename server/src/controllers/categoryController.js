const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { uploadToS3, deleteFromS3 } = require('../services/upload');
const { getImagePresignedUrl } = require('../services/s3');

// If the category has an S3-backed icon, replace icon with a presigned URL.
// Otherwise leave icon as-is (emoji or external URL).
const resolveIcon = async (category) => {
  const obj = category.toObject ? category.toObject() : { ...category };
  if (obj.iconS3Key) {
    obj.icon = await getImagePresignedUrl(obj.iconS3Key);
  }
  return obj;
};

// GET /api/categories
const getCategories = catchAsync(async (req, res) => {
  const filter = req.user?.role === 'admin'
    ? { isDeleted: false }                    // admin sees active + inactive, not deleted
    : { isActive: true, isDeleted: false };   // users see active only
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
  const resolved = await Promise.all(categories.map(resolveIcon));
  res.json({ success: true, categories: resolved });
});

// GET /api/categories/:id
const getCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  const resolved = await resolveIcon(category);
  res.json({ success: true, category: resolved });
});

// POST /api/admin/categories
const createCategory = catchAsync(async (req, res) => {
  const { name, description, isActive, sortOrder } = req.body;

  let { icon } = req.body;
  if (icon === undefined || icon === '') icon = '📚';

  let iconS3Key = null;
  if (req.file) {
    iconS3Key = await uploadToS3(req.file, 'category-icons');
    icon = ''; // stored in S3
  }

  const isActiveParsed = isActive === undefined ? true : (isActive === 'true' || isActive === true);
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const category = await Category.create({
    name, slug, description, icon, iconS3Key,
    isActive: isActiveParsed,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
  });

  const resolved = await resolveIcon(category);
  res.status(201).json({ success: true, category: resolved });
});

// PUT /api/admin/categories/:id
const updateCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');

  const { name, description, isActive, sortOrder } = req.body;
  let { icon } = req.body;

  if (name && name !== category.name) {
    category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    category.name = name;
  }

  if (req.file) {
    // New image file uploaded — replace any existing S3 icon
    await deleteFromS3(category.iconS3Key);
    category.iconS3Key = await uploadToS3(req.file, 'category-icons');
    category.icon = '';
  } else if (icon !== undefined && icon !== '') {
    // Admin provided an emoji or external URL — remove any S3 icon
    await deleteFromS3(category.iconS3Key);
    category.iconS3Key = null;
    category.icon = icon;
  }
  // If icon === '' and no file, leave existing icon/iconS3Key untouched

  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);

  await category.save();
  const resolved = await resolveIcon(category);
  res.json({ success: true, category: resolved });
});

// DELETE /api/admin/categories/:id — soft delete
const deleteCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  category.isDeleted = true;
  category.deletedAt = new Date();
  await category.save();
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
