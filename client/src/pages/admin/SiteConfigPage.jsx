import { useState, useEffect } from 'react';
import { configAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const SiteConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    configAPI.getAdmin()
      .then(res => setConfig(res.data.config))
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

  if (loading) return <LoadingSpinner fullPage />;

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'payment', label: 'Payment' },
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
    </div>
  );
};

export default SiteConfigPage;
