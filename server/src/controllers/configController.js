const SiteConfig = require('../models/SiteConfig');
const catchAsync = require('../utils/catchAsync');
const { uploadToS3, deleteFromS3 } = require('../services/upload');
const { getImagePresignedUrl } = require('../services/s3');

// Resolve an S3 key to a presigned URL, or return a plain URL as-is
const resolveUrl = async (s3Key, fallbackUrl) => {
  if (s3Key) return getImagePresignedUrl(s3Key);
  return fallbackUrl || '';
};

// GET /api/config/public
const getPublicConfig = catchAsync(async (req, res) => {
  const config = await SiteConfig.getConfig();
  const [logoUrl, faviconUrl] = await Promise.all([
    resolveUrl(config.logoS3Key, config.logoUrl),
    resolveUrl(config.faviconS3Key, config.faviconUrl),
  ]);
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
    allowReviews: config.allowReviews,
    requireReviewApproval: config.requireReviewApproval,
    carouselInterval: config.carouselInterval,
    logoUrl,
    faviconUrl,
  };
  res.json({ success: true, config: publicConfig });
});

// GET /api/admin/config
const getAdminConfig = catchAsync(async (req, res) => {
  const config = await SiteConfig.getConfig();
  const [logoUrl, faviconUrl] = await Promise.all([
    resolveUrl(config.logoS3Key, config.logoUrl),
    resolveUrl(config.faviconS3Key, config.faviconUrl),
  ]);
  const out = config.toObject();
  out.logoUrl = logoUrl;
  out.faviconUrl = faviconUrl;
  res.json({ success: true, config: out });
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

// POST /api/admin/config/branding
// Accepts multipart fields: logo (file), favicon (file), logoUrl (text), faviconUrl (text)
const uploadBranding = catchAsync(async (req, res) => {
  const config = await SiteConfig.getConfig();
  const { logoUrl: newLogoUrl, faviconUrl: newFaviconUrl } = req.body;
  const logoFile = req.files?.logo?.[0];
  const faviconFile = req.files?.favicon?.[0];

  if (logoFile) {
    if (config.logoS3Key) await deleteFromS3(config.logoS3Key);
    config.logoS3Key = await uploadToS3(logoFile, 'branding');
    config.logoUrl = '';
  } else if (newLogoUrl !== undefined) {
    if (config.logoS3Key) await deleteFromS3(config.logoS3Key);
    config.logoS3Key = '';
    config.logoUrl = newLogoUrl;
  }

  if (faviconFile) {
    if (config.faviconS3Key) await deleteFromS3(config.faviconS3Key);
    config.faviconS3Key = await uploadToS3(faviconFile, 'branding');
    config.faviconUrl = '';
  } else if (newFaviconUrl !== undefined) {
    if (config.faviconS3Key) await deleteFromS3(config.faviconS3Key);
    config.faviconS3Key = '';
    config.faviconUrl = newFaviconUrl;
  }

  await config.save();

  const [logoUrl, faviconUrl] = await Promise.all([
    resolveUrl(config.logoS3Key, config.logoUrl),
    resolveUrl(config.faviconS3Key, config.faviconUrl),
  ]);

  res.json({ success: true, logoUrl, faviconUrl });
});

module.exports = { getPublicConfig, getAdminConfig, updateConfig, uploadBranding };
