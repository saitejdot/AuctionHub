const express = require('express');
const { getBuyerTransactions, getSellerTransactions } = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/buyer', protect, authorize('buyer'), getBuyerTransactions);
router.get('/seller', protect, authorize('seller'), getSellerTransactions);

module.exports = router;
