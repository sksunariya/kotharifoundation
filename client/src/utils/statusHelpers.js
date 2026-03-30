export const BOOKING_STATUS_LABELS = {
  pending_payment: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-800' },
  submitted: { label: 'Payment Submitted', color: 'bg-blue-100 text-blue-800' },
  under_review: { label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Payment Rejected', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
};

export const PAYMENT_STATUS_LABELS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  under_review: { label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
};

export const getStatusBadge = (status, map) => {
  return map[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};
