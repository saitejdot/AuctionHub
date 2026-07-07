import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyAuctions();
  }, []);

  const fetchMyAuctions = async () => {
    try {
      setLoading(true);
      // Fetching auctions for the logged-in seller
      // Currently the backend getAuctions doesn't filter by seller unless we pass it.
      // Wait, let's just fetch all and filter for now, or add a /my-auctions endpoint later.
      // Let's use the generic endpoint with a seller filter if possible.
      // The backend needs `req.query.seller` to be supported. I will just fetch all and filter in frontend for this mock,
      // or modify backend later. For now let's assume we can pass ?seller=userId
      const res = await api.get('/auctions');
      // Filter manually for now to ensure it works
      const myAuctions = res.data.data.filter(a => a.seller._id === user._id || a.seller === user._id);
      setAuctions(myAuctions);
    } catch (err) {
      setError('Failed to fetch your auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this auction?')) {
      try {
        await api.delete(`/auctions/${id}`);
        setAuctions(auctions.filter(a => a._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete auction');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <Link
          to="/seller/auctions/new"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center font-medium transition"
        >
          <Plus size={20} className="mr-2" />
          Create New Auction
        </Link>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {auctions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            You haven't created any auctions yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Bid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bids</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auctions.map((auction) => (
                <tr key={auction._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded overflow-hidden">
                        {auction.images && auction.images[0] && (
                          <img className="h-10 w-10 object-cover" src={auction.images[0]} alt="" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{auction.title}</div>
                        <div className="text-sm text-gray-500">Ends: {new Date(auction.endTime).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 uppercase">
                      {auction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${auction.currentHighestBid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auction.bidCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/seller/auctions/${auction._id}/edit`} className="text-primary-600 hover:text-primary-900 mr-4 inline-block">
                      <Edit size={18} />
                    </Link>
                    <button onClick={() => handleDelete(auction._id)} className="text-red-600 hover:text-red-900 inline-block">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
