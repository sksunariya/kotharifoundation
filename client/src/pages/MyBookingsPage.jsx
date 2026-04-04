import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../api/endpoints';
import { formatDateTime, formatINR, formatDate } from '../utils/formatDate';
import BookingStatusBadge from '../components/BookingStatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import useFetch from '../hooks/useFetch';
import toast from 'react-hot-toast';

const ResubmitModal = ({ booking, onClose, onSuccess }) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) { toast.error('Please enter UTR number.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('utrNumber', utrNumber);
      if (screenshot) formData.append('screenshot', screenshot);
      await paymentAPI.resubmit(booking.paymentId, formData);
      toast.success('Payment resubmitted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resubmission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Resubmit Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New UTR Number</label>
            <input type="text" className="input font-mono" placeholder="12-digit UTR" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Screenshot</label>
            <input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Resubmit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyBookingsPage = () => {
  const { data, loading, refetch } = useFetch(() => bookingAPI.getMy());
  const [resubmitBooking, setResubmitBooking] = useState(null);

  const bookings = data?.bookings || [];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">My Bookings</h1>

      {resubmitBooking && (
        <ResubmitModal
          booking={resubmitBooking}
          onClose={() => setResubmitBooking(null)}
          onSuccess={refetch}
        />
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg font-medium">No bookings yet</p>
          <Link to="/sessions" className="btn-primary mt-4 inline-block">Browse Sessions</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="card">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                <div>
                  <span className="font-mono text-xs text-gray-400">{booking.bookingRef}</span>
                  <h3 className="font-semibold text-gray-800">{booking.slotId?.title}</h3>
                  <span className="text-xs text-gray-500">{booking.slotId?.categoryId?.icon} {booking.slotId?.categoryId?.name}</span>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm text-gray-500 mb-4">
                <div>📅 {formatDateTime(booking.slotId?.startTime)}</div>
                <div>Session Fee: {formatINR(booking.slotId?.price)}</div>
              </div>

              {booking.status === 'confirmed' && (
                <div className={`rounded-lg p-3 mb-3 border ${booking.meetLink ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
                  <p className="text-sm font-semibold text-green-800 mb-2">✅ Session Confirmed</p>
                  {booking.meetLink ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <a
                        href={booking.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        🎥 Join Session
                      </a>
                      <span className="text-xs text-gray-500">
                        Scheduled for {formatDate(booking.slotId?.startTime)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700">
                      Your Google Meet link will appear here once it's ready. You'll be notified by email.
                    </p>
                  )}
                </div>
              )}
              {booking.status === 'confirmed' && (
                <Link
                  to={`/resources/${booking.slotId?._id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors mb-3"
                >
                  📦 Access Session Resources
                </Link>
              )}

              {booking.status === 'rejected' && booking.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-red-800">❌ Rejected</p>
                  <p className="text-sm text-red-700">{booking.rejectionReason}</p>
                </div>
              )}

              {booking.status === 'rejected' && (
                <button
                  onClick={() => setResubmitBooking({ _id: booking._id, paymentId: booking.paymentId })}
                  className="btn-primary text-sm"
                >
                  Resubmit Payment
                </button>
              )}

              {booking.status === 'pending_payment' && (
                <Link
                  to={`/sessions/${booking.slotId?._id}`}
                  state={{ resume: true }}
                  className="btn-secondary text-sm inline-block"
                >
                  Complete Payment
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
