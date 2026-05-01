import { useState } from 'react';
import { bookingAPI } from '../api/endpoints';
import { formatDateTime, formatINR } from '../utils/formatDate';
import BookingStatusBadge from '../components/BookingStatusBadge';
import CategoryIcon from '../components/CategoryIcon';
import { PAYMENT_STATUS_LABELS } from '../utils/statusHelpers';

const BookingStatusPage = () => {
  const [ref, setRef] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await bookingAPI.getStatus(ref.trim().toUpperCase());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking not found. Please check your reference number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Check Booking Status</h1>
      <p className="text-gray-500 mb-8">Enter your booking reference number to see the current status</p>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          className="input flex-1 font-mono uppercase"
          placeholder="e.g. KF-ABC123-XYZ"
          value={ref}
          onChange={(e) => setRef(e.target.value.toUpperCase())}
        />
        <button type="submit" disabled={loading} className="btn-primary px-6">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-400 font-mono">{result.booking.bookingRef}</p>
                <h2 className="text-xl font-bold text-gray-800">{result.booking.slotId?.title}</h2>
                <p className="text-sm text-gray-500">
                  <span className="flex items-center gap-1"><CategoryIcon icon={result.booking.slotId?.categoryId?.icon} size="xs" />{result.booking.slotId?.categoryId?.name}</span>
                </p>
              </div>
              <BookingStatusBadge status={result.booking.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Student</div>
                <div className="font-medium">{result.booking.studentId?.name}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Date & Time</div>
                <div className="font-medium">{formatDateTime(result.booking.slotId?.startTime)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Amount</div>
                <div className="font-medium">{formatINR(result.booking.slotId?.price)}</div>
              </div>
              {result.payment && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Payment</div>
                  <span className={`badge ${PAYMENT_STATUS_LABELS[result.payment.status]?.color}`}>
                    {PAYMENT_STATUS_LABELS[result.payment.status]?.label}
                  </span>
                </div>
              )}
            </div>

            {result.booking.status === 'confirmed' && result.booking.meetLink && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800 mb-1">✅ Session Confirmed!</p>
                <p className="text-sm text-green-700 mb-2">Your Google Meet link:</p>
                <a href={result.booking.meetLink} target="_blank" rel="noreferrer"
                  className="text-sm text-primary-600 hover:underline break-all">
                  {result.booking.meetLink}
                </a>
              </div>
            )}

            {result.booking.status === 'rejected' && result.booking.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-800">Payment Rejected</p>
                <p className="text-sm text-red-700">{result.booking.rejectionReason}</p>
                <p className="text-sm text-red-600 mt-1">Please log in to resubmit your payment.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingStatusPage;
