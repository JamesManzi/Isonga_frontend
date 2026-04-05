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
  // This object maps the SellerType to the correct labels, links, and icons.
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
      notifyIcon: "🛍️"
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
      notifyIcon: "📅"
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
      notifyIcon: "🔑"
    }
  };

  const sType = seller?.sellerType || "Product";
  const config = UI_CONFIG[sType] || UI_CONFIG.Product;

  /* ---------------- 2. HANDLERS ---------------- */
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      const res = await api.post("/api/logout");
      if (res.data.success) {
        if (socketRef.current) socketRef.current.disconnect();
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  /* ---------------- 3. DATA FETCHING ---------------- */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await api.get("/api/dashboard");

        if (res.data.success && res.data.seller) {
          const s = res.data.seller;
          setSeller({
            ...s,
            averageRating: s.averageRating ?? 0,
            numReviews: s.numReviews ?? 0,
            totalOrders: s.totalOrders ?? 0,
          });
          setTotalViews(res.data.totalViews ?? 0);
          setTodayViews(res.data.todayViews ?? 0);
          setNewOrdersCount(s.newOrders ?? 0);

          // Fetch Messages Unread Count
          const unreadRes = await api.get("/api/seller/conversations");
          if (unreadRes.data.success) {
            const count = unreadRes.data.conversations.reduce(
              (sum, conv) => sum + (conv.unreadCount || 0), 0
            );
            setUnreadCount(count);
          }
        }
      } catch (err) {
        toast.error("Failed to load dashboard data");
      }
    };

    fetchDashboardData();
  }, [navigate]);

  /* ---------------- 4. REAL-TIME SOCKETS ---------------- */
  useEffect(() => {
    if (!seller?._id) return;
    const token = localStorage.getItem("token");

    if (!socketRef.current) {
      socketRef.current = io("https://isonga-backend.onrender.com", {
        transports: ["websocket"],
        extraHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    const socket = socketRef.current;
    socket.emit("userOnline", { userId: seller._id, userModel: "Seller" });

    const notify = (msg, icon) => {
      toast.success(msg, { icon });
      setNewOrdersCount(prev => prev + 1);
      setSeller(prev => ({ ...prev, totalOrders: (prev.totalOrders || 0) + 1 }));
    };

    socket.on("newOrderNotification", (data) => notify(data.message || "New Order!", "🛍️"));
    socket.on("newBookingNotification", (data) => notify(data.message || "New Booking!", "📅"));
    socket.on("newRentalNotification", (data) => notify(data.message || "New Rental Request!", "🔑"));
    
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

  /* ---------------- 5. HELPERS ---------------- */
  const renderStars = (avg = 0) => {
    const stars = [];
    const rating = Math.round(avg * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (rating >= i - 0.5) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ opacity: 0.5 }} />);
      else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
  };

  const getFileUrl = (path) => path ? (path.startsWith("http") ? path : `https://isonga-backend.onrender.com/uploads/${path}`) : "/placeholder.png";

  if (!seller) return <div className="beautiful-loading">Loading...</div>;

  /* ---------------- 6. RENDER UI ---------------- */
  return (
    <div className="Dashboard">
      <Toaster position="top-center" />

      {/* Navbar */}
      <nav className="Dashboard_navbar">
        <div className="Dashboard_bars" onClick={toggleMenu} ref={dropdownRef}>
          <FontAwesomeIcon icon={faBars} />
          {isMenuOpen && (
            <div className="dropdown_list">
              <Link to="/settings">Settings</Link>
              <Link to="/inventory">My Inventory</Link>
              <hr />
              <button onClick={handleLogout} className="logout_btn_mobile">Logout</button>
            </div>
          )}
        </div>
        <div className="Dashboard_text"><h2>ISONGA MARKET</h2></div>
        <div className="Dashboard_rightside">
          <Link to="/seller_profile">
            <img src={getFileUrl(seller.profile)} alt="Profile" className="dashboard_seller-image" />
          </Link>
          <button onClick={handleLogout} className="Dashboard_Logout">Logout</button>
        </div>
      </nav>

      {/* Header */}
      <header className="Dashboard_heading">
        <h1>Welcome Back, {seller.name} <FontAwesomeIcon icon={faHand} /></h1>
        <p>Managing your {sType.toLowerCase()} business</p>
      </header>

      {/* Stats Grid */}
      <section className="Dashboard_body1">
        <div className="stat_card views_card">
          <FontAwesomeIcon icon={faEye} />
          <p>Today's Visibility</p>
          <p className="order_count_main">{todayViews} Views</p>
        </div>
        <div className="stat_card orders_card">
          <FontAwesomeIcon icon={config.mainIcon} />
          <h2>{config.orderTitle}</h2>
          <div className="order_count_main">
            <p>Total: {seller.totalOrders}</p>
            <p className="new_highlight">New: {newOrdersCount}</p>
          </div>
        </div>
      </section>

      {/* Ratings Section */}
      <section className="Dashboard_body2">
        <div className="stat_card total_views">
          <FontAwesomeIcon icon={faEye} />
          <h2>Lifetime Views</h2>
          <p>{totalViews}</p>
        </div>
        <div className="stat_card ratings">
          <FontAwesomeIcon icon={faStar} />
          <h2>Performance</h2>
          <p>{Number(seller.averageRating).toFixed(1)} / 5.0</p>
          <div className="stars">{renderStars(seller.averageRating)}</div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="Dashboard_body3">
        <Link to={config.addLink} className="action_card">
          <FontAwesomeIcon icon={faAdd} />
          <h2>{config.addText}</h2>
        </Link>
        <Link to={config.historyLink} className="action_card">
          <FontAwesomeIcon icon={faHistory} />
          <h2>{config.historyTitle}</h2>
        </Link>
        <Link to="/inventory" className="action_card inventory_accent">
          <FontAwesomeIcon icon={config.actionIcon} />
          <h2>{config.totalLabel}</h2>
          <p className="count_badge">{seller?.totalItemsCount || 0}</p>
        </Link>
      </section>

      {/* Fixed Footer Navigation */}
      <footer className="Dashboard_footer">
        <Link to="/dashboard" className="footer_item active">
          <FontAwesomeIcon icon={faHome} />
          <h2>Home</h2>
        </Link>
        <Link to={config.orderLink} className="footer_item">
          <div className="icon_wrapper">
            <FontAwesomeIcon icon={config.mainIcon} />
            {newOrdersCount > 0 && <span className="order_badge">{newOrdersCount}</span>}
          </div>
          <h2>{config.orderTitle}</h2>
        </Link>
        <Link to="/SellerConversations" className="footer_item">
          <div className="icon_wrapper">
            <FontAwesomeIcon icon={faCommentDots} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </div>
          <h2>Inbox</h2>
        </Link>
        <Link to="/my_store" className="footer_item">
          <FontAwesomeIcon icon={faStore} />
          <h2>My Store</h2>
        </Link>
      </footer>
    </div>
  );
}

export default Dashboard;