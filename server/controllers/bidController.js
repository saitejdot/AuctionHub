const asyncHandler = require('express-async-handler');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const sendResponse = require('../utils/sendResponse');

// @desc    Place a bid on an auction
// @route   POST /api/bids
// @access  Private (Buyer only)
exports.placeBid = asyncHandler(async (req, res) => {
  const { auctionId, amount } = req.body;

  // 1. Validate inputs
  if (!auctionId || !amount) {
    res.status(400);
    throw new Error('Please provide auction ID and bid amount');
  }

  // 2. Fetch the auction (read-only snapshot)
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  // 3. Ensure auction is live
  if (auction.status !== 'live') {
    res.status(400);
    throw new Error(`Cannot place bid. Auction status is ${auction.status}`);
  }

  // 4. Ensure bidder is not the seller
  if (auction.seller.toString() === req.user._id.toString()) {
    res.status(403);
    throw new Error('Sellers cannot bid on their own auctions');
  }

  // 5. Check if the bid amount is high enough based on current state
  const minimumRequired = auction.currentHighestBid + auction.minBidIncrement;
  
  // If no bids yet, they must at least match startingPrice + minBidIncrement (as per architecture decision)
  // Wait, the plan says: `bid >= startingPrice + minBidIncrement` for the first bid, but currentHighestBid defaults to startingPrice.
  if (amount < minimumRequired) {
    res.status(400);
    throw new Error(`Bid amount must be at least $${minimumRequired}`);
  }

  // 6. Atomic Update: Try to update the auction ONLY if the currentHighestBid hasn't changed since we read it
  const updatedAuction = await Auction.findOneAndUpdate(
    {
      _id: auctionId,
      status: 'live',
      currentHighestBid: auction.currentHighestBid, // Concurrency snapshot check
    },
    {
      $set: {
        currentHighestBid: amount,
        highestBidder: req.user._id,
      },
      $inc: { bidCount: 1 },
    },
    { new: true }
  );

  // 7. Check for concurrency collision
  if (!updatedAuction) {
    res.status(409); // Conflict
    throw new Error('Another bid was placed before yours. Please review the new current bid and try again.');
  }

  // 8. Record the bid in the Bid collection
  const bid = await Bid.create({
    auction: auctionId,
    bidder: req.user._id,
    amount: amount,
  });

  // Fetch populated bid to emit
  const populatedBid = await Bid.findById(bid._id).populate('bidder', 'name avatar');

  // 9. (Phase 8/10) Emit Socket.IO event and Notifications here...
  const { getIo } = require('../socket/socketHandler');
  const io = getIo();
  io.to(`auction_${auctionId}`).emit('new_bid', populatedBid);

  sendResponse(res, 201, 'Bid placed successfully', populatedBid);
});

// @desc    Get bids for an auction
// @route   GET /api/bids/auction/:id
// @access  Public
exports.getAuctionBids = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = (page - 1) * limit;

  const bids = await Bid.find({ auction: req.params.id })
    .populate('bidder', 'name avatar')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Bid.countDocuments({ auction: req.params.id });
  const pages = Math.ceil(total / limit);

  sendResponse(res, 200, 'Bids fetched successfully', bids, {
    page,
    limit,
    total,
    pages,
  });
});
