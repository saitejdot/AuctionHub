import React from 'react';

const statusConfig = {
  draft:           { label: 'Draft',           bg: 'bg-gray-100',    text: 'text-gray-600' },
  live:            { label: 'Live',            bg: 'bg-green-100',   text: 'text-green-700' },
  ended:           { label: 'Ended',           bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  payment_pending: { label: 'Payment Pending', bg: 'bg-orange-100',  text: 'text-orange-700' },
  sold:            { label: 'Sold',            bg: 'bg-blue-100',    text: 'text-blue-700' },
  payment_expired: { label: 'Expired',         bg: 'bg-red-100',     text: 'text-red-600' },
  cancelled:       { label: 'Cancelled',       bg: 'bg-red-200',     text: 'text-red-800' },
};

const AuctionStatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
};

export default AuctionStatusBadge;
