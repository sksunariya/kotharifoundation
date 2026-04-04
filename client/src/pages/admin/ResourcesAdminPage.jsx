import { useState } from 'react';
import { slotAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResourceModal from '../../components/ResourceModal';
import useFetch from '../../hooks/useFetch';

const ResourcesAdminPage = () => {
  const { data: slotsData, loading: slotsLoading } = useFetch(() => slotAPI.getAll({}));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const slots = slotsData?.slots || [];

  const handleSlotChange = (e) => {
    const slot = slots.find(s => s._id === e.target.value) || null;
    setSelectedSlot(slot);
    setModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Resource Hub</h1>

      <div className="card max-w-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Session Slot</label>
        {slotsLoading ? <LoadingSpinner /> : (
          <>
            <select
              className="input mb-4"
              value={selectedSlot?._id || ''}
              onChange={handleSlotChange}
            >
              <option value="">— Choose a session —</option>
              {slots.map(s => (
                <option key={s._id} value={s._id}>
                  {s.title} ({new Date(s.startTime).toLocaleDateString('en-IN')})
                </option>
              ))}
            </select>
            {selectedSlot && (
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary w-full"
              >
                📦 Manage Resources
              </button>
            )}
          </>
        )}
      </div>

      {!selectedSlot && (
        <p className="text-gray-400 text-sm text-center py-10">Select a session to manage its resources.</p>
      )}

      {modalOpen && selectedSlot && (
        <ResourceModal slot={selectedSlot} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
};

export default ResourcesAdminPage;
