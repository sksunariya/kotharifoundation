const Query = require('../models/Query');
const SiteConfig = require('../models/SiteConfig');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendQueryNotification } = require('../services/email');

// POST /api/queries — public, submit a query
const submitQuery = catchAsync(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    throw new ApiError(400, 'Name, email, subject, and message are required.');
  }

  const query = await Query.create({ name, email, phone, subject, message });

  // Send notification email to admin if configured
  try {
    const config = await SiteConfig.getConfig();
    if (config.adminNotificationEmail && config.adminNotificationEmail.trim()) {
      await sendQueryNotification({
        adminEmail: config.adminNotificationEmail.trim(),
        queryName: name,
        queryEmail: email,
        subject,
        message,
      });
    }
  } catch (err) {
    console.warn('Failed to send query notification email:', err.message);
  }

  res.status(201).json({ success: true, message: 'Your query has been submitted. We will get back to you soon.' });
});

// GET /api/admin/queries
const getAdminQueries = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = { isDeleted: false };
  if (status) filter.status = status;

  const queries = await Query.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, queries });
});

// PUT /api/admin/queries/:id
const updateQuery = catchAsync(async (req, res) => {
  const query = await Query.findOne({ _id: req.params.id, isDeleted: false });
  if (!query) throw new ApiError(404, 'Query not found.');

  const { status, adminNotes } = req.body;
  if (status) query.status = status;
  if (adminNotes !== undefined) query.adminNotes = adminNotes;
  await query.save();

  res.json({ success: true, query });
});

// DELETE /api/admin/queries/:id
const deleteQuery = catchAsync(async (req, res) => {
  const query = await Query.findOne({ _id: req.params.id, isDeleted: false });
  if (!query) throw new ApiError(404, 'Query not found.');
  query.isDeleted = true;
  await query.save();
  res.json({ success: true, message: 'Query deleted.' });
});

module.exports = { submitQuery, getAdminQueries, updateQuery, deleteQuery };
