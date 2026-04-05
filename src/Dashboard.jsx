import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faBars,
  faBoxOpen,
  faCommentDots,
  faEye,
  faHand,
  faHome,
  faStar,
  faStore,
  faBox,
  faCalendarCheck,
  faKey,
  faTools,
  faHistory
} from "@fortawesome/free-solid-svg-icons";

import api from "./api";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

function Dashboard() {
  const [seller, setSeller] = useState(null);
  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  /* ---------------- 1. DYNAMIC UI CONFIGURATION ---------------- */
  // This map handles all the logic for Assets, Products, and Services
  const UI_CONFIG = {
    Product: {
      addText: "Add New Product",
      addLink: "/add_product",
      orderTitle: "Orders",
      orderLink: "/seller_orders",
      historyTitle: "Order History",
      historyLink: "/SellerOrderHistory",
      totalLabel: "Total Products",
      mainIcon: faBox,
      actionIcon: faBoxOpen,
    },
    Service: {
      addText: "Add New Service",
      addLink: "/add_service",
      orderTitle: "Bookings",
      orderLink: "/seller_bookings",
      historyTitle: "Booking History",
      historyLink: "/SellerBookingHistory",
      totalLabel: "Total Services",
      mainIcon: faCalendarCheck,
      actionIcon: faTools,
    },
    Asset: {
      addText: "Add New Asset",
      addLink: "/add_asset",
      orderTitle: "Rentals",
      orderLink: "/seller_rentals",
      historyTitle: "Rental History",
      historyLink: "/SellerRentalHistory",
      totalLabel: "Total Assets",
      mainIcon: faKey,
      actionIcon: faStore,
    }
  };

  // Safe fallback to Product config
  const sType = seller?.sellerType || "Product";
  const config = UI_CONFIG[sType] || UI_CONFIG.Product;

  /* ---------------- 2. LOGIC HANDLERS ---------------- */
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      const res = await api.post("/api/logout");
      if (res.data.success) {
        if (socketRef.current) socketRef.current.disconnect();
        navigate("/login");
      }
    } catch (error) {
      console.log("Logout error", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- 3. FETCH DATA ---------------- */
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await api.get("/api/dashboard");

        if (res.data.success && res.data.seller) {
          const s = res.data.seller;
          setSeller({
            ...s,
            averageRating: s.averageRating ?? 0,
            numReviews: s.numReviews ?? 0,
            totalOrders: s.totalOrders ?? 0,
            totalSales: s.totalSales ?? 0,
          });

          setTotalViews(res.data.totalViews ?? 0);
          setNewOrdersCount(s.newOrders ?? 0);
          setTodayViews(res.data.todayViews ?? 0);

          const unreadRes = await api.get("/api/seller/conversations");
          if (unreadRes.data.success && unreadRes.data.conversations) {
            const count = unreadRes.data.conversations.reduce(
              (sum, conv) => sum + (conv.unreadCount || 0), 0
            );
            setUnreadCount(count);
          }
        }
      } catch (err) {
        toast.error("Server connection failed");
      }
    };
    fetchSellerData();
  }, [navigate]);

  /* ---------------- 4. REAL-TIME SOCKETS ---------------- */
  useEffect(() => {
    if (!seller?._id) return;
    const token = localStorage.getItem("token");

    if (!socketRef.current) {
      socketRef.current = io("https://isonga-backend.onrender.com", {
        transports: ["websocket"],
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    const socket = socketRef.current;
    socket.emit("userOnline", { userId: seller._id, userModel: "Seller" });

    const handleNewActivity = (msg, icon) => {
      toast.success(msg, { icon });
      setSeller(prev => ({ ...prev, totalOrders: (prev.totalOrders || 0) + 1 }));
      setNewOrdersCount(prev => prev + 1);
    };

    socket.on("newOrderNotification", (data) => handleNewActivity(data.message || "New Order!", "🛍️"));
    socket.on("newBookingNotification", (data) => handleNewActivity(data.message || "New Booking!", "📅"));
    socket.on("newRentalNotification", (data) => handleNewActivity(data.message || "New Rental!", "🔑"));
    
    socket.on("newMessageNotification", () => {
      setUnreadCount(prev => prev + 1);
      toast("New message from buyer!", { icon: "💬" });
    });

    socket.on("newView", (data) => {
      setTotalViews(data.totalViews);
      setTodayViews(data.todayViews);
    });

    return () => {
      socket.off("newOrderNotification");
      socket.off("newBookingNotification");
      socket.off("newRentalNotification");
      socket.off("newMessageNotification");
      socket.off("newView");
    };
  }, [seller?._id]);

  if (!seller) return <div className="beautiful-loading">Loading Dashboard...</div>;

  const renderStars = (avg = 0) => {
    const stars = [];
    const rating = Number(avg);
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (rating >= i - 0.5) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ clipPath: "inset(0 50% 0 0)" }} />);
      else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("http")) return path;
    return `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  return (
    <div className="Dashboard">
      <Toaster position="top-center" />

      {/* Navbar */}
      <div className="Dashboard_navbar">
        <div className="Dashboard_bars" onClick={toggleMenu} ref={dropdownRef}>
          <FontAwesomeIcon icon={faBars} />
          {isMenuOpen && (
            <div className="dropdown_list">
              <Link to="/settings">Settings</Link>
              <Link to="/inventory">Inventory</Link>
            </div>
          )}
        </div>
        <div className="Dashboard_text"><h2>My Store</h2></div>
        <div className="Dashboard_rightside">
          <Link to="/seller_profile">
            <div className="dashboard_profile">
              <img src={getFileUrl(seller.profile)} alt="Seller" className="dashboard_seller-image" />
            </div>
          </Link>
          <button onClick={handleLogout} className="Dashboard_Logout">Logout</button>
        </div>
      </div>

      <div className="Dashboard_heading">
        <h1>Welcome Back {seller.name} <FontAwesomeIcon icon={faHand} /></h1>
        <p>Managing your {sType.toLowerCase()} business</p>
      </div>

      <div className="Dashboard_body1">
        <div className="sales">
          <FontAwesomeIcon icon={faEye} />
          <p>Today Views</p>
          <p className="order_count_main">{todayViews}</p>
        </div>
        <div className="orders">
          <FontAwesomeIcon icon={config.mainIcon} />
          <h2>{config.orderTitle}</h2>
          <div className="order_count_main">
            <p>Total: {seller.totalOrders}</p>
            <p>New: {newOrdersCount}</p>
          </div>
        </div>
      </div>

      <div className="Dashboard_body2">
        <div className="views">
          <FontAwesomeIcon icon={faEye} />
          <h2>Total Views</h2>
          <p>{totalViews}</p>
        </div>
        <div className="ratings">
          <FontAwesomeIcon icon={faStar} />
          <h2>Your Ratings</h2>
          <p>{Number(seller.averageRating).toFixed(1)} ({seller.numReviews} reviews)</p>
          <div className="stars">{renderStars(seller.averageRating)}</div>
        </div>
      </div>

      <div className="Dashboard_body3">
        <Link to={config.addLink} className="add_product">
          <FontAwesomeIcon icon={faAdd} />
          <h2>{config.addText}</h2>
        </Link>
        <Link to={config.historyLink} className="viewOrders">
          <FontAwesomeIcon icon={faHistory} />
          <h2>{config.historyTitle}</h2>
        </Link>
        <div className="buyer_messages">
          <FontAwesomeIcon icon={config.actionIcon} />
          <h2>{config.totalLabel}</h2>
          <p className="order_count_main" style={{ marginTop: "10px", color: "#00d1b2" }}>
            {seller?.totalItemsCount || 0}
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="Dashboard_footer">
        <Link to="/dashboard" className="footer_item">
          <FontAwesomeIcon icon={faHome} />
          <h2>Home</h2>
        </Link>

        <Link to={config.orderLink} className="footer_item">
          <div style={{ position: "relative" }}>
            <FontAwesomeIcon icon={config.mainIcon} />
            {newOrdersCount > 0 && <span className="order_badge">{newOrdersCount}</span>}
          </div>
          <h2>{config.orderTitle}</h2>
        </Link>

        <Link to="/SellerConversations" className="footer_item">
          <div style={{ position: "relative" }}>
            <FontAwesomeIcon icon={faCommentDots} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </div>
          <h2>Messages</h2>
        </Link>

        <Link to="/my_store" className="footer_item">
          <FontAwesomeIcon icon={faStore} />
          <h2>My Store</h2>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;