const { Queue } = require('bullmq');
const connection = require('../config/redis');

const auctionQueue = new Queue('auctionQueue', { connection });

/**
 * Schedule the 'close-auction' and 'ending-soon' jobs for an auction
 */
const scheduleAuctionJobs = async (auctionId, endTime) => {
  const endTimeMs = new Date(endTime).getTime();
  const now = Date.now();
  
  // 1. Schedule close-auction job (runs at exactly endTime)
  const closeDelay = endTimeMs - now;
  if (closeDelay > 0) {
    await auctionQueue.add('close-auction', { auctionId }, {
      jobId: `close-${auctionId}`,
      delay: closeDelay,
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log(`Scheduled close-auction for ${auctionId} in ${closeDelay}ms`);
  } else {
    // If it's already past end time, trigger immediately
    await auctionQueue.add('close-auction', { auctionId }, {
      jobId: `close-${auctionId}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  // 2. Schedule ending-soon job (runs 1 hour before endTime)
  const ONE_HOUR = 60 * 60 * 1000;
  const endingSoonDelay = closeDelay - ONE_HOUR;
  if (endingSoonDelay > 0) {
    await auctionQueue.add('ending-soon', { auctionId }, {
      jobId: `ending-${auctionId}`,
      delay: endingSoonDelay,
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log(`Scheduled ending-soon for ${auctionId} in ${endingSoonDelay}ms`);
  }
};

/**
 * Schedule payment timeout job (runs 24 hours after close)
 */
const schedulePaymentTimeout = async (auctionId) => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  await auctionQueue.add('payment-timeout', { auctionId }, {
    jobId: `payment-${auctionId}`,
    delay: TWENTY_FOUR_HOURS,
    removeOnComplete: true,
    removeOnFail: false,
  });
  console.log(`Scheduled payment-timeout for ${auctionId} in 24 hours`);
};

module.exports = {
  auctionQueue,
  scheduleAuctionJobs,
  schedulePaymentTimeout,
};
