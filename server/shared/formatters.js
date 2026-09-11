/**
 * Shared Formatting & Presentation Helpers
 */

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const str = String(dateString).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function getMatchScoreColor(score) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case 'Searching':
    case 'Available':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Possible Match':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Claim Requested':
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Claimed':
    case 'Accepted':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Closed':
    case 'Resolved':
    case 'Rejected':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

module.exports = {
  formatDate,
  getMatchScoreColor,
  getStatusBadgeStyle,
};
