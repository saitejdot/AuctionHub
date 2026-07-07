const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');
const sendResponse = require('../utils/sendResponse');
const { scheduleAuctionJobs } = require('../queues/auctionQueue');

// @desc    Create a new auction
// @route   POST /api/auctions
// @access  Private (Seller only)
exports.createAuction = asyncHandler(async (req, res) => {
  const { title, description, category, startingPrice, minBidIncrement, endTime } = req.body;
  const images = req.files ? req.files.map((file) => file.path) : [];

  const auction = await Auction.create({
    title,
    description,
    category,
    startingPrice,
    minBidIncrement,
    endTime,
    images,
    seller: req.user._id,
    status: 'live',
  });

  // Schedule BullMQ jobs for this auction
  try {
    await scheduleAuctionJobs(auction._id.toString(), auction.endTime);
  } catch (err) {
    // Queue unavailable — log but don't fail the request
    console.error('Queue scheduling failed:', err.message);
  }

  sendResponse(res, 201, 'Auction created successfully', auction);
});

// @desc    Get all auctions (with pagination, filtering, search)
// @route   GET /api/auctions
// @access  Public
exports.getAuctions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.seller) {
    query.seller = req.query.seller;
  }
  
  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  const auctions = await Auction.find(query)
    .populate('seller', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Auction.countDocuments(query);
  const pages = Math.ceil(total / limit);

  sendResponse(res, 200, 'Auctions fetched', auctions, {
    page,
    limit,
    total,
    pages,
  });
});

// @desc    Get single auction by ID
// @route   GET /api/auctions/:id
// @access  Public
exports.getAuctionById = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .populate('seller', 'name avatar')
    .populate('highestBidder', 'name');

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  sendResponse(res, 200, 'Auction fetched', auction);
});

// @desc    Update an auction
// @route   PUT /api/auctions/:id
// @access  Private (Seller only)
exports.updateAuction = asyncHandler(async (req, res) => {
  let auction = await Auction.findById(req.params.id);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  // Ensure user is auction owner
  if (auction.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to update this auction');
  }

  // Cannot edit if bids exist
  if (auction.bidCount > 0) {
    res.status(400);
    throw new Error('Cannot edit auction once bidding has started');
  }

  auction = await Auction.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, 'Auction updated successfully', auction);
});

// @desc    Delete an auction
// @route   DELETE /api/auctions/:id
// @access  Private (Seller only)
exports.deleteAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  // Ensure user is auction owner
  if (auction.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('User not authorized to delete this auction');
  }

  // Cannot delete if bids exist
  if (auction.bidCount > 0) {
    res.status(400);
    throw new Error('Cannot delete auction once bidding has started');
  }

  await auction.deleteOne();

  sendResponse(res, 200, 'Auction deleted successfully');
});
