import { useEffect, useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  // Keep these states but repurpose them for the MoMo flow
  const [isPaid, setIsPaid] = useState(false);
  const [momoTransactionId, setMomoTransactionId] = useState(null);

  const navigate = useNavigate();

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
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get("/api/cart");
      if (res.data.success) {
        setCart(res.data.cart);
      }
    } catch (error) {
      console.log(error);
      setError("Failed to load cart");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // --- NEW: Function to trigger the MoMo Widget ---
  const handleMomoPayment = () => {
    if (!form.phone) {
      setError("Please enter your phone number to start payment");
      return;
    }

    if (window.MomoWidget) {
      window.MomoWidget.setup({
        key: "YOUR_PRIMARY_KEY", // From your dashboard
        amount: cart.totalPrice,
        currency: "RWF",
        externalId: Date.now().toString(),
        phoneNumber: form.phone,
        onSuccess: (data) => {
          setIsPaid(true);
          setMomoTransactionId(data.transactionId || data.reference);
          setError(""); // Clear any previous payment errors
        },
        onFailure: () => {
          setError("MoMo Payment failed. Please try again.");
        }
      });
    }
  };

  const placeOrder = async () => {
    setError("");

    // Validation
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill all required fields");
      return;
    }

    // Validation for real payment instead of screenshot
    if (form.paymentMethod === "mobile" && !isPaid) {
      setError("Please complete the MoMo payment first");
      return;
    }

    try {
      setPlacingOrder(true);

      // Keep original logic but send JSON instead of FormData
      const orderData = {
        ...form,
        momoTransactionId: momoTransactionId,
        isPaid: isPaid
      };

      // Changed from FormData to JSON request
      const res = await api.post("/api/order", orderData);

      if (res.data.success) {
        alert("Order placed successfully");
        navigate("/buyer_dashboard");
      } else {
        setError(res.data.message || "Order failed");
      }
    } catch (error) {
      console.log(error);
      setError("Server error while placing order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-loading-modern">
        <div className="checkout-loader-card">
          <div className="checkout-pulse"></div>
          <h2>ISONGA MARKET</h2>
          <p>Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate("/buyer_dashboard")}>
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {error && <p className="checkout-error">{error}</p>}

      <div className="checkout-summary">
        <h2>Order Summary</h2>
        {cart.items.map(item => (
          <div className="checkout-item" key={item.product._id}>
            <div>
              <strong>{item.product.name}</strong>
              <p>Quantity: {item.quantity}</p>
            </div>
            <div>
              {item.quantity * item.price} Rwf
            </div>
          </div>
        ))}
        <hr />
        <h3>Total: {cart.totalPrice} Rwf</h3>
      </div>

      <div className="checkout-form">
        <h2>Delivery Details</h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          type="text"
          name="address"
          placeholder="Delivery Address"
          value={form.address}
          onChange={handleChange}
        />

        <h3>Delivery Method</h3>
        <select
          name="deliveryMethod"
          value={form.deliveryMethod}
          onChange={handleChange}
        >
          <option value="standard">Standard Delivery</option>
          <option value="express">Express Delivery</option>
          <option value="pickup">Store Pickup</option>
        </select>

        <h3>Payment Method</h3>
        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
        >
          <option value="cash">Cash on Delivery</option>
          <option value="mobile">Mobile Money</option>
        </select>

        {/* REPLACED UPLOAD WITH MOMO BUTTON */}
        {form.paymentMethod === "mobile" && (
          <div className="payment-upload">
            <h3>MoMo Payment</h3>
            {!isPaid ? (
              <>
                <p className="upload-hint">Click below to pay securely with MTN MoMo.</p>
                <button 
                  type="button" 
                  onClick={handleMomoPayment}
                  style={{ background: '#ffcc00', color: '#000', padding: '10px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  Pay {cart.totalPrice} Rwf Now
                </button>
              </>
            ) : (
              <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Payment Verified! ID: {momoTransactionId}</p>
            )}
          </div>
        )}

        <h3>Delivery Date</h3>
        <input
          type="date"
          name="deliveryDate"
          value={form.deliveryDate}
          onChange={handleChange}
        />

        <h3>Order Notes</h3>
        <textarea
          name="notes"
          placeholder="Extra instructions"
          value={form.notes}
          onChange={handleChange}
        />

        <div className="checkout-buttons">
          <button
            className="place-order"
            onClick={placeOrder}
            disabled={placingOrder || (form.paymentMethod === "mobile" && !isPaid)}
          >
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>

          <button
            className="return-btn"
            onClick={() => navigate(-1)}
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;