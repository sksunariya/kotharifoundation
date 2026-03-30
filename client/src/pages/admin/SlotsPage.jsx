import { useState } from 'react';
import { slotAPI, categoryAPI } from '../../api/endpoints';
import { formatDateTime, formatINR } from '../../utils/formatDate';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const defaultForm = {
  categoryId: '', title: '', description: '', startTime: '', endTime: '',
  price: '', capacity: 1, isActive: true,
};

const SlotsPage = () => {
  const { data: slotsData, loading: slotsLoading, refetch } = useFetch(() => slotAPI.getAll({}));
  const { data: catsData } = useFetch(() => categoryAPI.getAll());

  const slots = slotsData?.slots || [];
  const categories = catsData?.categories || [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const toInputDatetime = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';

  const openEdit = (slot) => {
    setForm({
      categoryId: slot.categoryId?._id || slot.categoryId,
      title: slot.title, description: slot.description || '',
      startTime: toInputDatetime(slot.startTime), endTime: toInputDatetime(slot.endTime),
      price: slot.price, capacity: slot.capacity, isActive: slot.isActive,
    });
    setEditId(slot._id);
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
        await slotAPI.update(editId, form);
        toast.success('Session updated.');
      } else {
        await slotAPI.create(form);
        toast.success('Session created.');
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
    if (!confirm('Delete this session slot?')) return;
    try {
      await slotAPI.delete(id);
      toast.success('Slot deleted.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Session Slots</h1>
        <button onClick={openNew} className="btn-primary text-sm">+ Add Slot</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit' : 'New'} Session Slot</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" className="input" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" className="input" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" className="input" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} required min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" className="input" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} required min={1} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="slotActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="slotActive" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {slotsLoading ? <LoadingSpinner /> : (
        <>
          {/* Table — md and up */}
          <div className="hidden md:block card p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Session</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Start Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Bookings</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No slots yet.</td></tr>
                ) : slots.map((slot) => (
                  <tr key={slot._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{slot.title}</td>
                    <td className="py-3 px-4">{slot.categoryId?.icon} {slot.categoryId?.name}</td>
                    <td className="py-3 px-4 text-gray-500">{formatDateTime(slot.startTime)}</td>
                    <td className="py-3 px-4 font-semibold">{formatINR(slot.price)}</td>
                    <td className="py-3 px-4">{slot.bookedCount}/{slot.capacity}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {slot.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button onClick={() => openEdit(slot)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                      <button onClick={() => handleDelete(slot._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {slots.length === 0 ? (
              <p className="text-center py-10 text-gray-400">No slots yet.</p>
            ) : slots.map((slot) => (
              <div key={slot._id} className="card space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{slot.title}</p>
                    <p className="text-xs text-gray-400">{slot.categoryId?.icon} {slot.categoryId?.name}</p>
                  </div>
                  <span className={`badge ${slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {slot.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex gap-4">
                  <span>📅 {formatDateTime(slot.startTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{formatINR(slot.price)} · {slot.bookedCount}/{slot.capacity} booked</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(slot)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                    <button onClick={() => handleDelete(slot._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SlotsPage;
