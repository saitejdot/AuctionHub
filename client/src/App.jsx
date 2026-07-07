import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
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

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAuctionsPage from './pages/admin/AdminAuctionsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
              <Navbar />

              <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
                <Routes>
                  {/* Home */}
                  <Route path="/" element={
                    <div className="text-center mt-20">
                      <h1 className="text-5xl font-extrabold mb-4 text-gray-900">Welcome to <span className="text-primary-600">AuctionHub</span></h1>
                      <p className="text-xl text-gray-500 mb-8">The premier platform for real-time competitive online auctions.</p>
                      <a href="/auctions" className="bg-primary-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-primary-700 transition shadow">
                        Browse Auctions
                      </a>
                    </div>
                  } />

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
                      <h2 className="text-4xl font-bold text-gray-400 mb-4">404</h2>
                      <p className="text-gray-500">Page not found.</p>
                      <a href="/" className="mt-4 inline-block text-primary-600 font-semibold hover:underline">Go Home</a>
                    </div>
                  } />
                </Routes>
              </main>

              <footer className="bg-gray-800 text-white p-6 mt-auto text-center">
                <p>&copy; {new Date().getFullYear()} AuctionHub. All rights reserved.</p>
              </footer>
            </div>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

