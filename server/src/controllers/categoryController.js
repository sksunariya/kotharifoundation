const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// GET /api/categories
const getCategories = catchAsync(async (req, res) => {
  const filter = req.user?.role === 'admin'
    ? { isDeleted: false }                    // admin sees active + inactive, not deleted
    : { isActive: true, isDeleted: false };   // users see active only
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, categories });
});

// GET /api/categories/:id
const getCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  res.json({ success: true, category });
});

// POST /api/admin/categories
const createCategory = catchAsync(async (req, res) => {
  const { name, description, icon, isActive, sortOrder } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const category = await Category.create({ name, slug, description, icon, isActive, sortOrder });
  res.status(201).json({ success: true, category });
});

// PUT /api/admin/categories/:id
const updateCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');

  if (req.body.name && req.body.name !== category.name) {
    req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  Object.assign(category, req.body);
  await category.save();
  res.json({ success: true, category });
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
