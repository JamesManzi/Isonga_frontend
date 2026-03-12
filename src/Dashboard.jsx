import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd, faBars, faBoxOpen, faCommentDots, faDigitalTachograph,
  faDollarSign, faEye, faHand, faHome, faStar, faStore, faBox,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

function Dashboard() {
  const [seller, setSeller] = useState(null);
  const [totalViews, setTotalViews] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/logout",
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        if (socketRef.current) socketRef.current.disconnect();
        navigate("/login");
      }
    } catch (error) {
      console.log("Logout error", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const res = await axios.get("https://isonga-backend.onrender.com/api/dashboard", {
          withCredentials: true,
        });

        if (!res.data.success) {
          navigate("/login");
          return;
        }

        const s = res.data.seller;
        setSeller({
          ...s,
          averageRating: s.averageRating || 0,
          numReviews: s.numReviews || 0,
          totalOrders: s.totalOrders || 0,
          totalSales: s.totalSales || 0,
        });

        setTotalViews(res.data.totalViews || 0);
        // This relies on the backend fix: adding 'newOrders' to the dashboard response
        setNewOrdersCount(s.newOrders || 0);

        const unreadRes = await axios.get("https://isonga-backend.onrender.com/api/seller/conversations", {
          withCredentials: true
        });
        if (unreadRes.data.success) {
          const count = unreadRes.data.conversations.reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      }
    };

    fetchSellerData();
  }, [navigate]);

  // Real-time socket logic
  useEffect(() => {
    if (!seller?._id) return;

    if (!socketRef.current) {
      socketRef.current = io("https://isonga-backend.onrender.com", {
        withCredentials: true,
        transports: ["websocket"],
      });
    }

    const socket = socketRef.current;
    socket.emit("userOnline", { userId: seller._id, userModel: "Seller" });

    // New order listener
    socket.on("newOrderNotification", (data) => {
      toast.success(data.message || "New Order Received!", { icon: '🛍️' });
      setSeller(prev => ({
        ...prev,
        totalOrders: (prev.totalOrders || 0) + 1
      }));
      setNewOrdersCount(prev => prev + 1);
    });

    // New message listener
    socket.on("newMessageNotification", () => {
      setUnreadCount(prev => prev + 1);
      toast('New message from buyer!', { icon: '💬' });
    });

    // Product view listener
    socket.on("newView", (data) => {
      setTotalViews(data.totalViews);
      toast.success("Someone is viewing your products!", {
        icon: '👁️',
        position: 'top-right',
      });
    });
// Rating update listener
socket.on("sellerRatingUpdated", (data) => {

  toast.success("You received a new rating ⭐");

  setSeller(prev => ({
    ...prev,
    averageRating: data.averageRating,
    numReviews: data.numReviews
  }));

});
    return () => {
      socket.off("newOrderNotification");
      socket.off("newMessageNotification");
      socket.off("newView");
      socket.off("sellerRatingUpdated");
    };
  }, [seller?._id]);

  if (!seller) return <div className="Dashboard"><h2>Loading...</h2></div>;

  const renderStars = (avg = 0) => {
    const stars = [];
    const rating = Number(avg);
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      } else if (rating >= i - 0.5) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ clipPath: "inset(0 50% 0 0)" }} />);
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
      }
    }
    return stars;
  };

  return (
    <div className="Dashboard">
      <Toaster position="top-center" />

      {/* Navbar */}
      <div className="Dashboard_navbar">
        <div className="Dashboard_bars" onClick={toggleMenu}>
          <FontAwesomeIcon icon={faBars} />
          {isMenuOpen && (
            <div className="dropdown_list" ref={dropdownRef}>
              <Link to="/settings">Settings</Link>
              <Link to="/inventory">Inventory</Link>
              <hr />
            </div>
          )}
        </div>
        <div className="Dashboard_text"><h2>My Store</h2></div>
        <div className="Dashboard_rightside">
          <Link to="/seller_profile">
            <div className="dashboard_profile">
              {seller.profile ? (
                <img src={`https://isonga-backend.onrender.com/uploads/${seller.profile}`} alt="Seller" className="dashboard_seller-image" />
              ) : <div className="placeholder_profile">No Image</div>}
            </div>
          </Link>
          <button onClick={handleLogout} className="Dashboard_Logout">Logout</button>
        </div>
      </div>

      <div className="Dashboard_heading">
        <h1>Welcome Back {seller.name} <FontAwesomeIcon icon={faHand} /></h1>
        <p>Grow Your Business Today</p>
      </div>

      <div className="Dashboard_body1">
        <div className="sales">
          <FontAwesomeIcon icon={faBoxOpen} /><p>Total Sales</p>
          <h2>RWF {seller.totalSales.toLocaleString()}</h2>
        </div>
        <div className="orders">
          <FontAwesomeIcon icon={faBox} />
          <h2>Total Orders</h2>
          <p className="order_count_main">{seller.totalOrders}</p>
        </div>
      </div>

      <div className="Dashboard_body2">
        <div className="views">
          <FontAwesomeIcon icon={faEye} /><h2>Product Views</h2>
          <p>{totalViews}</p>
        </div>
        <div className="ratings">
          <FontAwesomeIcon icon={faStar} /><h2>Your Ratings</h2>
          <p>{Number(seller.averageRating).toFixed(1)} ({seller.numReviews} reviews)</p>
          <div className="stars">{renderStars(seller.averageRating)}</div>
        </div>
      </div>

      <div className="Dashboard_body3">
        <div className="add_product">
          <Link to="/add_product"><FontAwesomeIcon icon={faAdd} /><h2>Add New Product</h2></Link>
        </div>
        <div className="viewOrders">
          <Link to="#"><FontAwesomeIcon icon={faDigitalTachograph} /><h2>Performance</h2></Link>
        </div>
        <div className="buyer_messages">
          <Link to="#"><FontAwesomeIcon icon={faDollarSign} /><h2>Today's Profit</h2></Link>
        </div>
      </div>

      {/* Footer with badges */}
      <div className="Dashboard_footer">
        <Link to="/dashboard" className="footer_item">
          <FontAwesomeIcon icon={faHome} /><h2>Dashboard</h2>
        </Link>

        <Link to="/seller_orders" className="footer_item">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <FontAwesomeIcon icon={faBox} />
            {newOrdersCount > 0 && (
              <span className="order_badge">
                {newOrdersCount}
              </span>
            )}
          </div>
          <h2>Orders</h2>
        </Link>

        <Link to="/SellerConversations" className="footer_item">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <FontAwesomeIcon icon={faCommentDots} />
            {unreadCount > 0 && (
              <span className="badge">
                {unreadCount}
              </span>
            )}
          </div>
          <h2>Messages</h2>
        </Link>

        <Link to="/my_store" className="footer_item">
          <FontAwesomeIcon icon={faStore} /><h2>My Store</h2>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;