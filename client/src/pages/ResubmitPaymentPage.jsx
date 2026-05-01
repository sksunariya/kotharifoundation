import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../api/endpoints';
import { formatDateTime, formatINR } from '../utils/formatDate';
import QRDisplay from '../components/QRDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryIcon from '../components/CategoryIcon';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ResubmitPaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotError, setScreenshotError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    bookingAPI.getResubmitDetails(bookingId)
      .then(res => setDetails(res.data))
      .catch(err => {
        toast.error(err.response?.data?.message || 'Could not load payment details.');
        navigate('/my-bookings');
      })
      .finally(() => setLoading(false));
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setScreenshotError('');
    if (!file) { setScreenshot(null); return; }

    if (file.size > MAX_FILE_SIZE) {
      setScreenshotError('File size must be under 5 MB.');
      e.target.value = '';
      setScreenshot(null);
      return;
    }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setScreenshotError('Only image files (JPEG, PNG, etc.) or PDF are accepted.');
      e.target.value = '';
      setScreenshot(null);
      return;
    }
    setScreenshot(file);
  };

  const validateUtr = (val) => {
    if (!val.trim()) return 'UTR number is required.';
    if (!/^[A-Za-z0-9]{12,25}$/.test(val.trim())) return 'UTR must be 12-25 alphanumeric characters (no spaces or symbols).';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const utrErr = validateUtr(utrNumber);
    if (utrErr) { toast.error(utrErr); return; }
    if (!screenshot) { toast.error('Payment screenshot is required.'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('utrNumber', utrNumber.trim());
      formData.append('screenshot', screenshot);
      await paymentAPI.resubmit(details.paymentId, formData);
      setSubmitted(true);
      toast.success('Payment resubmitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resubmission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!details) return null;

  const { booking, qrCode, upiId, upiDisplayName } = details;
  const slot = booking.slotId;

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Resubmitted!</h2>
          <p className="text-gray-500 mb-2">
            Booking ref: <span className="font-mono font-semibold">{booking.bookingRef}</span>
          </p>
          <p className="text-gray-500 mb-8">Our team will verify your payment and update you by email.</p>
          <button onClick={() => navigate('/my-bookings')} className="btn-primary">
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {/* Back link */}
      <Link to="/my-bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        ← My Bookings
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Resubmit Payment</h1>
      <p className="text-gray-500 mb-6">
        Booking: <span className="font-mono font-semibold text-gray-700">{booking.bookingRef}</span>
      </p>

      {/* Session info */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CategoryIcon icon={slot.categoryId?.icon} size="sm" />
          <span className="text-sm font-medium text-primary-600">{slot.categoryId?.name}</span>
        </div>
        <h2 className="font-semibold text-gray-800 mb-1">{slot.title}</h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>📅 {formatDateTime(slot.startTime)}</span>
          <span className="font-semibold text-primary-700">{formatINR(slot.price)}</span>
        </div>
        {booking.rejectionReason && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-red-800">Previous rejection reason:</p>
            <p className="text-sm text-red-700 mt-0.5">{booking.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* QR code */}
      <div className="mb-6">
        <QRDisplay
          qrCode={qrCode}
          upiId={upiId}
          upiDisplayName={upiDisplayName}
          amount={slot.price}
          bookingRef={booking.bookingRef}
        />
      </div>

      {/* Payment proof form */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Submit New Payment Proof</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UTR Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input font-mono"
              placeholder="e.g. 123456789012"
              value={utrNumber}
              onChange={e => setUtrNumber(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
              required
              maxLength={25}
            />
            <p className="text-xs text-gray-400 mt-1">Find it in your UPI app transaction history</p>
            {utrNumber && validateUtr(utrNumber) && (
              <p className="text-xs text-red-500 mt-1">{validateUtr(utrNumber)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Screenshot <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400 mt-1">
              Accepted: images (JPEG, PNG, etc.) or PDF · Max 5 MB
            </p>
            {screenshotError && (
              <p className="text-xs text-red-600 mt-1">{screenshotError}</p>
            )}
            {screenshot && !screenshotError && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {screenshot.name} ({(screenshot.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/my-bookings')} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !!screenshotError} className="btn-primary flex-1 py-2.5">
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResubmitPaymentPage;
