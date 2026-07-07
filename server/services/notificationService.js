const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');
const User = require('../models/User');

let _io = null;

const setIo = (io) => { _io = io; };

/**
 * Core function: saves notification to DB, pushes via Socket.IO, sends email.
 *
 * @param {string} userId  - Recipient user _id
 * @param {string} type    - Notification type (e.g. 'auction_won', 'auction_lost')
 * @param {string} message - Human-readable message
 * @param {string} [auctionId] - Optional auction ref
 * @param {Object} [emailPayload] - Optional { subject, html } for email. If omitted, no email is sent.
 */
const createAndDeliverNotification = async (userId, type, message, auctionId = null, emailPayload = null) => {
  try {
    // 1. Save to DB
    const notification = await Notification.create({
      recipient: userId,
      type,
      message,
      auction: auctionId || undefined,
    });

    // 2. Deliver via Socket.IO
    if (_io) {
      _io.to(`user_${userId}`).emit('notification:new', notification);
    }

    // 3. Send email if payload provided
    if (emailPayload) {
      const user = await User.findById(userId).select('email');
      if (user) {
        await sendEmail({ to: user.email, ...emailPayload });
      }
    }

    return notification;
  } catch (err) {
    console.error(`[NotificationService] Failed for user ${userId}: ${err.message}`);
  }
};

// ── Email Templates ──────────────────────────────────────────────────────────

const notifyAuctionWon = async (userId, auctionId, auctionTitle, winningBid) => {
  await createAndDeliverNotification(
    userId,
    'auction_won',
    `You won the auction: "${auctionTitle}" with a bid of ₹${winningBid}. Please proceed to payment.`,
    auctionId,
    {
      subject: `You won: ${auctionTitle}`,
      html: `<h2>Congratulations!</h2><p>You won the auction <strong>${auctionTitle}</strong> with a bid of <strong>₹${winningBid}</strong>.</p><p>Please log in to complete your payment within 24 hours.</p>`,
    }
  );
};

const notifyAuctionLost = async (userId, auctionId, auctionTitle) => {
  await createAndDeliverNotification(
    userId,
    'auction_lost',
    `The auction "${auctionTitle}" has ended. Unfortunately, you were not the highest bidder.`,
    auctionId,
    {
      subject: `Auction ended: ${auctionTitle}`,
      html: `<h2>Auction Ended</h2><p>The auction <strong>${auctionTitle}</strong> has ended. Unfortunately, you were not the highest bidder this time. Keep bidding!</p>`,
    }
  );
};

const notifyAuctionEndingSoon = async (userId, auctionId, auctionTitle, endTime) => {
  await createAndDeliverNotification(
    userId,
    'auction_ending_soon',
    `Hurry! The auction "${auctionTitle}" is ending in 1 hour.`,
    auctionId,
    {
      subject: `Ending soon: ${auctionTitle}`,
      html: `<h2>Auction Ending Soon!</h2><p>The auction <strong>${auctionTitle}</strong> ends at <strong>${new Date(endTime).toLocaleString()}</strong>. Place your bid now!</p>`,
    }
  );
};

const notifyPaymentSuccess = async (userId, auctionId, auctionTitle, amount) => {
  await createAndDeliverNotification(
    userId,
    'payment_success',
    `Payment of ₹${amount} for "${auctionTitle}" confirmed. Transaction complete.`,
    auctionId,
    {
      subject: `Payment confirmed: ${auctionTitle}`,
      html: `<h2>Payment Confirmed</h2><p>Your payment of <strong>₹${amount}</strong> for <strong>${auctionTitle}</strong> has been received. The transaction is complete.</p>`,
    }
  );
};

const notifyAuctionCancelled = async (userId, auctionId, auctionTitle) => {
  await createAndDeliverNotification(
    userId,
    'auction_cancelled',
    `The auction "${auctionTitle}" has been cancelled by an administrator.`,
    auctionId,
    {
      subject: `Auction cancelled: ${auctionTitle}`,
      html: `<h2>Auction Cancelled</h2><p>We regret to inform you that the auction <strong>${auctionTitle}</strong> has been cancelled by an administrator. Any bids placed have been voided.</p>`,
    }
  );
};

const notifyPaymentExpired = async (userId, auctionId, auctionTitle) => {
  await createAndDeliverNotification(
    userId,
    'payment_expired',
    `The winner of "${auctionTitle}" did not pay within 24 hours. The auction has expired.`,
    auctionId,
    {
      subject: `Payment expired: ${auctionTitle}`,
      html: `<h2>Payment Window Expired</h2><p>The winner of <strong>${auctionTitle}</strong> did not complete payment within 24 hours. The auction has been marked as payment expired.</p>`,
    }
  );
};

module.exports = {
  setIo,
  createAndDeliverNotification,
  notifyAuctionWon,
  notifyAuctionLost,
  notifyAuctionEndingSoon,
  notifyPaymentSuccess,
  notifyAuctionCancelled,
  notifyPaymentExpired,
};
