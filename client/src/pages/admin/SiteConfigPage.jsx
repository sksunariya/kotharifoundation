import { useState, useEffect, useRef } from 'react';
import { configAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const SiteConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');

  // Branding state
  const [logoMode, setLogoMode] = useState('url');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconMode, setFaviconMode] = useState('url');
  const [faviconUrlInput, setFaviconUrlInput] = useState('');
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState('');
  const [brandingSaving, setBrandingSaving] = useState(false);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    configAPI.getAdmin()
      .then(res => {
        const c = res.data.config;
        setConfig(c);
        setLogoUrlInput(c.logoUrl || '');
        setLogoPreview(c.logoUrl || '');
        setFaviconUrlInput(c.faviconUrl || '');
        setFaviconPreview(c.faviconUrl || '');
      })
      .catch(() => toast.error('Failed to load config'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await configAPI.update(config);
      toast.success('Configuration saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));
  const updateNested = (parent, key, value) => setConfig(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));

  const handleFileChange = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleBrandingSave = async (e) => {
    e.preventDefault();
    setBrandingSaving(true);
    try {
      const formData = new FormData();
      if (logoMode === 'file' && logoFile) {
        formData.append('logo', logoFile);
      } else if (logoMode === 'url') {
        formData.append('logoUrl', logoUrlInput);
      }
      if (faviconMode === 'file' && faviconFile) {
        formData.append('favicon', faviconFile);
      } else if (faviconMode === 'url') {
        formData.append('faviconUrl', faviconUrlInput);
      }
      await configAPI.uploadBranding(formData);
      toast.success('Branding saved!');
      setLogoFile(null);
      setFaviconFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setBrandingSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Branding' },
    { id: 'payment', label: 'Payment' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'content', label: 'Content' },
    { id: 'social', label: 'Social' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Site Configuration</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto w-full sm:w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'branding' && (
        <form onSubmit={handleBrandingSave}>
          <div className="card mb-6 grid grid-cols-1 gap-8">

            {/* Logo */}
            <div>
              <h2 className="text-base font-semibold text-gray-700 mb-3">Logo</h2>
              <p className="text-xs text-gray-400 mb-3">Displayed in the navbar before "Kothari Education". Recommended: PNG/SVG with transparent background, height ~40px.</p>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setLogoMode('url')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${logoMode === 'url' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300'}`}>Enter URL</button>
                <button type="button" onClick={() => setLogoMode('file')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${logoMode === 'file' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300'}`}>Upload File</button>
              </div>
              {logoMode === 'url' ? (
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/logo.png"
                  value={logoUrlInput}
                  onChange={e => { setLogoUrlInput(e.target.value); setLogoPreview(e.target.value); }}
                />
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files[0], setLogoFile, setLogoPreview)} />
                  {logoFile ? (
                    <p className="text-sm text-gray-600">{logoFile.name}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Click to select an image (max 10 MB)</p>
                  )}
                </div>
              )}
              {logoPreview && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl inline-flex items-center gap-2">
                  <img src={logoPreview} alt="Logo preview" className="h-10 w-auto object-contain" onError={() => setLogoPreview('')} />
                  <span className="text-xs text-gray-400">Preview</span>
                </div>
              )}
            </div>

            {/* Favicon */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Favicon</h2>
              <p className="text-xs text-gray-400 mb-3">Shown in the browser tab. Recommended: ICO, PNG, or SVG at 32×32px.</p>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setFaviconMode('url')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${faviconMode === 'url' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300'}`}>Enter URL</button>
                <button type="button" onClick={() => setFaviconMode('file')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${faviconMode === 'file' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300'}`}>Upload File</button>
              </div>
              {faviconMode === 'url' ? (
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/favicon.ico"
                  value={faviconUrlInput}
                  onChange={e => { setFaviconUrlInput(e.target.value); setFaviconPreview(e.target.value); }}
                />
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  <input ref={faviconInputRef} type="file" accept="image/*,.ico" className="hidden" onChange={e => handleFileChange(e.target.files[0], setFaviconFile, setFaviconPreview)} />
                  {faviconFile ? (
                    <p className="text-sm text-gray-600">{faviconFile.name}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Click to select an image/ICO (max 10 MB)</p>
                  )}
                </div>
              )}
              {faviconPreview && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl inline-flex items-center gap-2">
                  <img src={faviconPreview} alt="Favicon preview" className="h-8 w-8 object-contain" onError={() => setFaviconPreview('')} />
                  <span className="text-xs text-gray-400">Preview (browser tab will update on next page load)</span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={brandingSaving} className="btn-primary px-8">
            {brandingSaving ? 'Saving...' : 'Save Branding'}
          </button>
        </form>
      )}

      {tab !== 'branding' && (
      <form onSubmit={handleSave}>
        <div className="card mb-6">
          {tab === 'general' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                <input className="input" value={config.platformName || ''} onChange={e => updateField('platformName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input className="input" value={config.tagline || ''} onChange={e => updateField('tagline', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input type="email" className="input" value={config.supportEmail || ''} onChange={e => updateField('supportEmail', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                <input className="input" value={config.supportPhone || ''} onChange={e => updateField('supportPhone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                <input className="input" value={config.footerText || ''} onChange={e => updateField('footerText', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Time Note</label>
                <input className="input" value={config.verificationTimeNote || ''} onChange={e => updateField('verificationTimeNote', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
                <input type="url" className="input" value={config.siteUrl || ''} onChange={e => updateField('siteUrl', e.target.value)} placeholder="https://kotharifoundation.com" />
                <p className="text-xs text-gray-400 mt-1">Used in password reset emails. Leave blank to use server default.</p>
              </div>
              <div className="flex items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={config.maintenanceMode || false} onChange={e => updateField('maintenanceMode', e.target.checked)} />
                  <span className="text-sm text-gray-700">Maintenance Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={config.allowNewRegistrations !== false} onChange={e => updateField('allowNewRegistrations', e.target.checked)} />
                  <span className="text-sm text-gray-700">Allow New Registrations</span>
                </label>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notification Email</label>
                <input
                  type="email"
                  className="input"
                  value={config.adminNotificationEmail || ''}
                  onChange={e => updateField('adminNotificationEmail', e.target.value)}
                  placeholder="admin@kotharifoundation.com"
                />
                <p className="text-xs text-gray-400 mt-1">
                  When a user submits a query, a notification will be sent to this email. Leave blank to disable email notifications.
                </p>
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allowReviews !== false}
                    onChange={e => updateField('allowReviews', e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Allow Users to Submit Reviews</span>
                </label>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireReviewApproval !== false}
                    onChange={e => updateField('requireReviewApproval', e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Require Admin Approval Before Publishing Reviews</span>
                </label>
              </div>
              <p className="text-xs text-gray-500">
                When approval is required, submitted reviews will appear in <strong>Reviews → Pending</strong> for you to approve or reject.
              </p>
            </div>
          )}

          {tab === 'payment' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (VPA)</label>
                <input className="input font-mono" value={config.upiId || ''} onChange={e => updateField('upiId', e.target.value)} required placeholder="yourname@upi" />
                <p className="text-xs text-gray-400 mt-1">This appears in the QR code for all future bookings</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI Display Name</label>
                <input className="input" value={config.upiDisplayName || ''} onChange={e => updateField('upiDisplayName', e.target.value)} required />
              </div>
            </div>
          )}

          {tab === 'content' && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                <input className="input" value={config.heroTitle || ''} onChange={e => updateField('heroTitle', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                <input className="input" value={config.heroSubtitle || ''} onChange={e => updateField('heroSubtitle', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Video URL</label>
                <input type="url" className="input" value={config.heroVideoUrl || ''} onChange={e => updateField('heroVideoUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carousel Auto-play Speed
                  <span className="ml-2 text-xs font-normal text-gray-400">(seconds between slides)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="input w-32"
                    min={1}
                    max={30}
                    step={1}
                    value={config.carouselInterval ?? 4}
                    onChange={e => updateField('carouselInterval', Math.max(1, Math.min(30, Number(e.target.value))))}
                  />
                  <span className="text-sm text-gray-500">seconds</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Min 1s · Max 30s · Default 4s. Manage carousel images in <a href="/admin/carousel" className="text-primary-500 underline">Carousel</a>.</p>
              </div>
            </div>
          )}

          {tab === 'social' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['instagram', 'twitter', 'linkedin', 'youtube'].map(platform => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{platform}</label>
                  <input
                    type="url"
                    className="input"
                    placeholder={`https://${platform}.com/...`}
                    value={config.socialLinks?.[platform] || ''}
                    onChange={e => updateNested('socialLinks', platform, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary px-8">
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
      )}
    </div>
  );
};

export default SiteConfigPage;
