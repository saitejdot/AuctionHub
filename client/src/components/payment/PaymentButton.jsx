import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CreditCard } from 'lucide-react';

const PaymentButton = ({ auctionId, amount, auctionTitle }) => {
  const { user } = useContext(AuthContext);

  const handlePayment = async () => {
    try {
      // 1. Create Razorpay order
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payments/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ auctionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const { orderId, amount: orderAmount, currency, keyId } = data.data;

      // 2. Open Razorpay checkout
      const options = {
        key: keyId,
        amount: orderAmount,
        currency,
        name: 'AuctionHub',
        description: `Payment for: ${auctionTitle}`,
        order_id: orderId,
        handler: async (response) => {
          // 3. Verify payment
          const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              auctionId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('Payment successful! Transaction recorded.');
            window.location.reload();
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#3b82f6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition shadow"
    >
      <CreditCard size={20} />
      Pay ₹{amount}
    </button>
  );
};

export default PaymentButton;
