import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { slotAPI, bookingAPI, paymentAPI } from '../api/endpoints';
import { formatDateTime, formatINR } from '../utils/formatDate';
import QRDisplay from '../components/QRDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryIcon from '../components/CategoryIcon';
import toast from 'react-hot-toast';

const SessionMeta = ({ icon, label, value, highlight }) => (
  <div className="flex items-start gap-3">
    <span className="text-xl mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-primary-700 text-base' : 'text-gray-800'}`}>{value}</p>
    </div>
  </div>
);

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
  const [isFree, setIsFree] = useState(false);

  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotError, setScreenshotError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
        if (isResume) {
          try {
            const bookingRes = await bookingAPI.create({ slotId: id });
            setBooking(bookingRes.data.booking);
            if (bookingRes.data.isFree) {
              setIsFree(true);
              setStep('submitted');
            } else {
              setQrCode(bookingRes.data.qrCode);
              setUpiId(bookingRes.data.upiId);
              setUpiDisplayName(bookingRes.data.upiDisplayName);
              setStep('payment');
            }
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
      if (res.data.isFree) {
        setIsFree(true);
        setStep('submitted');
        toast.success('Session booked successfully!');
      } else {
        setQrCode(res.data.qrCode);
        setUpiId(res.data.upiId);
        setUpiDisplayName(res.data.upiDisplayName);
        setStep('payment');
        if (!isResume) toast.success('Booking created! Please complete payment.');
      }
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

  // Duration in minutes
  const getDuration = (start, end) => {
    if (!start || !end) return null;
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!slot) return <div className="text-center py-20 text-gray-400">Session not found.</div>;

  const duration = getDuration(slot.startTime, slot.endTime);
  const hasSyllabus = slot.syllabus && slot.syllabus.replace(/<[^>]*>/g, '').trim() !== '';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">

      {/* ── Step: Confirm ─────────────────────────────────────────────── */}
      {step === 'confirm' && (
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">

          {/* Left: Session details + syllabus */}
          <div className="lg:col-span-2 space-y-6">

            {/* Session header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon icon={slot.categoryId?.icon} size="sm" />
                <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
                  {slot.categoryId?.name}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">{slot.title}</h1>
              {slot.description && (
                <p className="mt-2 text-gray-500 leading-relaxed">{slot.description}</p>
              )}
            </div>

            {/* Session meta grid */}
            <div className="card grid grid-cols-2 sm:grid-cols-4 gap-5">
              <SessionMeta icon="📅" label="Date & Time" value={formatDateTime(slot.startTime)} />
              {duration && <SessionMeta icon="⏱️" label="Duration" value={duration} />}
              <SessionMeta icon="🪑" label="Spots Left" value={`${slot.availableSpots ?? (slot.capacity - slot.bookedCount)} / ${slot.capacity}`} />
              <SessionMeta icon="💰" label="Price" value={slot.price === 0 ? 'Free' : formatINR(slot.price)} highlight />
            </div>

            {/* Syllabus */}
            {hasSyllabus && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📋</span>
                  <h2 className="text-lg font-bold text-gray-800">Session Syllabus</h2>
                </div>
                <div
                  className="prose-content"
                  dangerouslySetInnerHTML={{ __html: slot.syllabus }}
                />
              </div>
            )}
          </div>

          {/* Right: Booking card */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6 space-y-4">
              <div className="text-center pb-3 border-b border-gray-100">
                <div className="text-3xl font-bold text-primary-700">
                  {slot.price === 0 ? 'Free' : formatINR(slot.price)}
                </div>
                <div className="text-xs text-gray-400 mt-1">per session</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  className="input resize-none text-sm"
                  rows={4}
                  placeholder="Any specific topics or questions you'd like to cover..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="btn-primary w-full py-3 text-base"
              >
                {bookingLoading
                  ? 'Creating booking...'
                  : slot.price === 0
                  ? 'Confirm Booking'
                  : `Confirm & Pay ${formatINR(slot.price)}`}
              </button>

              <button
                onClick={() => navigate(-1)}
                className="btn-secondary w-full text-sm"
              >
                Go Back
              </button>

              <p className="text-xs text-gray-400 text-center">
                You won't be charged until payment is verified by our team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Payment ─────────────────────────────────────────────── */}
      {step === 'payment' && booking && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Session summary pill */}
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
            <CategoryIcon icon={slot.categoryId?.icon} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{slot.title}</p>
              <p className="text-xs text-gray-400">{formatDateTime(slot.startTime)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary-700">{formatINR(slot.price)}</p>
              <p className="text-xs text-gray-400 font-mono">{booking.bookingRef}</p>
            </div>
          </div>

          {/* QR code */}
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">Complete Payment</h1>
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

      {/* ── Step: Submitted ───────────────────────────────────────────── */}
      {step === 'submitted' && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isFree ? 'Booking Confirmed!' : 'Payment Submitted!'}
          </h2>
          <p className="text-gray-500 mb-1">
            Booking reference: <span className="font-mono font-semibold text-gray-700">{booking?.bookingRef}</span>
          </p>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            {isFree
              ? 'Your session has been booked. You will receive the Google Meet link via email before the session.'
              : 'Our team will verify your payment and send the Google Meet link to your email once confirmed.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/my-bookings')} className="btn-primary">View My Bookings</button>
            <button onClick={() => navigate('/booking-status')} className="btn-secondary">Check Status</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookSessionPage;
