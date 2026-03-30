import { BOOKING_STATUS_LABELS } from '../utils/statusHelpers';

const BookingStatusBadge = ({ status }) => {
  const { label, color } = BOOKING_STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`badge ${color}`}>{label}</span>
  );
};

export default BookingStatusBadge;
