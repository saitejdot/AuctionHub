import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Gavel, CreditCard, TrendingUp, BarChart2 } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border rounded-xl p-6 flex items-center gap-5">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="bg-blue-500" />
        <StatCard icon={Gavel} label="Total Auctions" value={stats?.totalAuctions} color="bg-purple-500" />
        <StatCard icon={TrendingUp} label="Live Auctions" value={stats?.liveAuctions} color="bg-green-500" />
        <StatCard icon={CreditCard} label="Total Transactions" value={stats?.totalTransactions} color="bg-orange-500" />
        <StatCard icon={BarChart2} label="Total Revenue" value={`₹${stats?.totalRevenue?.toFixed(2) || 0}`} color="bg-emerald-600" />
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/users" className="bg-white border rounded-xl p-6 hover:shadow-md transition group">
          <Users size={28} className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900">Manage Users</h3>
          <p className="text-sm text-gray-500 mt-1">View, block, and unblock accounts</p>
        </Link>
        <Link to="/admin/auctions" className="bg-white border rounded-xl p-6 hover:shadow-md transition group">
          <Gavel size={28} className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900">Manage Auctions</h3>
          <p className="text-sm text-gray-500 mt-1">Review and cancel auctions</p>
        </Link>
        <Link to="/admin/transactions" className="bg-white border rounded-xl p-6 hover:shadow-md transition group">
          <CreditCard size={28} className="text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900">Transactions</h3>
          <p className="text-sm text-gray-500 mt-1">View all platform transactions</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
