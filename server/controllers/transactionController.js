const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const sendResponse = require('../utils/sendResponse');

// @desc    Get buyer's transactions
// @route   GET /api/transactions/buyer
// @access  Private (Buyer)
exports.getBuyerTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find({ buyer: req.user._id })
    .populate('auction', 'title images')
    .populate('seller', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments({ buyer: req.user._id });

  sendResponse(res, 200, 'Buyer transactions fetched', transactions, {
    page, limit, total, pages: Math.ceil(total / limit),
  });
});

// @desc    Get seller's transactions
// @route   GET /api/transactions/seller
// @access  Private (Seller)
exports.getSellerTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find({ seller: req.user._id })
    .populate('auction', 'title images')
    .populate('buyer', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments({ seller: req.user._id });

  sendResponse(res, 200, 'Seller transactions fetched', transactions, {
    page, limit, total, pages: Math.ceil(total / limit),
  });
});
