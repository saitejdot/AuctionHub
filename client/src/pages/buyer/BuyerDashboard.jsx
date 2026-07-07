import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentButton from '../../components/payment/PaymentButton';
import { Trophy, Package, ShoppingBag, Clock, AlertCircle } from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [pendingWins, setPendingWins] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, wonRes] = await Promise.all([
          api.get('/transactions/buyer?limit=5'),
          api.get('/auctions/won'),
        ]);
        setTransactions(transRes.data.data);
        setPendingWins(wonRes.data.data.filter((a) => a.status === 'payment_pending'));
      } catch (err) {
        console.error('Failed to load buyer data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Your buyer dashboard</p>
      </div>

      {/* Pending Payments Alert */}
      {pendingWins.length > 0 && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-yellow-600" />
            <h2 className="font-semibold text-yellow-800">
              You have {pendingWins.length} auction{pendingWins.length > 1 ? 's' : ''} awaiting payment
            </h2>
          </div>
          <div className="space-y-4">
            {pendingWins.map((auction) => (
              <div key={auction._id} className="bg-white border border-yellow-100 rounded-lg p-4 flex flex-wrap items-center gap-4">
                {auction.images?.[0] && (
                  <img
                    src={auction.images[0]}
                    alt={auction.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{auction.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock size={12} /> Complete payment before it expires
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 mb-1">₹{auction.currentHighestBid}</p>
                </div>
                <PaymentButton
                  auctionId={auction._id}
                  amount={auction.currentHighestBid}
                  auctionTitle={auction.title}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link to="/auctions" className="bg-white border rounded-xl p-6 hover:shadow-md transition group">
          <ShoppingBag size={28} className="text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900">Browse Auctions</h3>
          <p className="text-sm text-gray-500 mt-1">Find and bid on live auctions</p>
        </Link>
        <Link to="/wins" className="bg-white border rounded-xl p-6 hover:shadow-md transition group relative">
          <Trophy size={28} className="text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900">My Wins</h3>
          <p className="text-sm text-gray-500 mt-1">Auctions you've won</p>
          {pendingWins.length > 0 && (
            <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingWins.length} pending
            </span>
          )}
        </Link>
        <Link to="/notifications" className="bg-white border rounded-xl p-6 hover:shadow-md transition group">
          <Package size={28} className="text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900">Transactions</h3>
          <p className="text-sm text-gray-500 mt-1">View purchase history</p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
          <Link to="/wins" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {transactions.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
            <p>No transactions yet. Win an auction to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <li key={t._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t.auction?.title}</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-lg font-bold text-gray-800">₹{t.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
