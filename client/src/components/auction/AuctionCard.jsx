import React from 'react';
import { Link } from 'react-router-dom';
import AuctionStatusBadge from './AuctionStatusBadge';
import CountdownTimer from './CountdownTimer';
import { Gavel } from 'lucide-react';

const AuctionCard = ({ auction }) => {
  return (
    <Link to={`/auctions/${auction._id}`} className="group block bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        {auction.images && auction.images.length > 0 ? (
          <img
            src={auction.images[0]}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Gavel size={48} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <AuctionStatusBadge status={auction.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{auction.category}</p>
        <h3 className="font-semibold text-gray-900 truncate text-base mb-3 group-hover:text-primary-600 transition-colors">
          {auction.title}
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Current Bid</p>
            <p className="text-xl font-bold text-gray-900">₹{auction.currentHighestBid}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Time Left</p>
            {auction.status === 'live' ? (
              <CountdownTimer endTime={auction.endTime} className="text-sm justify-end" />
            ) : (
              <span className="text-sm font-semibold text-gray-400">—</span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-400">
          <span>{auction.bidCount} bid{auction.bidCount !== 1 ? 's' : ''}</span>
          <span>By {auction.seller?.name}</span>
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;
