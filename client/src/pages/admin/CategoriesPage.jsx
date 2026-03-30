import { useState } from 'react';
import { categoryAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const defaultForm = { name: '', description: '', icon: '📚', isActive: true, sortOrder: 0 };

const CategoriesPage = () => {
  const { data, loading, refetch } = useFetch(() => categoryAPI.getAll());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const categories = data?.categories || [];

  const openEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '📚', isActive: cat.isActive, sortOrder: cat.sortOrder || 0 });
    setEditId(cat._id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await categoryAPI.update(editId, form);
        toast.success('Category updated.');
      } else {
        await categoryAPI.create(form);
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
              <input className="input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" className="input" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
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
                <span className="text-3xl">{cat.icon}</span>
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
