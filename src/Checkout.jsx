
import { useEffect, useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [seller,setSeller]=useState("");

  // New states for File Upload and Preview
  const [paymentImage, setPaymentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
        setSeller(res.data.seller);
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

  // Handle image selection and create a preview URL
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const placeOrder = async () => {
    setError("");

    // Validation
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill all required fields");
      return;
    }

    // Validation for payment proof
    if (form.paymentMethod !== "cash" && !paymentImage) {
      setError("Please upload a screenshot of your payment confirmation");
      return;
    }

    try {
      setPlacingOrder(true);

      // Create FormData because we are sending a file
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("deliveryMethod", form.deliveryMethod);
      formData.append("paymentMethod", form.paymentMethod);
      formData.append("notes", form.notes);
      formData.append("deliveryDate", form.deliveryDate);
      
      if (paymentImage) {
        formData.append("paymentProof", paymentImage);
      }

      const res = await api.post("/api/order", formData, { 
      headers: { "Content-Type": "multipart/form-data" } 
    });

      if (res.data.success) {
        alert("Order placed successfully");
        navigate("/buyer_dashboard");
      } else {
        setError(res.data.message || "Order failed");
      }
    } catch (error) {
      console.log(error);
      setError("Server error while placing order");
    } finally{
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
          <option value="card">Card Payment</option>
        </select>

        {/* CONDITIONAL UPLOAD FIELD */}
        {form.paymentMethod !== "cash" && (
          <div className="payment-upload">
            <p>Dial *182*1*1*{seller.phone}#</p>
            <h3>Upload Payment Screenshot</h3>
            <p className="upload-hint">Please upload a screenshot of your transaction confirmation.</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            {imagePreview && (
              <div className="preview-container">
                <p>Preview:</p>
                <img src={imagePreview} alt="Payment Proof" className="payment-preview-img" />
              </div>
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
            disabled={placingOrder}
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