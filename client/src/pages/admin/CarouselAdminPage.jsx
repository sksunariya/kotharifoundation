import { useState, useEffect, useRef } from 'react';
import { carouselAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const emptyForm = { title: '', link: '', order: 0, isActive: true, imageUrl: '', imageFile: null };

const CarouselAdminPage = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadMode, setUploadMode] = useState('file');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    carouselAPI.getAdmin()
      .then(res => setSlides(res.data.slides || []))
      .catch(() => toast.error('Failed to load slides'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: slides.length });
    setUploadMode('file');
    setPreview(null);
    setShowForm(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openEdit = (slide) => {
    setEditingId(slide._id);
    setForm({
      title: slide.title || '',
      link: slide.link || '',
      order: slide.order,
      isActive: slide.isActive,
      imageUrl: slide.s3Key ? '' : (slide.imageUrl || ''),
      imageFile: null,
    });
    setUploadMode(slide.s3Key ? 'file' : 'url');
    setPreview(slide.imageUrl || null);
    setShowForm(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file, imageUrl: '' }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadMode === 'file' && !form.imageFile && !editingId) {
      toast.error('Please select an image file');
      return;
    }
    if (uploadMode === 'url' && !form.imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('link', form.link);
      fd.append('order', form.order);
      fd.append('isActive', form.isActive);
      if (uploadMode === 'file' && form.imageFile) fd.append('image', form.imageFile);
      else if (uploadMode === 'url') fd.append('imageUrl', form.imageUrl);

      if (editingId) {
        await carouselAPI.update(editingId, fd);
        toast.success('Slide updated');
      } else {
        await carouselAPI.create(fd);
        toast.success('Slide added');
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this slide?')) return;
    try {
      await carouselAPI.delete(id);
      toast.success('Slide deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (slide) => {
    try {
      const fd = new FormData();
      fd.append('isActive', !slide.isActive);
      fd.append('title', slide.title || '');
      fd.append('link', slide.link || '');
      fd.append('order', slide.order);
      await carouselAPI.update(slide._id, fd);
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const moveSlide = async (index, dir) => {
    const targetIndex = index + dir;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const reordered = [...slides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, order: i }));
    setSlides(updated);
    try {
      await carouselAPI.reorder(updated.map(s => ({ id: s._id, order: s.order })));
    } catch {
      toast.error('Reorder failed');
      load();
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Hero Carousel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage images shown in the homepage carousel</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm flex-shrink-0">
          + Add Slide
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card mb-6 border border-primary-100">
          <h2 className="font-semibold text-gray-800 mb-4">{editingId ? 'Edit Slide' : 'Add New Slide'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Image source toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image Source</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setUploadMode('file'); setPreview(null); setForm(f => ({ ...f, imageUrl: '' })); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${uploadMode === 'file' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:border-primary-400'}`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => { setUploadMode('url'); setPreview(null); setForm(f => ({ ...f, imageFile: null, imageUrl: '' })); if (fileRef.current) fileRef.current.value = ''; }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${uploadMode === 'url' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:border-primary-400'}`}
                >
                  Enter URL
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image File <span className="text-gray-400 font-normal">(JPG, PNG, WebP, GIF · max 10 MB)</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setPreview(e.target.value || null); }}
                />
              </div>
            )}

            {preview && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-40">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" onError={() => setPreview(null)} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" className="input" placeholder="Text shown on slide" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Click-through URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="url" className="input" placeholder="https://..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input type="number" className="input" min={0} value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input id="slideActive" type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="slideActive" className="text-sm font-medium text-gray-700 cursor-pointer">Active (visible on site)</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingId ? 'Update Slide' : 'Add Slide'}</button>
              <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {slides.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-gray-500 font-medium mb-1">No slides yet</p>
          <p className="text-gray-400 text-sm">Click "+ Add Slide" to add your first carousel image.</p>
        </div>
      )}

      {/* Slides list */}
      {slides.length > 0 && (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div key={slide._id} className={`card ${!slide.isActive ? 'opacity-60' : ''}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-full sm:w-28 rounded-lg overflow-hidden bg-gray-100 border border-gray-200" style={{ height: '100px' }}>
                  <img src={slide.imageUrl} alt={slide.title || 'Slide'} className="w-full h-full object-cover" />
                </div>

                {/* Info + actions */}
                <div className="flex-1 min-w-0">
                  {/* Top row: info + reorder arrows */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">#{slide.order + 1}</span>
                        {!slide.isActive && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Hidden</span>}
                      </div>
                      {slide.title && <p className="text-sm font-medium text-gray-800 truncate">{slide.title}</p>}
                      {slide.link && <p className="text-xs text-primary-500 truncate">{slide.link}</p>}
                    </div>

                    {/* Reorder arrows */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => moveSlide(index, -1)}
                        disabled={index === 0}
                        title="Move up"
                        className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveSlide(index, 1)}
                        disabled={index === slides.length - 1}
                        title="Move down"
                        className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Action buttons row — always visible */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleActive(slide)}
                      className={`px-3 py-1.5 rounded text-xs font-medium border ${slide.isActive ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' : 'border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      {slide.isActive ? '✓ Active' : '✗ Inactive'}
                    </button>
                    <button
                      onClick={() => openEdit(slide)}
                      className="px-3 py-1.5 rounded text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(slide._id)}
                      className="px-3 py-1.5 rounded text-xs font-medium border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Use ↑↓ to reorder. Set auto-play speed in{' '}
        <a href="/admin/config" className="text-primary-500 underline">Site Config → Content</a>.
      </p>
    </div>
  );
};

export default CarouselAdminPage;
