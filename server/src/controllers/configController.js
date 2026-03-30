const SiteConfig = require('../models/SiteConfig');
const catchAsync = require('../utils/catchAsync');

// GET /api/config/public
const getPublicConfig = catchAsync(async (req, res) => {
  const config = await SiteConfig.getConfig();
  // Strip sensitive admin-only fields before sending to public
  const publicConfig = {
    platformName: config.platformName,
    tagline: config.tagline,
    upiId: config.upiId,
    upiDisplayName: config.upiDisplayName,
    supportEmail: config.supportEmail,
    supportPhone: config.supportPhone,
    heroVideoUrl: config.heroVideoUrl,
    heroTitle: config.heroTitle,
    heroSubtitle: config.heroSubtitle,
    testimonials: config.testimonials,
    socialLinks: config.socialLinks,
    verificationTimeNote: config.verificationTimeNote,
    maintenanceMode: config.maintenanceMode,
    allowNewRegistrations: config.allowNewRegistrations,
    footerText: config.footerText,
  };
  res.json({ success: true, config: publicConfig });
});

// GET /api/admin/config
const getAdminConfig = catchAsync(async (req, res) => {
  const config = await SiteConfig.getConfig();
  res.json({ success: true, config });
});

// PUT /api/admin/config
const updateConfig = catchAsync(async (req, res) => {
  let config = await SiteConfig.findOne();
  if (!config) {
    config = new SiteConfig(req.body);
  } else {
    Object.assign(config, req.body);
  }
  await config.save();
  res.json({ success: true, config });
});

module.exports = { getPublicConfig, getAdminConfig, updateConfig };
