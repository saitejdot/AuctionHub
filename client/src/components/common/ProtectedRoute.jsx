import React, { useContext } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ShieldOff } from 'lucide-react';

const ProtectedRoute = ({ roles = [] }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    // Show a proper Access Denied page instead of a silent redirect
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <ShieldOff className="text-red-500" size={40} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Access Denied</h1>
        <p className="text-gray-500 text-lg max-w-md mb-2">
          This page requires a <span className="font-semibold text-gray-700">{roles.join(' or ')} account</span>.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          You are currently logged in as a <span className="font-medium text-gray-600">{user?.role}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Go Home
          </Link>
          {roles.includes('seller') && (
            <Link
              to="/register"
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition shadow-sm"
            >
              Register a Seller Account
            </Link>
          )}
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
