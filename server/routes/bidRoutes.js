const express = require('express');
const { placeBid, getAuctionBids } = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('buyer'), placeBid);
router.get('/auction/:id', getAuctionBids);

module.exports = router;
