import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Clock, User, ChevronLeft } from 'lucide-react';
import BidPanel from '../../components/bidding/BidPanel';
import BidHistory from '../../components/bidding/BidHistory';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
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

  const handleBidSuccess = (newBid) => {
    // The socket will broadcast the bid to everyone including the sender,
    // so we don't necessarily need to manually update state here,
    // but updating it eagerly is good for UX.
    // However, to avoid duplicates, we can just rely on the socket, or do an optimistic update.
    // For simplicity, we let the socket handle the update.
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (!auction) return <div className="text-center mt-10">Auction not found</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/auctions" className="flex items-center text-gray-500 hover:text-primary-600 mb-6 transition">
        <ChevronLeft size={20} className="mr-1" />
        Back to Auctions
      </Link>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Section */}
          <div className="bg-gray-100 p-8 flex items-center justify-center min-h-[400px]">
            {auction.images && auction.images.length > 0 ? (
              <img
                src={auction.images[0]}
                alt={auction.title}
                className="max-h-[500px] object-contain"
              />
            ) : (
              <div className="text-gray-400">No images available</div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-8 flex flex-col">
            <div className="mb-2 flex justify-between items-center">
              <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded font-semibold uppercase tracking-wide">
                {auction.category}
              </span>
              <span className={`text-sm font-bold uppercase ${auction.status === 'live' ? 'text-green-600' : 'text-gray-500'}`}>
                {auction.status}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{auction.title}</h1>
            
            <div className="flex items-center text-sm text-gray-500 mb-6 pb-6 border-b">
              <div className="flex items-center mr-6">
                <User size={16} className="mr-2" />
                <span>Seller: {auction.seller.name}</span>
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                <span>Ends: {new Date(auction.endTime).toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{auction.description}</p>
            </div>

            <div className="mt-auto">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                    <p className="text-4xl font-bold text-gray-900">${auction.currentHighestBid}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Bids</p>
                    <p className="text-xl font-semibold text-gray-700">{auction.bidCount}</p>
                  </div>
                </div>
                
                {auction.status === 'live' ? (
                  isAuthenticated ? (
                    user.role === 'buyer' ? (
                      <BidPanel 
                        auctionId={auction._id}
                        currentBid={auction.currentHighestBid}
                        minIncrement={auction.minBidIncrement}
                        onBidSuccess={handleBidSuccess}
                      />
                    ) : (
                      <div className="mt-4 text-orange-600 text-sm font-medium">Sellers cannot place bids.</div>
                    )
                  ) : (
                    <div className="mt-6 text-center">
                      <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                        Log in to place a bid
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="mt-4 text-red-600 font-bold text-center">This auction has ended.</div>
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
