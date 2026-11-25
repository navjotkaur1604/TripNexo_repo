export function formatINR(amount) {
  const value = Number(amount) || 0;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatINRRange(min, max) {
  if (Number(min) === Number(max)) return formatINR(min);
  return `${formatINR(min)} – ${formatINR(max)}`;
}

export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function capitalize(str = '') {
  return String(str)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
