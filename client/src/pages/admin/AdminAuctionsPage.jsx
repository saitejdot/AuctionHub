import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Gavel, XCircle } from 'lucide-react';

const statusColors = {
  live: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  ended: 'bg-yellow-100 text-yellow-700',
  payment_pending: 'bg-orange-100 text-orange-700',
  sold: 'bg-blue-100 text-blue-700',
  payment_expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-200 text-red-800',
};

const AdminAuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelLoading, setCancelLoading] = useState(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page, limit: 20 });
        if (statusFilter) params.set('status', statusFilter);
        const res = await api.get(`/admin/auctions?${params}`);
        setAuctions(res.data.data);
        setPagination(res.data.pagination);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load auctions');
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, [page, statusFilter]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this auction? This cannot be undone.')) return;
    setCancelLoading(id);
    try {
      await api.patch(`/admin/auctions/${id}/cancel`);
      setAuctions((prev) => prev.map((a) => a._id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel auction');
    } finally {
      setCancelLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('PERMANENTLY delete this auction? This action is irreversible.')) return;
    setCancelLoading(id + '-delete');
    try {
      await api.delete(`/admin/auctions/${id}`);
      setAuctions((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete auction');
    } finally {
      setCancelLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Gavel size={24} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Manage Auctions</h1>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Status</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
          <option value="payment_pending">Payment Pending</option>
          <option value="sold">Sold</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Title</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Seller</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Status</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Highest Bid</th>
              <th className="text-right px-6 py-3 text-gray-600 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {auctions.map((a) => (
              <tr key={a._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <Link to={`/auctions/${a._id}`} className="font-medium text-primary-600 hover:underline">
                    {a.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">{a.seller?.name}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {a.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">${a.currentHighestBid}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {!['sold', 'cancelled'].includes(a.status) && (
                      <button
                        onClick={() => handleCancel(a._id)}
                        disabled={cancelLoading === a._id}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium text-sm transition disabled:opacity-50"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(a._id)}
                      disabled={cancelLoading === a._id + '-delete'}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Previous</button>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuctionsPage;
