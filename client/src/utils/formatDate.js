const IST = 'Asia/Kolkata';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Extract individual date/time parts already converted to IST
const istParts = (date) => {
  const parts = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: IST,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(new Date(date)).forEach(({ type, value }) => {
    parts[type] = value;
  });
  return parts;
};

// "05 Apr 2026"
export const formatDate = (date) => {
  if (!date) return '—';
  const p = istParts(date);
  return `${String(p.day).padStart(2, '0')} ${MONTHS[+p.month - 1]} ${p.year}`;
};

// "05 Apr 2026, 06:49 AM"
export const formatDateTime = (date) => {
  if (!date) return '—';
  const p = istParts(date);
  return `${String(p.day).padStart(2, '0')} ${MONTHS[+p.month - 1]} ${p.year}, ${p.hour}:${p.minute} ${p.dayPeriod.toUpperCase()}`;
};

// "just now" / "5m ago" / "3h ago" / "2d ago"
export const formatTimeAgo = (date) => {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)  return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60)     return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)      return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)     return `${days}d ago`;
  return formatDate(date);
};

// "₹1,500"
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);
