import { useEffect, useState } from "react";
import axios from "axios";
import "./Cart.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get(
        "https://isonga-backend.onrender.com/api/cart",
        { withCredentials: true }
      );

      if (res.data.success) {
        setCart(res.data.cart);
        // Using optional chaining to prevent error if buyer data is missing
        setProfile(res.data.buyer?.profile || "");
      }
    } catch (error) {
      console.log("Fetch Cart Error:", error);
    }
    setLoading(false);
  };

  const removeItem = async (productId) => {
    try {
      await axios.delete(
        `https://isonga-backend.onrender.com/api/cart/remove/${productId}`,
        { withCredentials: true }
      );
      fetchCart();
    } catch (error) {
      console.log("Remove Item Error:", error);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      await axios.put(
        "https://isonga-backend.onrender.com/api/cart/update",
        { productId, quantity },
        { withCredentials: true }
      );
      fetchCart();
    } catch (error) {
      console.log("Update Quantity Error:", error);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        "https://isonga-backend.onrender.com/api/logout",
        {},
        { withCredentials: true }
      );
      navigate("/buyer_login");
    } catch (error) {
      console.log("Logout Error:", error);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png"; 
    return path.startsWith("http")
      ? path
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  if (loading) return <div className="cart-loading"><p>Loading cart...</p></div>;

  // Render empty state if no cart exists or items array is empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="Cart_empty">
        <div className="Cart_nav-left">
          <button onClick={() => navigate(-1)} className="Cart_back-btn">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        </div>
        <h2>Your cart is empty</h2>
        <p>Start adding products to your cart.</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* NAVBAR */}
      <div className="cart-navbar">
        <div className="nav-left">
          <button onClick={() => navigate(-1)} className="back-btn">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        </div>

        <div className="nav-center">
          <h2>Shopping Cart</h2>
        </div>

        <div className="nav-right">
          <div className="Cart_profile">
            <img src={getFileUrl(profile)} alt="Profile" />
          </div>
          <button className="logout-btn" onClick={logout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
        </div>
      </div>

      <h1 className="cart-title">Your Cart</h1>

      <div className="cart-container">
        {/* PRODUCTS SECTION */}
        <div className="cart-products">
          {cart.items.map((item) => {
            // SAFETY CHECK: If the product was deleted from the database
            // Find the error-item block inside your .map()
if (!item.product) {
  return (
    <div className="cart-item error-item" key={item._id}>
      <div className="cart-info">
        <h3 style={{ color: "#ef4444" }}>Item Unavailable</h3>
        <p>This product was removed by the seller.</p>
        <button
          className="remove"
          /* CHANGE: Pass item._id instead of item.product._id */
          onClick={() => removeItem(item._id)} 
        >
          Remove from Cart
        </button>
      </div>
    </div>
  );
}

            // NORMAL RENDERING
            return (
              <div className="cart-item" key={item.product._id}>
                <img
                  src={getFileUrl(item.product.files?.[0])}
                  className="cart-image"
                  alt={item.product.name}
                />

                <div className="cart-info">
                  <h3>{item.product.name}</h3>
                  <p>{item.product.location}</p>
                  <p className="price">{item.price} Rwf</p>

                  <div className="quantity">
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove"
                    onClick={() => removeItem(item.product._id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="subtotal">
                  {item.quantity * item.price} Rwf
                </div>
              </div>
            );
          })}
        </div>

        {/* SUMMARY SECTION */}
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{cart.totalPrice} Rwf</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>0 Rwf</span>
          </div>
          <hr />
          <div className="summary-total">
            <span>Total</span>
            <span>{cart.totalPrice} Rwf</span>
          </div>
          <button
            className="checkout"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;