import React from "react";
import toast from "react-hot-toast";
import axios from "axios";

function MobilePaymentModal({ isOpen, onClose, orderId }) {
  if (!isOpen) return null;

  const handlePayment = async (network) => {
    try {
      const res = await axios.post(
        `https://api.isongamarket.com/api/order/${orderId}/pay`,
        { network },
        { withCredentials: false}
      );

      if (res.data.success) {
        toast.success(`Payment initiated via ${network}! Complete on your phone.`);
        onClose();
      } else {
        toast.error(res.data.message || "Payment failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Payment error. Try again.");
    }
  };

  return (
    <div className="modal_overlay">
      <div className="modal_content">
        <h2>Pay with Mobile Money</h2>
        <p>Select your provider to complete payment:</p>
        <div className="payment_buttons">
          <button className="mtn_btn" onClick={() => handlePayment("MTN")}>MTN</button>
          <button className="airtel_btn" onClick={() => handlePayment("AIRTEL")}>AIRTEL</button>
        </div>
        <button className="close_btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default MobilePaymentModal;