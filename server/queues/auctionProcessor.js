const { Worker } = require('bullmq');
const connection = require('../config/redis');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { schedulePaymentTimeout } = require('./auctionQueue');

const processCloseAuction = async (auctionId) => {
  console.log(`Processing close-auction for ${auctionId}`);
  
  const auction = await Auction.findById(auctionId).populate('seller', 'name');
  if (!auction) return;
  if (auction.status !== 'live') {
    console.log(`Auction ${auctionId} is already ${auction.status}, skipping close`);
    return;
  }

  if (auction.bidCount === 0 || !auction.highestBidder) {
    auction.status = 'ended';
    await auction.save();
    console.log(`Auction ${auctionId} ended without bids`);
    return;
  }

  auction.status = 'payment_pending';
  await auction.save();
  console.log(`Auction ${auctionId} moved to payment_pending with winner ${auction.highestBidder}`);

  await schedulePaymentTimeout(auctionId);

  const winnerIdStr = (auction.highestBidder._id || auction.highestBidder).toString();

  // Fetch winner's full details (name + email) to share with seller
  const winner = await User.findById(winnerIdStr).select('name email');

  // Notify winner
  await notificationService.notifyAuctionWon(
    winnerIdStr,
    auctionId,
    auction.title,
    auction.currentHighestBid
  );

  // Notify seller with winner details
  const sellerId = (auction.seller._id || auction.seller).toString();
  await notificationService.notifySellerOfWinner(
    sellerId,
    auctionId,
    auction.title,
    winner?.name || 'Unknown',
    winner?.email || 'N/A',
    auction.currentHighestBid
  );

  // Notify all non-winning bidders
  const allBidders = await Bid.distinct('bidder', { auction: auctionId });
  for (const bidderId of allBidders) {
    if (bidderId.toString() !== winnerIdStr) {
      await notificationService.notifyAuctionLost(bidderId, auctionId, auction.title);
    }
  }
};

const processEndingSoon = async (auctionId) => {
  console.log(`Processing ending-soon for ${auctionId}`);
  
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') return;

  // Get unique bidders
  const uniqueBidders = await Bid.distinct('bidder', { auction: auctionId });
  
  // Notify all unique bidders that auction is ending in 1 hour
  console.log(`Notifying ${uniqueBidders.length} bidders that auction ${auctionId} is ending soon`);
  for (const bidderId of uniqueBidders) {
    await notificationService.notifyAuctionEndingSoon(bidderId, auctionId, auction.title, auction.endTime);
  }
};


const processPaymentTimeout = async (auctionId) => {
  console.log(`Processing payment-timeout for ${auctionId}`);
  
  const auction = await Auction.findById(auctionId);
  if (!auction) return;
  
  if (auction.status === 'payment_pending') {
    auction.status = 'payment_expired';
    await auction.save();
    console.log(`Auction ${auctionId} payment expired. Winner did not pay in time.`);
    
    // Notify seller
    // notificationService.createAndDeliverNotification(auction.seller, 'payment_expired', ...);
  } else {
    console.log(`Auction ${auctionId} status is ${auction.status}, ignoring payment timeout`);
  }
};

const auctionWorker = new Worker(
  'auctionQueue',
  async (job) => {
    switch (job.name) {
      case 'close-auction':
        await processCloseAuction(job.data.auctionId);
        break;
      case 'ending-soon':
        await processEndingSoon(job.data.auctionId);
        break;
      case 'payment-timeout':
        await processPaymentTimeout(job.data.auctionId);
        break;
      default:
        console.warn(`Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

auctionWorker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

auctionWorker.on('failed', (job, err) => {
  console.error(`${job.id} has failed with ${err.message}`);
});

module.exports = auctionWorker;
