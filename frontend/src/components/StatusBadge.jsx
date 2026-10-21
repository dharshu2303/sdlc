import React from 'react';

export default function StatusBadge({ status }) {
  let badgeClass = 'status-badge-draft';
  if (['Published', 'Approved', 'Completed', 'PASSED'].includes(status)) {
    badgeClass = 'status-badge-published';
  } else if (['Under Review', 'Submitted', 'InProgress', 'Pending'].includes(status)) {
    badgeClass = 'status-badge-review';
  } else if (['Changes Requested', 'BLOCKED', 'Locked', 'Rejected'].includes(status)) {
    badgeClass = 'status-badge-blocked';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide inline-flex items-center gap-1 ${badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
}
