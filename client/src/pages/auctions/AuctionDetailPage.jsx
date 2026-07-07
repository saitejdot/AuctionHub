import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Clock, User, ChevronLeft, Edit, Trash2, ShieldCheck } from 'lucide-react';
import BidPanel from '../../components/bidding/BidPanel';
import BidHistory from '../../components/bidding/BidHistory';
import PaymentButton from '../../components/payment/PaymentButton';

// Simple countdown timer component
const Countdown = ({ endDate, status }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (status !== 'live') return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('Ending...');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, status]);

  if (status !== 'live') return null;

  return (
    <div className="flex items-center text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full text-sm">
      <Clock size={14} className="mr-1.5" />
      {timeLeft}
    </div>
  );
};

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { showToast } = useToast();
  
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        const [auctionRes, bidsRes] = await Promise.all([
          api.get(`/auctions/${id}`),
          api.get(`/bids/auction/${id}?limit=50`)
        ]);
        setAuction(auctionRes.data.data);
        setBids(bidsRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load auction details');
      } finally {
        setLoading(false);
      }
    };
    fetchAuctionData();
  }, [id]);

  useEffect(() => {
    if (socket && auction) {
      socket.emit('join_auction', id);

      socket.on('new_bid', (newBid) => {
        setBids((prevBids) => [newBid, ...prevBids]);
        setAuction((prevAuction) => ({
          ...prevAuction,
          currentHighestBid: newBid.amount,
          bidCount: prevAuction.bidCount + 1,
          highestBidder: newBid.bidder,
        }));
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_auction', id);
        socket.off('new_bid');
      }
    };
  }, [socket, auction, id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this auction?')) {
      try {
        await api.delete(`/auctions/${id}`);
        showToast('Auction deleted successfully', 'success');
        navigate('/seller/dashboard');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete auction', 'error');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (!auction) return <div className="text-center mt-10">Auction not found</div>;

  const isSeller = isAuthenticated && user?._id === auction.seller._id;
  const isWinner = isAuthenticated && auction.highestBidder === user?._id;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link to="/auctions" className="flex items-center text-gray-500 hover:text-primary-600 transition font-medium">
          <ChevronLeft size={20} className="mr-1" />
          Back to Auctions
        </Link>
        
        {/* Seller Actions */}
        {isSeller && auction.bidCount === 0 && auction.status === 'live' && (
          <div className="flex gap-2">
            <Link 
              to={`/seller/auctions/${auction._id}/edit`}
              className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              <Edit size={16} /> Edit
            </Link>
            <button 
              onClick={handleDelete}
              className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition text-sm font-medium"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Section */}
          <div className="bg-gray-50 p-8 flex items-center justify-center min-h-[400px] border-r border-gray-100">
            {auction.images && auction.images.length > 0 ? (
              <img
                src={auction.images[0]}
                alt={auction.title}
                className="max-h-[500px] object-contain drop-shadow-md rounded-lg"
              />
            ) : (
              <div className="text-gray-400 font-medium">No images available</div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-8 flex flex-col">
            <div className="mb-3 flex justify-between items-center">
              <span className="inline-block bg-primary-50 text-primary-700 border border-primary-200 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {auction.category}
              </span>
              <div className="flex items-center gap-3">
                <Countdown endDate={auction.endTime} status={auction.status} />
                <span className={`text-sm font-black uppercase tracking-wider ${
                  auction.status === 'live' ? 'text-green-500' : 
                  auction.status === 'sold' ? 'text-blue-500' :
                  auction.status === 'payment_pending' ? 'text-yellow-500' :
                  'text-gray-500'
                }`}>
                  {auction.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">{auction.title}</h1>
            
            <div className="flex items-center text-sm text-gray-500 mb-6 pb-6 border-b">
              <div className="flex items-center mr-6 bg-gray-50 px-3 py-1.5 rounded-lg">
                <User size={16} className="mr-2 text-gray-400" />
                <span className="font-medium text-gray-700">Seller: {auction.seller.name}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Clock size={16} className="mr-2" />
                <span>Ends: {new Date(auction.endTime).toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{auction.description}</p>
            </div>

            <div className="mt-auto">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border shadow-inner">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Current Bid</p>
                    <p className="text-5xl font-black text-gray-900 tracking-tighter">${auction.currentHighestBid}</p>
                  </div>
                  <div className="text-right pb-1">
                    <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Total Bids</p>
                    <p className="text-2xl font-bold text-gray-700">{auction.bidCount}</p>
                  </div>
                </div>
                
                {auction.status === 'live' ? (
                  isAuthenticated ? (
                    user.role === 'buyer' ? (
                      <BidPanel 
                        auctionId={auction._id}
                        currentBid={auction.currentHighestBid}
                        minIncrement={auction.minBidIncrement}
                        onBidSuccess={() => {}} // Handled by socket
                      />
                    ) : (
                      <div className="mt-4 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center">
                        <ShieldCheck className="mr-2" size={18} />
                        Sellers cannot place bids on auctions.
                      </div>
                    )
                  ) : (
                    <div className="mt-6 text-center">
                      <Link to="/login" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 transition inline-block w-full text-center shadow-md">
                        Log in to place a bid
                      </Link>
                    </div>
                  )
                ) : auction.status === 'payment_pending' && isWinner ? (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="text-green-800 font-bold text-lg mb-1 flex items-center">
                        🎉 You won this auction!
                      </h4>
                      <p className="text-green-700 text-sm">Please complete your payment to finalize the transaction.</p>
                    </div>
                    <PaymentButton 
                      auctionId={auction._id} 
                      amount={auction.currentHighestBid} 
                      auctionTitle={auction.title} 
                    />
                  </div>
                ) : (
                  <div className="mt-6 bg-gray-200 text-gray-600 font-bold text-center py-3 rounded-lg flex items-center justify-center uppercase tracking-widest text-sm">
                    {auction.status === 'payment_pending' ? 'Waiting for winner payment' : 'Auction Ended'}
                  </div>
                )}
              </div>
              
              <BidHistory bids={bids} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;

