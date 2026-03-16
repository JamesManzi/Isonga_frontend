import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState("");

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
      const res = await axios.get("https://isonga-backend.onrender.com/api/cart", { withCredentials: true });
      if (res.data.success) setCart(res.data.cart);
    } catch (error) {
      console.log(error);
      setError("Failed to load cart");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle screenshot preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const placeOrder = async () => {
    setError("");

    // basic validation
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill all required fields");
      return;
    }

    // If payment requires screenshot
    if ((form.paymentMethod === "mobile" || form.paymentMethod === "card") && !screenshot) {
      setError("Please upload your payment screenshot");
      return;
    }

    try {
      setPlacingOrder(true);

      // Use FormData to send file + JSON data
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      formData.append("items", JSON.stringify(cart.items));
      formData.append("totalAmount", cart.totalPrice);

      if (screenshot) formData.append("paymentScreenshot", screenshot);

      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/order",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (res.data.success) {
        alert("Order placed successfully! Waiting for verification.");
        navigate("/buyer_dashboard");
      } else {
        setError(res.data.message || "Order failed");
      }
    } catch (error) {
      console.log(error);
      setError("Server error while placing order");
    }

    setPlacingOrder(false);
  };

  if (loading) return <p className="checkout-loading">Loading checkout...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate("/buyer_dashboard")}>Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {error && <p className="checkout-error">{error}</p>}

      {/* Order Summary */}
      <div className="checkout-summary">
        <h2>Order Summary</h2>
        {cart.items.map(item => (
          <div className="checkout-item" key={item.product._id}>
            <div>
              <strong>{item.product.name}</strong>
              <p>Quantity: {item.quantity}</p>
            </div>
            <div>{item.quantity * item.price} Rwf</div>
          </div>
        ))}
        <hr />
        <h3>Total: {cart.totalPrice} Rwf</h3>
      </div>

      {/* Delivery & Payment */}
      <div className="checkout-form">
        <h2>Delivery Details</h2>
        <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <input type="text" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
        <input type="text" name="address" placeholder="Delivery Address" value={form.address} onChange={handleChange} />

        <h3>Delivery Method</h3>
        <select name="deliveryMethod" value={form.deliveryMethod} onChange={handleChange}>
          <option value="standard">Standard Delivery</option>
          <option value="express">Express Delivery</option>
          <option value="pickup">Store Pickup</option>
        </select>

        <h3>Payment Method</h3>
        <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
          <option value="cash">Cash on Delivery</option>
          <option value="mobile">Mobile Money</option>
          <option value="card">Card Payment</option>
        </select>

        {/* Upload screenshot only for mobile/card */}
        {(form.paymentMethod === "mobile" || form.paymentMethod === "card") && (
          <>
            <label>Upload Payment Screenshot</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && <img src={preview} alt="Preview" style={{ width: "200px", marginTop: "10px" }} />}
          </>
        )}

        <h3>Delivery Date</h3>
        <input type="date" name="deliveryDate" value={form.deliveryDate} onChange={handleChange} />

        <h3>Order Notes</h3>
        <textarea name="notes" placeholder="Extra instructions" value={form.notes} onChange={handleChange} />

        <div className="checkout-buttons">
          <button className="place-order" onClick={placeOrder} disabled={placingOrder}>
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>
          <button className="return-btn" onClick={() => navigate(-1)}>Return</button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;