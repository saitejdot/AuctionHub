import React from 'react';

const BidHistory = ({ bids }) => {
  if (!bids || bids.length === 0) {
    return (
      <div className="text-gray-500 py-4 text-center border-t mt-6">
        No bids yet. Be the first to bid!
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Bid History</h3>
      <div className="bg-white border rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
          {bids.map((bid) => (
            <li key={bid._id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                  {bid.bidder?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{bid.bidder?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(bid.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                ${bid.amount}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BidHistory;
