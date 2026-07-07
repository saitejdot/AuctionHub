const express = require('express');
const {
  getStats, getUsers, blockUser, unblockUser,
  getAuctions, cancelAuction, getTransactions,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.get('/auctions', getAuctions);
router.patch('/auctions/:id/cancel', cancelAuction);
router.get('/transactions', getTransactions);

module.exports = router;
