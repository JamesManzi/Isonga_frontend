import { useEffect, useState } from "react";
import api from "./api"; //  Fixed: Using your api instance
import "./Cart.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      //  Fixed: api handles the token and base URL automatically
      const res = await api.get("/api/cart");
      if (res.data.success) {
        setCart(res.data.cart);
        if(res.data.buyer){
          setProfile(res.data.buyer.profile);
        }
      }
    } catch (error) {
      console.log("Fetch Cart Error:", error);
      if (error.response?.status === 401) navigate("/buyer_login");
    }
    setLoading(false);
  };

  const removeItem = async (productId) => {
    try {
      // Instant UI removal
      setCart((prev) => {
        const updatedItems = prev.items.filter(
          (item) => (item.product?._id || item._id) !== productId
        );

        const newTotal = updatedItems.reduce(
          (acc, item) => acc + (item.price || 0) * item.quantity,
          0
        );

        return { ...prev, items: updatedItems, totalPrice: newTotal };
      });

      //  Fixed: Using api.delete
      await api.delete(`/api/cart/remove/${productId}`);
    } catch (error) {
      console.log("Remove Item Error:", error);
      fetchCart(); // fallback
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    try {
      // Optimistic UI update (instant)
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.product?._id === productId
            ? { ...item, quantity }
            : item
        ),
        totalPrice: prev.items.reduce((acc, item) => {
          if (item.product?._id === productId) {
            return acc + item.price * quantity;
          }
          return acc + item.price * item.quantity;
        }, 0),
      }));

      //  Fixed: Using api.put
      await api.put("/api/cart/update", { productId, quantity });
    } catch (error) {
      console.log("Update Quantity Error:", error);
      fetchCart(); // fallback if error
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      //  Fixed: Using api.post
      await api.post("/api/logout");
      localStorage.removeItem("token"); 
      navigate("/buyer_login");
    } catch (error) {
      console.log("Logout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http")
      ? path
      : `https://api.isongamarket.com/uploads/${path}`;
  };

  if (loading) {
    return (
      <div className="cart-loading-modern">
        <div className="cart-loader-card">
          <div className="cart-spinner"></div>
          <h2>ISONGA MARKET</h2>
          <p>Preparing your cart...</p>
        </div>
      </div>
    );
  }

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
            <img src={getFileUrl(profile)} alt="Profile"  onClick={() => setSelectedImage(profile)} />
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
            if (!item.product) {
              return (
                <div className="cart-item error-item" key={item._id}>
                  <div className="cart-info">
                    <h3 style={{ color: "#ef4444" }}>Item Unavailable</h3>
                    <p>This product was removed by the seller.</p>
                    <button
                      className="remove"
                      onClick={() => removeItem(item._id)}
                    >
                      Remove
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
       {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <span className="close-btn">&times;</span>
          <img src={getFileUrl(selectedImage)} alt="Full view" />
        </div>
      )}
    </div>
  );
}

export default Cart;