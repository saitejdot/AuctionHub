const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Bid = require('../models/Bid');
const sendResponse = require('../utils/sendResponse');

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalAuctions,
    totalTransactions,
    liveAuctions,
    totalRevenue,
  ] = await Promise.all([
    User.countDocuments(),
    Auction.countDocuments(),
    Transaction.countDocuments(),
    Auction.countDocuments({ status: 'live' }),
    Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  sendResponse(res, 200, 'Stats fetched', {
    totalUsers,
    totalAuctions,
    totalTransactions,
    liveAuctions,
    totalRevenue: totalRevenue[0]?.total || 0,
  });
});

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  const users = await User.find({}, '-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  sendResponse(res, 200, 'Users fetched', users, {
    page, limit, total, pages: Math.ceil(total / limit),
  });
});

// @desc    Block a user
// @route   PATCH /api/admin/users/:id/block
// @access  Private (Admin only)
exports.blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot block another admin');
  }
  user.isBlocked = true;
  await user.save();
  sendResponse(res, 200, 'User blocked successfully', { id: user._id, isBlocked: true });
});

// @desc    Unblock a user
// @route   PATCH /api/admin/users/:id/unblock
// @access  Private (Admin only)
exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isBlocked = false;
  await user.save();
  sendResponse(res, 200, 'User unblocked successfully', { id: user._id, isBlocked: false });
});

// @desc    Get all auctions (admin view, with status filter)
// @route   GET /api/admin/auctions
// @access  Private (Admin only)
exports.getAuctions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;

  const auctions = await Auction.find(query)
    .populate('seller', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Auction.countDocuments(query);

  sendResponse(res, 200, 'Auctions fetched', auctions, {
    page, limit, total, pages: Math.ceil(total / limit),
  });
});

// @desc    Cancel an auction (admin only)
// @route   PATCH /api/admin/auctions/:id/cancel
// @access  Private (Admin only)
exports.cancelAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }
  if (['sold', 'cancelled'].includes(auction.status)) {
    res.status(400);
    throw new Error(`Auction is already ${auction.status}`);
  }

  auction.status = 'cancelled';
  await auction.save();

  // Phase 10: notify all bidders
  // const bidders = await Bid.distinct('bidder', { auction: auction._id });
  // bidders.forEach(bidderId => notificationService.notifyAuctionCancelled(bidderId, ...));

  sendResponse(res, 200, 'Auction cancelled', auction);
});

// @desc    Get all transactions (admin view)
// @route   GET /api/admin/transactions
// @access  Private (Admin only)
exports.getTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find()
    .populate('auction', 'title')
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments();

  sendResponse(res, 200, 'Transactions fetched', transactions, {
    page, limit, total, pages: Math.ceil(total / limit),
  });
});
