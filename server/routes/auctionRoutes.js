const express = require('express');
const {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
} = require('../controllers/auctionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router
  .route('/')
  .get(getAuctions)
  .post(protect, authorize('seller'), upload.array('images', 5), createAuction);

router
  .route('/:id')
  .get(getAuctionById)
  .put(protect, authorize('seller'), updateAuction)
  .delete(protect, authorize('seller'), deleteAuction);

module.exports = router;
