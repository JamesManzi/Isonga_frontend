import { useEffect, useState, useRef } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  
  // Real Payment States
  const [isPaid, setIsPaid] = useState(false);
  const [momoTransactionId, setMomoTransactionId] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const navigate = useNavigate();
  const pollingInterval = useRef(null); // To clear the timer

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    deliveryMethod: "standard",
    paymentMethod: "cash",
    notes: "",
    deliveryDate: ""
  });

  useEffect(() => {
    fetchCart();
    // Cleanup polling if the user leaves the page
    return () => clearInterval(pollingInterval.current);
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get("/api/cart");
      if (res.data.success) {
        setCart(res.data.cart);
      }
    } catch (err) {
      setError("Failed to load cart");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- NEW: Polling Logic ---
  const checkPaymentStatus = async (referenceId) => {
    try {
      const res = await api.get(`/api/momo/status/${referenceId}`);
      
      if (res.data.status === "SUCCESSFUL") {
        setIsPaid(true);
        setMomoTransactionId(referenceId);
        setIsProcessingPayment(false);
        clearInterval(pollingInterval.current);
        alert("Payment Successful!");
      } else if (res.data.status === "FAILED") {
        setError("Payment was declined or failed.");
        setIsProcessingPayment(false);
        clearInterval(pollingInterval.current);
      }
      // If PENDING, do nothing and let the next interval run
    } catch (err) {
      console.error("Error checking status", err);
    }
  };

  const handleMomoPayment = async () => {
    if (!form.phone) {
      setError("Please enter your phone number to start payment");
      return;
    }

    try {
      setError("");
      setIsProcessingPayment(true);

      const res = await api.post("/api/momo/pay", {
        amount: cart.totalPrice,
        phone: form.phone
      });

      if (res.data.success) {
        const referenceId = res.data.referenceId; // Backend should return a unique ID
        alert("Payment request sent! Please check your phone.");

        // Start checking every 3 seconds if the user paid
        pollingInterval.current = setInterval(() => {
          checkPaymentStatus(referenceId);
        }, 3000);

      } else {
        setError("Payment failed to start");
        setIsProcessingPayment(false);
      }
    } catch (err) {
      setError("Server error while starting payment");
      setIsProcessingPayment(false);
    }
  };

  const placeOrder = async () => {
    setError("");
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill all required fields");
      return;
    }

    if (form.paymentMethod === "mobile" && !isPaid) {
      setError("Please complete the MoMo payment first");
      return;
    }

    try {
      setPlacingOrder(true);
      const orderData = {
        ...form,
        momoTransactionId: momoTransactionId,
        isPaid: isPaid
      };

      const res = await api.post("/api/order", orderData);

      if (res.data.success) {
        alert("Order placed successfully");
        navigate("/buyer_dashboard");
      } else {
        setError(res.data.message || "Order failed");
      }
    } catch (error) {
      setError("Server error while placing order");
    } finally {
      setPlacingOrder(false);
    }
  };

  // ... (Keep your loading and empty cart JSX the same) ...

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      {error && <p className="checkout-error" style={{ color: 'red' }}>{error}</p>}

      {/* Summary section remains same */}

      <div className="checkout-form">
        {/* Form inputs remain same */}

        <h3>Payment Method</h3>
        <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
          <option value="cash">Cash on Delivery</option>
          <option value="mobile">Mobile Money</option>
        </select>

        {form.paymentMethod === "mobile" && (
          <div className="payment-section" style={{ padding: '15px', background: '#f9f9f9', borderRadius: '10px', marginTop: '10px' }}>
            <h3>MoMo Payment</h3>
            {!isPaid ? (
              <>
                <p>{isProcessingPayment ? "Waiting for approval..." : "Enter phone and click pay:"}</p>
                <button 
                  type="button" 
                  onClick={handleMomoPayment}
                  disabled={isProcessingPayment}
                  style={{ 
                    background: isProcessingPayment ? '#ccc' : '#ffcc00', 
                    color: '#000', padding: '12px', width: '100%', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' 
                  }}
                >
                  {isProcessingPayment ? "⏳ Processing..." : `Pay ${cart.totalPrice} Rwf Now`}
                </button>
              </>
            ) : (
              <div style={{ color: 'green', textAlign: 'center' }}>
                <p>✅ Payment Verified!</p>
                <small>Ref: {momoTransactionId}</small>
              </div>
            )}
          </div>
        )}

        {/* Remaining fields and buttons remain same */}
        <div className="checkout-buttons">
          <button
            className="place-order"
            onClick={placeOrder}
            disabled={placingOrder || (form.paymentMethod === "mobile" && !isPaid)}
          >
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;