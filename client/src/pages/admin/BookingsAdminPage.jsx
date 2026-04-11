import { useState } from 'react';
import { bookingAPI } from '../../api/endpoints';
import { formatDateTime, formatINR } from '../../utils/formatDate';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import ResourceModal from '../../components/ResourceModal';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const LIMIT = 20;

const MeetLinkModal = ({ booking, onClose, onSuccess }) => {
  const [meetLink, setMeetLink] = useState(booking.meetLink || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meetLink.trim()) { toast.error('Please enter a meet link.'); return; }
    setLoading(true);
    try {
      await bookingAPI.setMeetLink(booking._id, meetLink.trim());
      toast.success('Meet link saved. Student can now see it in My Bookings.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save meet link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-lg text-gray-800 mb-1">Set Google Meet Link</h3>
        <p className="text-sm text-gray-500 mb-4">
          This link will be shown only to <strong>{booking.studentId?.name}</strong> in their My Bookings page.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Meet URL</label>
            <input
              type="url"
              className="input"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={meetLink}
              onChange={e => setMeetLink(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BookingsAdminPage = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch(() => bookingAPI.getAll({ status, page, limit: LIMIT }), [status, page]);
  const [meetLinkBooking, setMeetLinkBooking] = useState(null);
  const [resourceSlot, setResourceSlot] = useState(null);

  const bookings = data?.bookings || [];
  const pagination = data?.pagination || {};

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id);
      toast.success('Booking cancelled.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed.');
    }
  };

  const statusOptions = ['', 'pending_payment', 'submitted', 'confirmed', 'rejected', 'cancelled', 'completed'];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">All Bookings</h1>

      {meetLinkBooking && (
        <MeetLinkModal
          booking={meetLinkBooking}
          onClose={() => setMeetLinkBooking(null)}
          onSuccess={refetch}
        />
      )}
      {resourceSlot && (
        <ResourceModal slot={resourceSlot} isAdmin={true} onClose={() => setResourceSlot(null)} />
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {statusOptions.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner fullPage /> : (
        <>
          {/* Table — md and up */}
          <div className="hidden md:block card p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Ref</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Session</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Meet Link</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No bookings found.</td></tr>
                ) : bookings.map((b) => (
                  <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{b.bookingRef}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{b.studentId?.name}</div>
                      <div className="text-gray-400 text-xs">{b.studentId?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{b.slotId?.title}</div>
                      <div className="text-gray-400 text-xs">{formatDateTime(b.slotId?.startTime)}</div>
                    </td>
                    <td className="py-3 px-4">{formatINR(b.slotId?.price)}</td>
                    <td className="py-3 px-4"><BookingStatusBadge status={b.status} /></td>
                    <td className="py-3 px-4">
                      {b.meetLink ? (
                        <div className="flex items-center gap-1">
                          <a href={b.meetLink} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">Link ↗</a>
                          {b.status === 'confirmed' && (
                            <button onClick={() => setMeetLinkBooking(b)} className="text-gray-400 hover:text-gray-600 text-xs ml-1" title="Edit link">✏️</button>
                          )}
                        </div>
                      ) : b.status === 'confirmed' ? (
                        <button
                          onClick={() => setMeetLinkBooking(b)}
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
                        >
                          + Add link
                        </button>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setResourceSlot(b.slotId)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                          📦 Resources
                        </button>
                        {!['cancelled', 'completed'].includes(b.status) && (
                          <button onClick={() => handleCancel(b._id)} className="btn-danger text-xs py-1.5 px-3">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-2">
              <Pagination
                page={pagination.page || page}
                totalPages={pagination.pages || 1}
                total={pagination.total || bookings.length}
                limit={LIMIT}
                onPage={(p) => setPage(p)}
              />
            </div>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {bookings.length === 0 ? (
              <p className="text-center py-10 text-gray-400">No bookings found.</p>
            ) : bookings.map((b) => (
              <div key={b._id} className="card space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{b.bookingRef}</p>
                    <p className="font-medium text-sm">{b.studentId?.name}</p>
                    <p className="text-xs text-gray-400">{b.studentId?.email}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{b.slotId?.title}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(b.slotId?.startTime)} · {formatINR(b.slotId?.price)}</p>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => setResourceSlot(b.slotId)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    📦 Resources
                  </button>
                  {b.meetLink ? (
                    <div className="flex items-center gap-1">
                      <a href={b.meetLink} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">Meet Link ↗</a>
                      {b.status === 'confirmed' && (
                        <button onClick={() => setMeetLinkBooking(b)} className="text-gray-400 hover:text-gray-600 text-xs ml-1">✏️</button>
                      )}
                    </div>
                  ) : b.status === 'confirmed' ? (
                    <button onClick={() => setMeetLinkBooking(b)} className="text-xs font-medium text-primary-600 hover:text-primary-700 underline">
                      + Add meet link
                    </button>
                  ) : null}
                  {!['cancelled', 'completed'].includes(b.status) && (
                    <button onClick={() => handleCancel(b._id)} className="btn-danger text-xs py-1 px-2.5 ml-auto">Cancel</button>
                  )}
                </div>
              </div>
            ))}
            <Pagination
              page={pagination.page || page}
              totalPages={pagination.pages || 1}
              total={pagination.total || bookings.length}
              limit={LIMIT}
              onPage={(p) => setPage(p)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BookingsAdminPage;
