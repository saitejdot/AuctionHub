import React, { useState } from 'react';
import api from '../../api/axios';

const BidPanel = ({ auctionId, currentBid, minIncrement, onBidSuccess }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const minimumRequired = currentBid + minIncrement;

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const amount = Number(bidAmount);

    if (amount < minimumRequired) {
      setError(`Bid must be at least $${minimumRequired}`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/bids', { auctionId, amount });
      setBidAmount('');
      if (onBidSuccess) {
        onBidSuccess(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Place a Bid</h3>
      
      <div className="flex justify-between text-sm text-gray-600 mb-4">
        <span>Current Highest Bid: <strong>${currentBid}</strong></span>
        <span>Min Increment: <strong>${minIncrement}</strong></span>
      </div>

      <form onSubmit={handleBidSubmit}>
        <div className="flex items-start gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              $
            </span>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={minimumRequired}
              step="any"
              placeholder={`Min ${minimumRequired}`}
              className="w-full pl-8 pr-4 py-3 border rounded-md focus:ring-primary-500 focus:border-primary-500 text-lg font-bold"
              required
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-primary-700 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? 'Placing...' : 'Bid'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidPanel;
