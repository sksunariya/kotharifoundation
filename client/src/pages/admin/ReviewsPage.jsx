import { useState } from 'react';
import { reviewAPI } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const StarRating = ({ rating }) => (
  <span className="text-yellow-400">
    {'★'.repeat(rating)}
    <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
  </span>
);

const statusBadge = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const ReviewsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notesModal, setNotesModal] = useState(null); // { review, action }
  const [adminNotes, setAdminNotes] = useState('');

  const { data, loading, refetch } = useFetch(() => reviewAPI.getAdmin({ status: statusFilter || undefined }), [statusFilter]);

  const reviews = data?.reviews || [];

  const handleAction = async (review, action) => {
    if (action === 'approve' || action === 'reject') {
      setNotesModal({ review, action });
      setAdminNotes('');
      return;
    }
    if (action === 'delete') {
      if (!window.confirm('Delete this review permanently?')) return;
      setActionLoading(review._id);
      try {
        await reviewAPI.delete(review._id);
        toast.success('Review deleted.');
        refetch();
      } catch {
        toast.error('Failed to delete review.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleConfirmAction = async () => {
    if (!notesModal) return;
    const { review, action } = notesModal;
    setActionLoading(review._id);
    setNotesModal(null);
    try {
      if (action === 'approve') {
        await reviewAPI.approve(review._id, { adminNotes });
        toast.success('Review approved and published.');
      } else {
        await reviewAPI.reject(review._id, { adminNotes });
        toast.success('Review rejected.');
      }
      refetch();
    } catch {
      toast.error(`Failed to ${action} review.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Reviews</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto w-full sm:w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === tab.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">⭐</div>
          <p>No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{review.studentId?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{review.studentId?.email}</span>
                    {statusBadge(review.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Session: <span className="font-medium text-gray-700">{review.slotId?.title || 'N/A'}</span>
                    {review.bookingId?.bookingRef && <span className="ml-2 font-mono text-xs text-gray-400">({review.bookingId.bookingRef})</span>}
                  </div>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} />
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 mb-3">{review.content}</p>

              {review.adminNotes && (
                <p className="text-xs text-gray-500 italic mb-3">Admin note: {review.adminNotes}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {review.status !== 'approved' && (
                  <button
                    onClick={() => handleAction(review, 'approve')}
                    disabled={actionLoading === review._id}
                    className="px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button
                    onClick={() => handleAction(review, 'reject')}
                    disabled={actionLoading === review._id}
                    className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                )}
                <button
                  onClick={() => handleAction(review, 'delete')}
                  disabled={actionLoading === review._id}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin notes modal */}
      {notesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg text-gray-800 mb-1 capitalize">{notesModal.action} Review</h3>
            <p className="text-sm text-gray-500 mb-4">
              {notesModal.action === 'approve' ? 'This review will be published on the site.' : 'This review will be hidden from the site.'}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (optional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Internal notes..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setNotesModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${notesModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirm {notesModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
