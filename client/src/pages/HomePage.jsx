import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, ShieldCheck, Zap, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
    <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
      <Icon className="text-primary-600" size={24} />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const HomePage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  // Determine where "Start Selling" should point
  const sellLink = isAuthenticated && user?.role === 'seller'
    ? '/seller/auctions/new'
    : '/register';

  const sellLabel = isAuthenticated && user?.role === 'seller'
    ? 'Create an Auction'
    : 'Start Selling';

  return (
    <div className="flex flex-col gap-20 py-10">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-medium text-sm mb-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
          </span>
          Live Bidding Available Now
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
          Find It, Bid It, <span className="text-primary-600">Win It.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          The premier platform for real-time competitive online auctions. Discover unique items, place live bids, and secure your wins instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auctions"
            className="w-full sm:w-auto bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition shadow-lg hover:shadow-primary-500/30 flex items-center justify-center gap-2"
          >
            <Gavel size={20} />
            Browse Auctions
          </Link>
          <Link
            to={sellLink}
            className="w-full sm:w-auto bg-white text-gray-800 border-2 border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
          >
            {sellLabel}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 -mx-4 px-4 py-20 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose AuctionHub?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Experience the thrill of the auction block from the comfort of your home with our enterprise-grade platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Zap}
              title="Real-Time Bidding"
              description="Our WebSocket-powered engine ensures you see bids the millisecond they happen. No refreshing required."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Secure Payments"
              description="Integrated with Razorpay for bank-grade security on all your winning transactions."
            />
            <FeatureCard
              icon={Clock}
              title="Instant Notifications"
              description="Never miss out. Get instantly notified when you're outbid, when an auction is ending, or when you win."
            />
            <FeatureCard
              icon={Gavel}
              title="Fair Play System"
              description="Strict minimum bid increments and hard deadlines ensure a level playing field for all participants."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-900 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+PC9zdmc+')] opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start bidding?</h2>
          <p className="text-primary-200 text-lg md:text-xl mb-10 max-w-2xl mx-auto">Join thousands of users discovering rare items and amazing deals every single day.</p>
          <Link
            to="/register"
            className="inline-block bg-white text-primary-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
