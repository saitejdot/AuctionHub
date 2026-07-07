import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CreditCard } from 'lucide-react';

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/transactions?page=${page}&limit=20`);
        setTransactions(res.data.data);
        setPagination(res.data.pagination);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [page]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Auction</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Buyer</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Seller</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Amount</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No transactions yet</td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{t.auction?.title}</td>
                  <td className="px-6 py-4 text-gray-600">{t.buyer?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{t.seller?.name}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">${t.amount}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</p>
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

export default AdminTransactionsPage;
