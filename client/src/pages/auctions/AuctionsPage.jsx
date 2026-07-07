import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AuctionCard from '../../components/auction/AuctionCard';
import { Search, Filter, Gavel } from 'lucide-react';

const CATEGORIES = ['Electronics', 'Vehicles', 'Art', 'Collectibles', 'Fashion', 'Other'];
const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
  { value: 'sold', label: 'Sold' },
];

const AuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || 'live';

  const [searchTerm, setSearchTerm] = useState(search);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page });
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        if (status) params.set('status', status);

        const res = await api.get(`/auctions?${params}`);
        setAuctions(res.data.data);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch auctions');
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, [page, search, category, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm, category, status, page: 1 });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Gavel size={28} className="text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Auctions</h1>
        {pagination.total > 0 && (
          <span className="text-sm text-gray-500">({pagination.total} listings)</span>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border mb-8 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button type="submit" className="bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 transition text-sm font-medium">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <Filter className="text-gray-400 flex-shrink-0" size={18} />
          <select
            value={category}
            onChange={(e) => setSearchParams({ search, category: e.target.value, status, page: 1 })}
            className="border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => setSearchParams({ search, category, status: e.target.value, page: 1 })}
            className="border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-center text-red-600 py-10 bg-red-50 rounded-xl border border-red-200">{error}</div>
      ) : auctions.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl border">
          <Gavel size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No auctions found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          <button
            onClick={() => setSearchParams({ search, category, status, page: Math.max(1, page - 1) })}
            disabled={page === 1}
            className="px-4 py-2 rounded-md border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <button
                key={p}
                onClick={() => setSearchParams({ search, category, status, page: p })}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  page === p ? 'bg-primary-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                {p}
              </button>
            ))}
          <button
            onClick={() => setSearchParams({ search, category, status, page: Math.min(pagination.pages, page + 1) })}
            disabled={page === pagination.pages}
            className="px-4 py-2 rounded-md border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuctionsPage;



