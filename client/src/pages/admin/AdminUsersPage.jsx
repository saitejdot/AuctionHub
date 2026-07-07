import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserX, UserCheck, ShieldAlert } from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/users?page=${page}&limit=20`);
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page]);

  const handleBlock = async (id) => {
    setActionLoading(id + '-block');
    try {
      await api.patch(`/admin/users/${id}/block`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBlocked: true } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (id) => {
    setActionLoading(id + '-unblock');
    try {
      await api.patch(`/admin/users/${id}/unblock`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBlocked: false } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unblock user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('PERMANENTLY delete this user? This action is irreversible.')) return;
    setActionLoading(id + '-delete');
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">User</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Email</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Role</th>
              <th className="text-left px-6 py-3 text-gray-600 font-semibold">Status</th>
              <th className="text-right px-6 py-3 text-gray-600 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {u.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {u.role !== 'admin' && (
                    <div className="flex items-center justify-end gap-3">
                      {u.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(u._id)}
                          disabled={actionLoading === u._id + '-unblock'}
                          className="flex items-center gap-1 text-green-600 hover:text-green-800 font-medium text-sm transition disabled:opacity-50"
                        >
                          <UserCheck size={16} /> Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(u._id)}
                          disabled={actionLoading === u._id + '-block'}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium text-sm transition disabled:opacity-50"
                        >
                          <UserX size={16} /> Block
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u._id)}
                        disabled={actionLoading === u._id + '-delete'}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} users)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
