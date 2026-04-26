import { useState } from 'react';
import { slotAPI, categoryAPI } from '../../api/endpoints';
import { formatDateTime, formatINR } from '../../utils/formatDate';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResourceModal from '../../components/ResourceModal';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const defaultForm = {
  categoryId: '', title: '', description: '', startTime: '', endTime: '',
  price: '', capacity: 1, isActive: true, autoSchedule: false, autoScheduleDays: 2,
};

// UTC stored in DB → IST string for datetime-local input ("YYYY-MM-DDThh:mm")
const toISTInput = (d) => {
  if (!d) return '';
  const ist = new Date(new Date(d).getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
};

// IST string from datetime-local input → UTC ISO string for the server
const fromISTInput = (s) => {
  if (!s) return '';
  return new Date(s + '+05:30').toISOString();
};

// ── Slot Form Modal ────────────────────────────────────────────────────────────
const SlotModal = ({ editId, form, setForm, categories, saving, onSave, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">{editId ? 'Edit' : 'New'} Session Slot</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={onSave} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-xs text-gray-400">(IST)</span></label>
          <input
            type="datetime-local"
            className="input"
            value={form.startTime}
            onChange={e => setForm({ ...form, startTime: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time <span className="text-xs text-gray-400">(IST)</span></label>
          <input
            type="datetime-local"
            className="input"
            value={form.endTime}
            onChange={e => setForm({ ...form, endTime: e.target.value })}
            required
          />
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

        <div className="flex items-center gap-2">
          <input type="checkbox" id="slotAutoSchedule" checked={form.autoSchedule} onChange={e => setForm({ ...form, autoSchedule: e.target.checked })} />
          <label htmlFor="slotAutoSchedule" className="text-sm text-gray-700">Auto Schedule</label>
        </div>

        {form.autoSchedule && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reschedule after (days)
              <span className="ml-1 text-xs text-gray-400">— if no bookings when session time passes</span>
            </label>
            <input
              type="number"
              className="input"
              value={form.autoScheduleDays}
              onChange={e => setForm({ ...form, autoScheduleDays: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />
          </div>
        )}

        <div className="sm:col-span-2 flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : editId ? 'Update Slot' : 'Create Slot'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const SlotsPage = () => {
  const { data: slotsData, loading: slotsLoading, refetch } = useFetch(() => slotAPI.getAll({}));
  const { data: catsData } = useFetch(() => categoryAPI.getAll());

  const slots = slotsData?.slots || [];
  const categories = catsData?.categories || [];

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resourceSlot, setResourceSlot] = useState(null);

  const openEdit = (slot) => {
    setForm({
      categoryId: slot.categoryId?._id || slot.categoryId,
      title: slot.title,
      description: slot.description || '',
      startTime: toISTInput(slot.startTime),
      endTime: toISTInput(slot.endTime),
      price: slot.price,
      capacity: slot.capacity,
      isActive: slot.isActive,
      autoSchedule: slot.autoSchedule || false,
      autoScheduleDays: slot.autoScheduleDays ?? 2,
    });
    setEditId(slot._id);
    setShowModal(true);
  };

  const openNew = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert IST input values to UTC before sending
      const payload = {
        ...form,
        startTime: fromISTInput(form.startTime),
        endTime: fromISTInput(form.endTime),
      };
      if (editId) {
        await slotAPI.update(editId, payload);
        toast.success('Session updated.');
      } else {
        await slotAPI.create(payload);
        toast.success('Session created.');
      }
      setShowModal(false);
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

      {showModal && (
        <SlotModal
          editId={editId}
          form={form}
          setForm={setForm}
          categories={categories}
          saving={saving}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {resourceSlot && (
        <ResourceModal slot={resourceSlot} onClose={() => setResourceSlot(null)} />
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
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Start Time (IST)</th>
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
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {new Date(slot.startTime) < new Date() && (
                          <span className="badge bg-orange-100 text-orange-600">Past</span>
                        )}
                        {slot.autoSchedule && (
                          <span className="badge bg-blue-100 text-blue-600">Auto +{slot.autoScheduleDays}d</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setResourceSlot(slot)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">📦 Resources</button>
                        <button onClick={() => openEdit(slot)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                        <button onClick={() => handleDelete(slot._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                      </div>
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
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`badge ${slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {slot.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {new Date(slot.startTime) < new Date() && (
                      <span className="badge bg-orange-100 text-orange-600">Past</span>
                    )}
                    {slot.autoSchedule && (
                      <span className="badge bg-blue-100 text-blue-600">Auto +{slot.autoScheduleDays}d</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 flex gap-4">
                  <span>📅 {formatDateTime(slot.startTime)}</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-sm">{formatINR(slot.price)} · {slot.bookedCount}/{slot.capacity} booked</span>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setResourceSlot(slot)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">📦 Resources</button>
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
