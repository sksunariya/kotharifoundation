import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { slotAPI, categoryAPI } from '../api/endpoints';
import { formatDateTime, formatINR } from '../utils/formatDate';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryIcon from '../components/CategoryIcon';

const SessionCard = ({ slot }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-3">
      <div>
        <CategoryIcon icon={slot.categoryId?.icon} size="sm" className="mr-2" />
        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
          {slot.categoryId?.name}
        </span>
      </div>
      <span className="text-xl font-bold text-gray-800">{formatINR(slot.price)}</span>
    </div>
    <h3 className="font-semibold text-gray-800 text-lg mb-1">{slot.title}</h3>
    {slot.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{slot.description}</p>}
    <div className="text-sm text-gray-500 space-y-1 mb-4">
      <div>📅 {formatDateTime(slot.startTime)}</div>
      <div>👥 {slot.availableSpots ?? slot.capacity - slot.bookedCount} spots available</div>
      {slot.mentorId && <div>👨‍🏫 {slot.mentorId.name}</div>}
    </div>
    <Link
      to={`/sessions/${slot._id}`}
      className={`btn-primary w-full text-center block ${slot.isFull ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      {slot.isFull ? 'Fully Booked' : 'Book This Session'}
    </Link>
  </div>
);

const SessionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [slots, setSlots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedCategory = searchParams.get('category') || '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      slotAPI.getAll({ upcoming: 'true', ...(selectedCategory && { category: selectedCategory }) }),
      categoryAPI.getAll(),
    ])
      .then(([slotsRes, catsRes]) => {
        if (cancelled) return;
        setSlots(slotsRes.data.slots);
        setCategories(catsRes.data.categories);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Browse Sessions</h1>
        <p className="text-gray-500">Find and book the perfect mentorship session</p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setSearchParams({})}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSearchParams({ category: cat._id })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat._id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}
            >
              <CategoryIcon icon={cat.icon} size="xs" className="mr-1" /> {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullPage />
      ) : slots.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg font-medium">No sessions available right now</p>
          <p className="text-sm mt-1">Check back soon for new slots!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => (
            <SessionCard key={slot._id} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
