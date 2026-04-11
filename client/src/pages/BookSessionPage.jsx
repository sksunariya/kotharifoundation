import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { slotAPI, bookingAPI, paymentAPI } from '../api/endpoints';
import { formatDateTime, formatINR } from '../utils/formatDate';
import QRDisplay from '../components/QRDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const BookSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isResume = location.state?.resume === true;
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('confirm'); // confirm | payment | submitted
  const [booking, setBooking] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [upiDisplayName, setUpiDisplayName] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Payment submission
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotError, setScreenshotError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
      setScreenshotError('Only image files or PDF are accepted.');
      e.target.value = '';
      setScreenshot(null);
      return;
    }
    setScreenshot(file);
  };

  useEffect(() => {
    slotAPI
      .getOne(id)
      .then(async (res) => {
        setSlot(res.data.slot);
        // Auto-resume to payment step if coming from My Bookings
        if (isResume) {
          try {
            const bookingRes = await bookingAPI.create({ slotId: id });
            setBooking(bookingRes.data.booking);
            setQrCode(bookingRes.data.qrCode);
            setUpiId(bookingRes.data.upiId);
            setUpiDisplayName(bookingRes.data.upiDisplayName);
            setStep('payment');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Could not load payment details.');
          }
        }
      })
      .catch(() => toast.error('Session not found'))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    try {
      const res = await bookingAPI.create({ slotId: id, notes });
      setBooking(res.data.booking);
      setQrCode(res.data.qrCode);
      setUpiId(res.data.upiId);
      setUpiDisplayName(res.data.upiDisplayName);
      setStep('payment');
      if (!isResume) toast.success('Booking created! Please complete payment.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const validateUtr = (val) => {
    if (!val.trim()) return 'UTR number is required.';
    if (!/^[A-Za-z0-9]{12,25}$/.test(val.trim())) return 'UTR must be 12-25 alphanumeric characters (no spaces or symbols).';
    return '';
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const utrErr = validateUtr(utrNumber);
    if (utrErr) { toast.error(utrErr); return; }
    if (!screenshot) { toast.error('Payment screenshot is required.'); return; }
    if (screenshotError) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('bookingId', booking._id);
      formData.append('utrNumber', utrNumber);
      formData.append('screenshot', screenshot);
      await paymentAPI.submit(formData);
      setStep('submitted');
      toast.success('Payment details submitted! We will verify shortly.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!slot) return <div className="text-center py-20 text-gray-400">Session not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {step === 'confirm' && (
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Book Session</h1>
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{slot.categoryId?.icon}</span>
              <span className="text-sm font-medium text-primary-600">{slot.categoryId?.name}</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{slot.title}</h2>
            {slot.description && <p className="text-gray-500 text-sm mb-4">{slot.description}</p>}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 mb-1">Date & Time</div>
                <div className="font-semibold">{formatDateTime(slot.startTime)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 mb-1">Price</div>
                <div className="font-semibold text-primary-700 text-lg">{formatINR(slot.price)}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Any specific topics or questions you'd like to cover..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleConfirmBooking} disabled={bookingLoading} className="btn-primary flex-1">
              {bookingLoading ? 'Creating booking...' : `Confirm & Pay ${formatINR(slot.price)}`}
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && booking && (
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Payment</h1>
          <p className="text-gray-500 mb-6">Booking ref: <span className="font-mono font-semibold">{booking.bookingRef}</span></p>

          <div className="mb-6">
            <QRDisplay
              qrCode={qrCode}
              upiId={upiId}
              upiDisplayName={upiDisplayName}
              amount={slot.price}
              bookingRef={booking.bookingRef}
            />
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Submit Payment Proof</h3>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UTR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input font-mono"
                  placeholder="e.g. 123456789012"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
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
                <p className="text-xs text-gray-400 mt-1">Accepted: images (JPEG, PNG, etc.) or PDF · Max 5 MB</p>
                {screenshotError && <p className="text-xs text-red-600 mt-1">{screenshotError}</p>}
                {screenshot && !screenshotError && (
                  <p className="text-xs text-green-600 mt-1">✓ {screenshot.name} ({(screenshot.size / 1024).toFixed(0)} KB)</p>
                )}
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
                {submitting ? 'Submitting...' : 'Submit Payment Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 'submitted' && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Submitted!</h2>
          <p className="text-gray-500 mb-2">Your booking reference: <span className="font-mono font-semibold">{booking?.bookingRef}</span></p>
          <p className="text-gray-500 mb-8">Our team will verify your payment and send you the Google Meet link via email.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/my-bookings')} className="btn-primary">View My Bookings</button>
            <button onClick={() => navigate('/booking-status')} className="btn-secondary">Check Status</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookSessionPage;
