const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an auction title'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    images: {
      type: [String],
      validate: [
        (val) => val.length <= 5,
        'Cannot upload more than 5 images'
      ],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startingPrice: {
      type: Number,
      required: [true, 'Please provide a starting price'],
      min: 1,
    },
    currentHighestBid: {
      type: Number,
      default: function() {
        return this.startingPrice;
      }
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    minBidIncrement: {
      type: Number,
      required: [true, 'Please provide a minimum bid increment'],
      min: 1,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide an end time'],
    },
    status: {
      type: String,
      enum: ['draft', 'live', 'ended', 'payment_pending', 'sold', 'payment_expired', 'cancelled'],
      default: 'draft',
    },
    bidCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for searching and filtering
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ seller: 1 });
auctionSchema.index({ category: 1 });
auctionSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Auction', auctionSchema);
