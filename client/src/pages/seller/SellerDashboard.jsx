import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, Edit, Trash2, Box } from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAuctions();
  }, []);

  const fetchMyAuctions = async () => {
    try {
      setLoading(true);
      // Fetching only auctions for the logged-in seller using the new backend filter
      const res = await api.get(`/auctions?seller=${user._id}`);
      setAuctions(res.data.data);
    } catch (err) {
      showToast('Failed to fetch your auctions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this auction?')) {
      try {
        await api.delete(`/auctions/${id}`);
        setAuctions(auctions.filter((a) => a._id !== id));
        showToast('Auction deleted successfully', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete auction', 'error');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your auction listings</p>
        </div>
        <Link
          to="/seller/auctions/new"
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center font-medium transition shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Create New Auction
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {auctions.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Box size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-500">You haven't created any auctions yet.</p>
            <Link to="/seller/auctions/new" className="text-primary-600 font-medium hover:underline mt-2 inline-block">
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Bid</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Winner</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bids</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {auctions.map((auction) => (
                  <tr key={auction._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg border overflow-hidden">
                          {auction.images && auction.images[0] ? (
                            <img className="h-full w-full object-cover" src={auction.images[0]} alt="" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <Box size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Link to={`/auctions/${auction._id}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600">
                            {auction.title}
                          </Link>
                          <div className="text-xs text-gray-500 mt-0.5">Ends: {new Date(auction.endTime).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full capitalize ${
                        auction.status === 'live' ? 'bg-green-100 text-green-700' :
                        auction.status === 'ended' ? 'bg-gray-100 text-gray-700' :
                        auction.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {auction.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{auction.currentHighestBid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {['payment_pending', 'sold', 'payment_expired'].includes(auction.status) && auction.highestBidder ? (
                        <div>
                          <p className="font-semibold text-gray-900">{auction.highestBidder.name}</p>
                          <p className="text-xs text-gray-400">Highest bidder</p>
                        </div>
                      ) : auction.status === 'live' ? (
                        <span className="text-gray-400 text-xs">Ongoing</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No winner</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {auction.bidCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/seller/auctions/${auction._id}/edit`} 
                        className={`mr-4 inline-flex items-center p-1.5 rounded-md ${
                          auction.bidCount > 0 
                            ? 'text-gray-400 cursor-not-allowed opacity-50' 
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        title={auction.bidCount > 0 ? 'Cannot edit after bidding starts' : 'Edit Auction'}
                      >
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(auction._id)}
                        disabled={auction.bidCount > 0}
                        className={`inline-flex items-center p-1.5 rounded-md ${
                          auction.bidCount > 0 
                            ? 'text-gray-400 cursor-not-allowed opacity-50' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={auction.bidCount > 0 ? 'Cannot delete after bidding starts' : 'Delete Auction'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
