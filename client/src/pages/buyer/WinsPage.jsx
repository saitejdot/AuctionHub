import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentButton from '../../components/payment/PaymentButton';
import { Trophy, ExternalLink, Clock } from 'lucide-react';

const WinsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [pendingWins, setPendingWins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, wonRes] = await Promise.all([
          api.get('/transactions/buyer?limit=50'),
          api.get('/auctions/won'),
        ]);
        setTransactions(transRes.data.data);
        // Only show payment_pending ones (sold already appear in transactions)
        setPendingWins(wonRes.data.data.filter((a) => a.status === 'payment_pending'));
      } catch (err) {
        console.error('Failed to fetch wins:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasAny = transactions.length > 0 || pendingWins.length > 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={28} className="text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-900">My Wins</h1>
      </div>

      {!hasAny ? (
        <div className="bg-white border rounded-xl py-16 text-center text-gray-400">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No wins yet</p>
          <p className="text-sm mt-1">Place bids and win auctions to see them here.</p>
          <Link to="/auctions" className="mt-4 inline-block text-primary-600 font-semibold hover:underline">
            Browse auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Payments */}
          {pendingWins.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-yellow-600 mb-3 flex items-center gap-2">
                <Clock size={16} /> Awaiting Payment
              </h2>
              <div className="space-y-4">
                {pendingWins.map((auction) => (
                  <div key={auction._id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-wrap items-center gap-6">
                    {auction.images?.[0] && (
                      <img
                        src={auction.images[0]}
                        alt={auction.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{auction.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Seller: {auction.seller?.name}</p>
                      <p className="text-xs text-gray-400">Ended: {new Date(auction.endTime).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-gray-900">₹{auction.currentHighestBid}</p>
                      <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                        Payment Pending
                      </span>
                    </div>
                    <div className="w-full sm:w-auto">
                      <PaymentButton
                        auctionId={auction._id}
                        amount={auction.currentHighestBid}
                        auctionTitle={auction.title}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Transactions */}
          {transactions.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-green-600 mb-3 flex items-center gap-2">
                <Trophy size={16} /> Completed Wins
              </h2>
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t._id} className="bg-white border rounded-xl p-6 flex items-center gap-6">
                    {t.auction?.images?.[0] && (
                      <img
                        src={t.auction.images[0]}
                        alt={t.auction.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{t.auction?.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Seller: {t.seller?.name}</p>
                      <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-gray-900">₹{t.amount}</p>
                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        Completed
                      </span>
                    </div>
                    <Link
                      to={`/auctions/${t.auction?._id}`}
                      className="text-gray-400 hover:text-primary-600 transition"
                    >
                      <ExternalLink size={18} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WinsPage;
