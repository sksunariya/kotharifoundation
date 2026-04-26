import { useState, useRef } from 'react';
import { categoryAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const defaultForm = { name: '', description: '', icon: '📚', isActive: true, sortOrder: 0 };

// Determine whether the icon value is an image URL (vs an emoji/text)
const isImageUrl = (str) => typeof str === 'string' && str.startsWith('http');

// Render the icon: image thumbnail if it's a URL, otherwise plain text/emoji
const IconDisplay = ({ icon, iconS3Key, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-2xl' : 'w-10 h-10 text-3xl';
  if (iconS3Key || isImageUrl(icon)) {
    return <img src={icon} alt="icon" className={`${size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'} object-cover rounded-lg`} />;
  }
  return <span className={sizeClass}>{icon || '📚'}</span>;
};

const CategoriesPage = () => {
  const { data, loading, refetch } = useFetch(() => categoryAPI.getAll());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Icon upload state
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [iconS3Key, setIconS3Key] = useState(null); // tracks whether existing icon is S3-backed
  const fileInputRef = useRef(null);

  const categories = data?.categories || [];

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openNew = () => {
    setForm(defaultForm);
    setEditId(null);
    setIconFile(null);
    setIconPreview(null);
    setIconS3Key(null);
    resetFileInput();
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      // Don't put presigned URLs into the icon field — they're ephemeral.
      // Keep it as empty string when S3-backed; the preview handles display.
      icon: cat.iconS3Key ? '' : (cat.icon || '📚'),
      isActive: cat.isActive,
      sortOrder: cat.sortOrder || 0,
    });
    setEditId(cat._id);
    setIconFile(null);
    setIconS3Key(cat.iconS3Key || null);
    resetFileInput();
    // Show the resolved icon (presigned URL or external URL) as preview
    setIconPreview(isImageUrl(cat.icon) || cat.iconS3Key ? cat.icon : null);
    setShowForm(true);
  };

  const handleIconFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setIconS3Key(null);
    // Clear text fields since a file takes priority
    setForm(f => ({ ...f, icon: '' }));
  };

  const clearIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setIconS3Key(null);
    setForm(f => ({ ...f, icon: '📚' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('isActive', form.isActive);
    fd.append('sortOrder', form.sortOrder);

    if (iconFile) {
      fd.append('icon', iconFile);         // file — multer picks this up as req.file
    } else {
      fd.append('icon', form.icon || '');  // emoji, external URL, or empty (keep existing)
    }
    return fd;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = buildFormData();
      if (editId) {
        await categoryAPI.update(editId, fd);
        toast.success('Category updated.');
      } else {
        await categoryAPI.create(fd);
        toast.success('Category created.');
      }
      setShowForm(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoryAPI.delete(id);
      toast.success('Category deleted.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Categories</h1>
        <button onClick={openNew} className="btn-primary text-sm">+ Add Category</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit' : 'New'} Category</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" className="input" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Icon — upload, URL, or emoji */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">

                {/* Preview */}
                <div className="relative flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  {iconPreview ? (
                    <>
                      <img src={iconPreview} alt="Icon preview" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={clearIcon}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        title="Remove icon"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-3xl">{form.icon && !isImageUrl(form.icon) ? form.icon : '🖼️'}</span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {/* File upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="iconFileInput"
                      onChange={handleIconFileChange}
                    />
                    <label htmlFor="iconFileInput" className="btn-secondary text-sm cursor-pointer inline-block">
                      {iconFile ? '✓ ' + iconFile.name : 'Upload Image'}
                    </label>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, SVG, WEBP · max 10 MB</p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

                  {/* Emoji or URL */}
                  <div>
                    <input
                      className="input"
                      placeholder="Emoji (e.g. 📚) or image URL (https://...)"
                      value={form.icon}
                      disabled={!!iconFile}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({ ...f, icon: val }));
                        if (isImageUrl(val)) {
                          setIconPreview(val);
                          setIconS3Key(null);
                        } else {
                          setIconPreview(null);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">Type an emoji or paste an image URL</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className={`card ${!cat.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <IconDisplay icon={cat.icon} iconS3Key={cat.iconS3Key} />
                {!cat.isActive && <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
              </div>
              <h3 className="font-semibold text-gray-800">{cat.name}</h3>
              {cat.description && <p className="text-gray-500 text-sm mt-1">{cat.description}</p>}
              <p className="text-xs text-gray-400 mt-2">Slug: {cat.slug}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(cat)} className="btn-secondary text-xs py-1.5 flex-1">Edit</button>
                <button onClick={() => handleDelete(cat._id)} className="btn-danger text-xs py-1.5 flex-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
