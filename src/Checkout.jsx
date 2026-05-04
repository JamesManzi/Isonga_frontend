import { useEffect, useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [sellers, setSellers] = useState([]);

  // payments per seller
  const [sellerPayments, setSellerPayments] = useState({});

  // ✅ NEW: totals per seller
  const [sellerTotals, setSellerTotals] = useState({});

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

  // ✅ Calculate totals per seller
  const calculateSellerTotals = (items = []) => {
  const totals = {};

  items.forEach((item) => {
    const sellerId =
      item.product?.seller?._id?.toString() ||
      item.product?.seller?.toString();

    if (!sellerId) return;

    const amount = item.price * item.quantity;

    totals[sellerId] = (totals[sellerId] || 0) + amount;
  });

  return totals;
};

  const fetchCart = async () => {
  try {
    const res = await api.get("/api/cart");

    if (res.data.success) {
      const cartData = res.data.cart;

      setCart(cartData);
      setSellers(res.data.sellers);

      // ✅ use cartData, NOT cart
      const totals = calculateSellerTotals(cartData.items);
      setSellerTotals(totals);
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

  // handle file per seller
  const handleSellerFileChange = (sellerId, file) => {
    if (!file) return;

    setSellerPayments((prev) => ({
      ...prev,
      [sellerId]: {
        file,
        preview: URL.createObjectURL(file)
      }
    }));
  };

  const placeOrder = async () => {
    setError("");

    if (!form.name || !form.phone || !form.address) {
      setError("Please fill all required fields");
      return;
    }

    // validate proofs
    if (form.paymentMethod !== "cash") {
      for (let s of sellers) {
        if (!sellerPayments[s._id]?.file) {
          setError("Upload payment proof for each seller");
          return;
        }
      }
    }

    try {
      setPlacingOrder(true);

      const formData = new FormData();

      // basic info
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("deliveryMethod", form.deliveryMethod);
      formData.append("paymentMethod", form.paymentMethod);
      formData.append("notes", form.notes);
      formData.append("deliveryDate", form.deliveryDate);

      //  send seller totals also (important)
      formData.append("sellerTotals", JSON.stringify(sellerTotals));

      Object.keys(sellerPayments).forEach((sellerId) => {
  const file = sellerPayments[sellerId]?.file;
  if (file) {
    // 👇 include sellerId in the field name
    formData.append(`proof_${sellerId}`, file);
  }
});


      const res = await api.post("/api/order", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        alert("Order placed successfully");
        console.log("Saved Orders",res.data.orderId)
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

  // ================= UI =================

  if (loading) {
    return (
      <div className="cart-loading-modern">
        <div className="cart-loader-card">
          <div className="cart-spinner"></div>
          <h2>ISONGA MARKET</h2>
          <h2>Loading checkout...</h2>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div>
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

      {/* ORDER SUMMARY */}
      <div className="checkout-summary">
        <h2>Order Summary</h2>

        {cart.items.map((item) => (
          <div key={item.product._id} className="checkout-item">
            <div>
              <strong>{item.product.name}</strong>
              <p>Qty: {item.quantity}</p>
            </div>
            <div>{item.quantity * item.price} Rwf</div>
          </div>
        ))}

        <hr />
        <h3>Total: {cart.totalPrice} Rwf</h3>
      </div>

      {/* FORM */}
      <div className="checkout-form">
        <h2>Delivery Details</h2>

        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />

        <h3>Delivery Method</h3>
        <select name="deliveryMethod" value={form.deliveryMethod} onChange={handleChange}>
          <option value="standard">Standard</option>
          <option value="express">Express</option>
          <option value="pickup">Pickup</option>
        </select>

        <h3>Payment Method</h3>
        <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
          <option value="cash">Cash</option>
          <option value="mobile">Mobile Money</option>
        </select>

        {/*  MULTI SELLER PAYMENT */}
        {form.paymentMethod !== "cash" && (
          <div className="payment-upload">
            {sellers.map((s) => (
              <div key={s._id} className="seller-card">
                <h3>Seller:{s.name}</h3>

                {/*  SHOW AMOUNT */}
                <p><strong>Amount:</strong> {sellerTotals[s._id] || 0} Rwf</p>

                {/*  DIAL CODE WITH AMOUNT */}
                <p>
                  Dial: *182*1*1*{s.phone}*{sellerTotals[s._id] || 0}#
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleSellerFileChange(s._id, e.target.files[0])
                  }
                />

                {sellerPayments[s._id]?.preview && (
                  <img
                    src={sellerPayments[s._id].preview}
                    alt="proof"
                    className="payment-preview-img"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <h3>Delivery Date</h3>
        <input type="date" name="deliveryDate" value={form.deliveryDate} onChange={handleChange} />

        <h3>Notes</h3>
        <textarea name="notes" value={form.notes} onChange={handleChange} />

        <div className="checkout-buttons">
          <button onClick={placeOrder} disabled={placingOrder}>
            {placingOrder ? "Placing..." : "Place Order"}
          </button>

          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

    </div>
  );
}

export default Checkout;