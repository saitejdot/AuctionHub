const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Auction = require('../models/Auction');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const sendResponse = require('../utils/sendResponse');
const { notifyPaymentSuccess } = require('../services/notificationService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payments/order
// @access  Private (auction winner only)
exports.createOrder = asyncHandler(async (req, res) => {
  const { auctionId } = req.body;

  const auction = await Auction.findById(auctionId).populate('seller', 'name');
  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  if (auction.status !== 'payment_pending') {
    res.status(400);
    throw new Error('This auction is not awaiting payment');
  }

  if (auction.highestBidder.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the auction winner can make payment');
  }

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: Math.round(auction.currentHighestBid * 100), // Amount in paise
    currency: 'INR',
    receipt: `auction_${auctionId}`,
  });

  // Create pending payment record
  await Payment.create({
    auction: auctionId,
    buyer: req.user._id,
    seller: auction.seller._id,
    amount: auction.currentHighestBid,
    razorpayOrderId: order.id,
    status: 'pending',
  });

  sendResponse(res, 200, 'Order created', {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    auctionTitle: auction.title,
    sellerName: auction.seller.name,
  });
});

// @desc    Verify Razorpay payment signature and finalize
// @route   POST /api/payments/verify
// @access  Private (auction winner only)
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, auctionId } = req.body;

  // 1. Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  // 2. Find and update payment record
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = 'completed';
  await payment.save();

  // 3. Update auction status to sold
  const auction = await Auction.findByIdAndUpdate(
    auctionId,
    { status: 'sold' },
    { new: true }
  ).populate('seller', 'name');

  // 4. Create Transaction record
  const transaction = await Transaction.create({
    auction: auctionId,
    buyer: req.user._id,
    seller: auction.seller._id,
    amount: payment.amount,
    payment: payment._id,
  });

  // 5. Send notifications
  await notifyPaymentSuccess(req.user._id, auctionId, auction.title, payment.amount);
  await notifyPaymentSuccess(auction.seller._id, auctionId, auction.title, payment.amount);

  sendResponse(res, 200, 'Payment verified and transaction complete', transaction);
});

// @desc    Get payment status for an auction
// @route   GET /api/payments/:auctionId
// @access  Private
exports.getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ auction: req.params.auctionId })
    .populate('buyer', 'name email')
    .populate('seller', 'name email');

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  sendResponse(res, 200, 'Payment fetched', payment);
});
