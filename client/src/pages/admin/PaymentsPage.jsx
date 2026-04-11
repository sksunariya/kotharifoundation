import { useState } from 'react';
import { paymentAPI } from '../../api/endpoints';
import { formatDateTime, formatINR } from '../../utils/formatDate';
import { PAYMENT_STATUS_LABELS } from '../../utils/statusHelpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const LIMIT = 20;

const VerifyModal = ({ payment, onClose, onSuccess }) => {
  const [step, setStep] = useState('review'); // 'review' | 'reject'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const booking = payment.bookingId;
  const student = booking?.studentId;
  const slot = booking?.slotId;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { data } = await paymentAPI.verify(payment._id, {});
      const warnings = data.warnings || [];
      const meetFailed = warnings.includes('meet_link_failed');
      const emailFailed = warnings.includes('email_failed');
      if (!meetFailed && !emailFailed) {
        toast.success('Payment approved! Meet link created and confirmation email sent.');
      } else {
        toast.success('Payment approved and booking confirmed.');
        if (meetFailed) toast.error('Could not create Google Meet link — add it manually.', { duration: 6000 });
        if (emailFailed) toast.error('Confirmation email failed — notify the student manually.', { duration: 6000 });
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    setLoading(true);
    try {
      const { data } = await paymentAPI.reject(payment._id, { reason });
      const emailFailed = (data.warnings || []).includes('email_failed');
      toast.success('Payment rejected.' + (emailFailed ? ' (Email failed — notify student manually.)' : ' Student notified.'));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-800">
            {step === 'reject' ? 'Reject Payment' : 'Review Payment'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'review' && (
          <>
            {payment.isDuplicateUtr && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                <span className="text-base flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-semibold">Duplicate UTR detected</p>
                  <p className="text-xs mt-0.5 text-red-600">
                    UTR <span className="font-mono">{payment.utrNumber}</span> has already been accepted for another booking.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm space-y-2">
              <div><span className="text-gray-500">Student:</span> <strong>{student?.name}</strong> <span className="text-gray-400 text-xs">({student?.email})</span></div>
              <div><span className="text-gray-500">Session:</span> <strong>{slot?.title}</strong></div>
              <div><span className="text-gray-500">Amount:</span> <strong>{formatINR(payment.amount)}</strong></div>
              <div>
                <span className="text-gray-500">UTR:</span>{' '}
                <span className="font-mono font-semibold">{payment.utrNumber || '—'}</span>
                {payment.isDuplicateUtr && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">Duplicate</span>}
              </div>
              <div>
                <span className="text-gray-500">Submitted:</span>{' '}
                <span className="font-medium">{payment.submittedAt ? formatDateTime(payment.submittedAt) : '—'}</span>
              </div>
              {payment.screenshotUrl && (
                <div>
                  <span className="text-gray-500">Screenshot:</span>{' '}
                  <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-sm font-medium">View →</a>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('reject')}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                ✗ Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : '✓ Approve Payment'}
              </button>
            </div>
          </>
        )}

        {step === 'reject' && (
          <>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
              <span className="font-medium">{student?.name}</span> · {slot?.title} · <span className="font-semibold">{formatINR(payment.amount)}</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Explain why this payment is being rejected (student will see this)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('review')} className="btn-secondary flex-1" disabled={loading}>← Back</button>
              <button
                onClick={handleReject}
                disabled={loading || !reason.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PaymentsPage = () => {
  const [status, setStatus] = useState('submitted');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data, loading, refetch } = useFetch(
    () => paymentAPI.getAll({ status, page, limit: LIMIT }),
    [status, page]
  );

  const payments = data?.payments || [];
  const pagination = data?.pagination || {};
  const statusOptions = ['submitted', 'under_review', 'verified', 'rejected', ''];

  const handleStatusChange = (s) => { setStatus(s); setPage(1); };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Payment Verification</h1>

      {selectedPayment && (
        <VerifyModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} onSuccess={refetch} />
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {statusOptions.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => handleStatusChange(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}
          >
            {s ? (PAYMENT_STATUS_LABELS[s]?.label || s) : 'All'}
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
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Session</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">UTR</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Submitted At</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No payments found.</td></tr>
                ) : payments.map((p) => (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{p.bookingId?.studentId?.name}</div>
                      <div className="text-gray-400 text-xs">{p.bookingId?.studentId?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{p.bookingId?.slotId?.title}</div>
                      <div className="text-gray-400 text-xs">{formatDateTime(p.bookingId?.slotId?.startTime)}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{formatINR(p.amount)}</td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {p.utrNumber || '—'}
                      {p.isDuplicateUtr && (
                        <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold non-mono" title="Duplicate UTR">⚠️ Dup</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {p.submittedAt ? formatDateTime(p.submittedAt) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${PAYMENT_STATUS_LABELS[p.status]?.color}`}>
                        {PAYMENT_STATUS_LABELS[p.status]?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {['submitted', 'under_review'].includes(p.status) && (
                        <button onClick={() => setSelectedPayment(p)} className="btn-primary text-xs py-1.5 px-3">
                          Review
                        </button>
                      )}
                      {p.screenshotUrl && (
                        <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs ml-2">
                          Screenshot
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-2">
              <Pagination
                page={pagination.page || page}
                totalPages={pagination.pages || 1}
                total={pagination.total || payments.length}
                limit={LIMIT}
                onPage={(p) => setPage(p)}
              />
            </div>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {payments.length === 0 ? (
              <p className="text-center py-10 text-gray-400">No payments found.</p>
            ) : payments.map((p) => (
              <div key={p._id} className="card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{p.bookingId?.studentId?.name}</p>
                    <p className="text-xs text-gray-400">{p.bookingId?.studentId?.email}</p>
                  </div>
                  <span className={`badge ${PAYMENT_STATUS_LABELS[p.status]?.color}`}>
                    {PAYMENT_STATUS_LABELS[p.status]?.label}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-medium">{p.bookingId?.slotId?.title}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(p.bookingId?.slotId?.startTime)}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {p.utrNumber && <span className="font-mono">UTR: {p.utrNumber} {p.isDuplicateUtr && '⚠️'}</span>}
                  {p.submittedAt && <span className="ml-2">· {formatDateTime(p.submittedAt)}</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{formatINR(p.amount)}</span>
                  <div className="flex items-center gap-2">
                    {p.screenshotUrl && (
                      <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">Screenshot</a>
                    )}
                    {['submitted', 'under_review'].includes(p.status) && (
                      <button onClick={() => setSelectedPayment(p)} className="btn-primary text-xs py-1.5 px-3">Review</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Pagination
              page={pagination.page || page}
              totalPages={pagination.pages || 1}
              total={pagination.total || payments.length}
              limit={LIMIT}
              onPage={(p) => setPage(p)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
