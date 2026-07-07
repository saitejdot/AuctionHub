import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Auction Pages
import AuctionsPage from './pages/auctions/AuctionsPage';
import AuctionDetailPage from './pages/auctions/AuctionDetailPage';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import AuctionForm from './pages/seller/AuctionForm';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import WinsPage from './pages/buyer/WinsPage';

// Notification Page
import NotificationsPage from './pages/notifications/NotificationsPage';

// Profile Page
import ProfilePage from './pages/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAuctionsPage from './pages/admin/AdminAuctionsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';

// Home Page
import HomePage from './pages/HomePage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
                <Navbar />

                <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
                  <Routes>
                    {/* Home */}
                    <Route path="/" element={<HomePage />} />

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Public Auction Routes */}
                    <Route path="/auctions" element={<AuctionsPage />} />
                    <Route path="/auctions/:id" element={<AuctionDetailPage />} />

                    {/* Buyer Protected Routes */}
                    <Route element={<ProtectedRoute roles={['buyer']} />}>
                      <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
                      <Route path="/wins" element={<WinsPage />} />
                    </Route>

                    {/* Seller Protected Routes */}
                    <Route element={<ProtectedRoute roles={['seller']} />}>
                      <Route path="/seller/dashboard" element={<SellerDashboard />} />
                      <Route path="/seller/auctions/new" element={<AuctionForm />} />
                      <Route path="/seller/auctions/:id/edit" element={<AuctionForm isEdit={true} />} />
                    </Route>

                    {/* Shared Protected Routes (any authenticated user) */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </Route>

                    {/* Admin Protected Routes */}
                    <Route element={<ProtectedRoute roles={['admin']} />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<AdminUsersPage />} />
                      <Route path="/admin/auctions" element={<AdminAuctionsPage />} />
                      <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={
                      <div className="text-center mt-20">
                        <h2 className="text-6xl font-extrabold text-gray-200 mb-4">404</h2>
                        <p className="text-xl text-gray-500 mb-6">This page doesn't exist.</p>
                        <Link to="/" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition">
                          Go Home
                        </Link>
                      </div>
                    } />
                  </Routes>
                </main>

                <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
                  <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">AuctionHub</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-sm">Real-Time Online Auctions</span>
                    </div>
                    <p className="text-sm">&copy; {new Date().getFullYear()} AuctionHub. All rights reserved.</p>
                  </div>
                </footer>
              </div>
            </Router>
          </ToastProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
