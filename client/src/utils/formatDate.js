import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) =>
  format(new Date(date), 'dd MMM yyyy');

export const formatDateTime = (date) =>
  format(new Date(date), 'dd MMM yyyy, hh:mm a');

export const formatTimeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
