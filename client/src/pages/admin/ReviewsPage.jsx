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

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className={`text-2xl transition-colors ${s <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const StarDisplay = ({ rating }) => (
  <span className="text-yellow-400">
    {'★'.repeat(rating)}<span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
  </span>
);

const statusBadge = (status) => {
  const map = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const EMPTY_NEW = { reviewerName: '', reviewerRole: '', rating: 5, content: '' };

const ReviewsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Approve/reject modal — also allows editing content & rating before approving
  const [actionModal, setActionModal] = useState(null); // { review, action }
  const [actionDraft, setActionDraft] = useState({ rating: 5, content: '', adminNotes: '' });

  // Edit modal
  const [editModal, setEditModal] = useState(null); // review object
  const [editDraft, setEditDraft] = useState({ rating: 5, content: '', reviewerName: '', reviewerRole: '', adminNotes: '' });

  // Add new review modal
  const [showAdd, setShowAdd] = useState(false);
  const [newDraft, setNewDraft] = useState(EMPTY_NEW);
  const [addLoading, setAddLoading] = useState(false);

  const { data, loading, refetch } = useFetch(() => reviewAPI.getAdmin({ status: statusFilter || undefined }), [statusFilter]);
  const reviews = data?.reviews || [];

  // ── Approve / Reject ──────────────────────────────────────────────────────
  const openActionModal = (review, action) => {
    setActionModal({ review, action });
    setActionDraft({ rating: review.rating, content: review.content, adminNotes: review.adminNotes || '' });
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { review, action } = actionModal;
    setActionLoading(review._id);
    setActionModal(null);
    try {
      if (action === 'approve') {
        await reviewAPI.approve(review._id, actionDraft);
        toast.success('Review approved and published.');
      } else {
        await reviewAPI.reject(review._id, { adminNotes: actionDraft.adminNotes });
        toast.success('Review rejected.');
      }
      refetch();
    } catch {
      toast.error(`Failed to ${action} review.`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEditModal = (review) => {
    setEditModal(review);
    setEditDraft({
      rating: review.rating,
      content: review.content,
      reviewerName: review.reviewerName || review.studentId?.name || '',
      reviewerRole: review.reviewerRole || '',
      adminNotes: review.adminNotes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setActionLoading(editModal._id);
    setEditModal(null);
    try {
      await reviewAPI.update(editModal._id, editDraft);
      toast.success('Review updated.');
      refetch();
    } catch {
      toast.error('Failed to update review.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (review) => {
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
  };

  // ── Add new ───────────────────────────────────────────────────────────────
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newDraft.reviewerName.trim()) { toast.error('Reviewer name is required.'); return; }
    if (newDraft.content.length < 10) { toast.error('Content must be at least 10 characters.'); return; }
    setAddLoading(true);
    try {
      await reviewAPI.createAdmin(newDraft);
      toast.success('Review added and published.');
      setShowAdd(false);
      setNewDraft(EMPTY_NEW);
      refetch();
    } catch {
      toast.error('Failed to add review.');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Reviews</h1>
        <button
          onClick={() => { setShowAdd(true); setNewDraft(EMPTY_NEW); }}
          className="btn-primary px-4 py-2 text-sm"
        >
          + Add Review
        </button>
      </div>

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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-800">
                      {review.isAdminCreated ? review.reviewerName : (review.studentId?.name || 'Unknown')}
                    </span>
                    {review.isAdminCreated
                      ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin created</span>
                      : <span className="text-xs text-gray-400">{review.studentId?.email}</span>
                    }
                    {statusBadge(review.status)}
                  </div>
                  {review.isAdminCreated && review.reviewerRole && (
                    <div className="text-sm text-gray-500">{review.reviewerRole}</div>
                  )}
                  {!review.isAdminCreated && (
                    <div className="text-sm text-gray-500">
                      Session: <span className="font-medium text-gray-700">{review.slotId?.title || 'N/A'}</span>
                      {review.bookingId?.bookingRef && <span className="ml-2 font-mono text-xs text-gray-400">({review.bookingId.bookingRef})</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <StarDisplay rating={review.rating} />
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
                    onClick={() => openActionModal(review, 'approve')}
                    disabled={actionLoading === review._id}
                    className="px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button
                    onClick={() => openActionModal(review, 'reject')}
                    disabled={actionLoading === review._id}
                    className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                )}
                <button
                  onClick={() => openEditModal(review)}
                  disabled={actionLoading === review._id}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  ✎ Edit
                </button>
                <button
                  onClick={() => handleDelete(review)}
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

      {/* ── Approve / Reject modal ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg text-gray-800 mb-1 capitalize">{actionModal.action} Review</h3>
            <p className="text-sm text-gray-500 mb-4">
              {actionModal.action === 'approve'
                ? 'You can edit the content and rating before publishing.'
                : 'This review will be hidden from the site.'}
            </p>

            {actionModal.action === 'approve' && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <StarPicker value={actionDraft.rating} onChange={(v) => setActionDraft(d => ({ ...d, rating: v }))} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Content</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={actionDraft.content}
                    onChange={e => setActionDraft(d => ({ ...d, content: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (internal)</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Internal notes..."
                value={actionDraft.adminNotes}
                onChange={e => setActionDraft(d => ({ ...d, adminNotes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActionModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirm {actionModal.action}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Edit Review</h3>

            {editModal.isAdminCreated && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    className="input"
                    value={editDraft.reviewerName}
                    onChange={e => setEditDraft(d => ({ ...d, reviewerName: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Role / Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. JEE Aspirant, Parent"
                    value={editDraft.reviewerRole}
                    onChange={e => setEditDraft(d => ({ ...d, reviewerRole: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <StarPicker value={editDraft.rating} onChange={(v) => setEditDraft(d => ({ ...d, rating: v }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Content</label>
              <textarea
                className="input"
                rows={4}
                value={editDraft.content}
                onChange={e => setEditDraft(d => ({ ...d, content: e.target.value }))}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (internal)</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Internal notes..."
                value={editDraft.adminNotes}
                onChange={e => setEditDraft(d => ({ ...d, adminNotes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary flex-1">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add new review modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Add Review / Testimonial</h3>
            <form onSubmit={handleAddReview} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Priya Sharma"
                  value={newDraft.reviewerName}
                  onChange={e => setNewDraft(d => ({ ...d, reviewerName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Role / Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. JEE Aspirant, Parent"
                  value={newDraft.reviewerRole}
                  onChange={e => setNewDraft(d => ({ ...d, reviewerRole: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarPicker value={newDraft.rating} onChange={(v) => setNewDraft(d => ({ ...d, rating: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Content</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Write the testimonial here..."
                  value={newDraft.content}
                  onChange={e => setNewDraft(d => ({ ...d, content: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={addLoading}>
                  {addLoading ? 'Adding...' : 'Add & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
