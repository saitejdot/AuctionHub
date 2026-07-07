const express = require('express');
const { createOrder, verifyPayment, getPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.get('/:auctionId', getPayment);

module.exports = router;
