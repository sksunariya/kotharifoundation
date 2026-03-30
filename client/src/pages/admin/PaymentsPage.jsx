import { useState } from 'react';
import { paymentAPI } from '../../api/endpoints';
import { formatDateTime, formatINR, formatTimeAgo } from '../../utils/formatDate';
import { PAYMENT_STATUS_LABELS } from '../../utils/statusHelpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const VerifyModal = ({ payment, onClose, onSuccess }) => {
  const [action, setAction] = useState('verify'); // verify | reject
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const booking = payment.bookingId;
  const student = booking?.studentId;
  const slot = booking?.slotId;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (action === 'verify') {
        const { data } = await paymentAPI.verify(payment._id, {});
        const warnings = data.warnings || [];
        const meetFailed = warnings.includes('meet_link_failed');
        const emailFailed = warnings.includes('email_failed');

        if (!meetFailed && !emailFailed) {
          toast.success('Payment verified! Meet link created and confirmation email sent.');
        } else {
          toast.success('Payment verified and booking confirmed.');
          if (meetFailed) toast.error('Could not create Google Meet link — please add it manually in the session slot.', { duration: 6000 });
          if (emailFailed) toast.error('Confirmation email could not be sent — please notify the student manually.', { duration: 6000 });
        }
      } else {
        if (!reason.trim()) { toast.error('Please provide a rejection reason.'); setLoading(false); return; }
        const { data } = await paymentAPI.reject(payment._id, { reason });
        const emailFailed = (data.warnings || []).includes('email_failed');
        if (emailFailed) {
          toast.success('Payment rejected.');
          toast.error('Rejection email could not be sent — please notify the student manually.', { duration: 6000 });
        } else {
          toast.success('Payment rejected. Student notified by email.');
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Review Payment</h3>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-2">
          <div><span className="text-gray-500">Student:</span> <strong>{student?.name}</strong> ({student?.email})</div>
          <div><span className="text-gray-500">Session:</span> <strong>{slot?.title}</strong></div>
          <div><span className="text-gray-500">Amount:</span> <strong>{formatINR(payment.amount)}</strong></div>
          <div><span className="text-gray-500">UTR:</span> <span className="font-mono">{payment.utrNumber}</span></div>
          <div><span className="text-gray-500">Submitted:</span> {payment.submittedAt ? formatTimeAgo(payment.submittedAt) : '—'}</div>
          {payment.screenshotUrl && (
            <div>
              <span className="text-gray-500">Screenshot:</span>{' '}
              <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">View →</a>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setAction('verify')} className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${action === 'verify' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
            ✅ Approve
          </button>
          <button onClick={() => setAction('reject')} className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${action === 'reject' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}>
            ❌ Reject
          </button>
        </div>

        {action === 'reject' && (
          <textarea
            className="input resize-none mb-4"
            rows={3}
            placeholder="Reason for rejection (student will see this)"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 font-semibold py-2 rounded-lg transition-colors ${action === 'verify' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {loading ? 'Processing...' : action === 'verify' ? 'Approve Payment' : 'Reject Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentsPage = () => {
  const [status, setStatus] = useState('submitted');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { data, loading, refetch } = useFetch(() => paymentAPI.getAll({ status }), [status]);

  const payments = data?.payments || [];
  const statusOptions = ['submitted', 'under_review', 'verified', 'rejected', ''];

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
            onClick={() => setStatus(s)}
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
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No payments found.</td></tr>
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
                    <td className="py-3 px-4 font-mono text-xs">{p.utrNumber || '—'}</td>
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
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold">{formatINR(p.amount)}</span>
                    {p.utrNumber && <span className="text-gray-400 font-mono text-xs ml-2">UTR: {p.utrNumber}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.screenshotUrl && (
                      <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">
                        Screenshot
                      </a>
                    )}
                    {['submitted', 'under_review'].includes(p.status) && (
                      <button onClick={() => setSelectedPayment(p)} className="btn-primary text-xs py-1.5 px-3">
                        Review
                      </button>
                    )}
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

export default PaymentsPage;
