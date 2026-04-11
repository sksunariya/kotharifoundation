import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingAPI, reviewAPI } from '../api/endpoints';
import { formatDateTime, formatINR, formatDate } from '../utils/formatDate';
import BookingStatusBadge from '../components/BookingStatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ResourceModal from '../components/ResourceModal';
import useFetch from '../hooks/useFetch';
import toast from 'react-hot-toast';


const ReviewModal = ({ booking, existingReview, onClose, onSuccess }) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [content, setContent] = useState(existingReview?.content || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 10) { toast.error('Review must be at least 10 characters.'); return; }
    setLoading(true);
    try {
      await reviewAPI.submit({ bookingId: booking._id, rating, content: content.trim() });
      toast.success('Review submitted! It will be visible once approved.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-lg text-gray-800 mb-1">Leave a Review</h3>
        <p className="text-sm text-gray-500 mb-4">{booking.slotId?.title}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Feedback</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Share your experience with this session..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1">{content.length}/1000 characters</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(() => bookingAPI.getMy());
  const { data: reviewData, refetch: refetchReviews } = useFetch(() => reviewAPI.getMy());
  const [reviewBooking, setReviewBooking] = useState(null);
  const [resourceSlot, setResourceSlot] = useState(null);

  const bookings = data?.bookings || [];
  const myReviews = reviewData?.reviews || [];

  const getReviewForBooking = (bookingId) => myReviews.find(r => r.bookingId === bookingId || r.bookingId?._id === bookingId);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">My Bookings</h1>

      {resourceSlot && (
        <ResourceModal slot={resourceSlot} isAdmin={false} onClose={() => setResourceSlot(null)} />
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          existingReview={getReviewForBooking(reviewBooking._id)}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => { refetch(); refetchReviews(); }}
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
          {bookings.map((booking) => {
            const existingReview = getReviewForBooking(booking._id);
            return (
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

                {['confirmed', 'completed'].includes(booking.status) && (
                  <button
                    onClick={() => setResourceSlot(booking.slotId)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors mb-3"
                  >
                    📦 Access Session Resources
                  </button>
                )}

                {['confirmed', 'completed'].includes(booking.status) && (
                  <div className="mb-3">
                    {!existingReview ? (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-4 py-2 rounded-lg transition-colors"
                      >
                        ⭐ Leave a Review
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                        {'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}&nbsp;
                        Review submitted
                        {existingReview.status === 'pending' && <span className="ml-1 text-xs text-yellow-600">(Pending approval)</span>}
                        {existingReview.status === 'approved' && <span className="ml-1 text-xs text-green-600">(Published)</span>}
                        {existingReview.status === 'rejected' && <span className="ml-1 text-xs text-red-600">(Not approved)</span>}
                      </div>
                    )}
                  </div>
                )}

                {booking.status === 'rejected' && booking.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-red-800">❌ Rejected</p>
                    <p className="text-sm text-red-700">{booking.rejectionReason}</p>
                  </div>
                )}

                {booking.status === 'rejected' && (
                  <button
                    onClick={() => navigate(`/resubmit-payment/${booking._id}`)}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
