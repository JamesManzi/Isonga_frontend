import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faBars,
  faBoxOpen,
  faCommentDots,
  faDigitalTachograph,
  faDollarSign,
  faEye,
  faHand,
  faHome,
  faStar,
  faStore,
  faBox,
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

  /* ---------------- SELLER TYPE LOGIC ---------------- */
  // Fallback to "Product" if seller is null to prevent crashing
  const sType = seller?.sellerType || "Product";

  const addLink = "/add_product";

  const addText =
    sType === "Product" ? "Add New Product" :
    sType === "Service" ? "Add New Service" : 
    "Add New Asset";

  const orderTitle =
    sType === "Product" ? "Orders" :
    sType === "Service" ? "Bookings" : 
    "Rentals";

  const viewTitle = "Total Views";

  const orderHistory =
    sType === "Product" ? "Order History" :
    sType === "Service" ? "Booking History" : 
    "Asset History";

  const orderLink = 
    sType === "Product" ? "/seller_orders" : 
    sType === "Service" ? "/seller_bookings" : 
    "/seller_rentals";

  const AddType =
    sType === "Product" ? "Total Products" :
    sType === "Service" ? "Total Services" : 
    "Total Assets";

  const historyLink =
    sType === "Product" ? "/SellerOrderHistory" :
    sType === "Service" ? "/SellerBookingHistory" : 
    "none";
  /* ---------------- END SELLER TYPE LOGIC ---------------- */

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  /* ---------------- FETCH DASHBOARD DATA ---------------- */

 useEffect(() => {
  const fetchSellerData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/api/dashboard");

      // 1. Check if the response actually contains the seller data
      if (res.data.success && res.data.seller) {
        const s = res.data.seller;

        setSeller({
          ...s,
          // Use the Nullish Coalescing Operator (??) for safer defaults
          averageRating: s.averageRating ?? 0,
          numReviews: s.numReviews ?? 0,
          totalOrders: s.totalOrders ?? 0,
          totalSales: s.totalSales ?? 0,
        });

        setTotalViews(res.data.totalViews ?? 0);
        setNewOrdersCount(s.newOrders ?? 0);
        setTodayViews(res.data.todayViews ?? 0);

        // 2. Only fetch conversations if the dashboard load was successful
        const unreadRes = await api.get("/api/seller/conversations");
        if (unreadRes.data.success && unreadRes.data.conversations) {
          const count = unreadRes.data.conversations.reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadCount(count);
        }
      } else {
        // Handle case where success is false (e.g., session expired)
        console.error("Dashboard error:", res.data.message);
        toast.error("Session error. Please login again.");
        // navigate("/login"); 
      }

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // This prevents the UI from staying in a "Loading" state forever if the server is down
      toast.error("Server connection failed");
    }
  };

  fetchSellerData();
}, [navigate]);
  /* ---------------- SOCKET REALTIME ---------------- */

  useEffect(() => {
  // 1. Guard: Wait for seller data and token
  const token = localStorage.getItem("token");
  if (!seller?._id || !token) return;

  // 2. Initialize socket if it doesn't exist
  if (!socketRef.current) {
    socketRef.current = io("https://api.isongamarket.com", {
      withCredentials: false,
      transports: ["polling", "websocket"],
      auth: { token },
    });
  }

  const socket = socketRef.current;

  // 3. Define the registration function
  // We put this in a function so we can call it on "connect" AND on initial load
  const registerUser = () => {
    console.log("Registering seller as online:", seller._id);
    socket.emit("userOnline", {
      userId: seller._id,
      userModel: "Seller",
    });
  };

  // 4. Handle connection logic
  if (socket.connected) {
    registerUser();
  }
  
  socket.on("connect", registerUser);

  // 5. --- Listeners ---
  socket.on("newOrderNotification", (data) => {
    toast.success(data.message || "New Order Received!", { icon: "🛍️" });
    setNewOrdersCount((prev) => prev + 1);
    setSeller((prev) => ({
      ...prev,
      totalOrders: (prev?.totalOrders || 0) + 1,
    }));
  });

  socket.on("newBookingNotification", (data) => {
    toast.success(data.message || "New Booking Received!", { icon: "📅" });
    setNewOrdersCount((prev) => prev + 1);
    setSeller((prev) => ({
      ...prev,
      totalOrders: (prev?.totalOrders || 0) + 1,
    }));
  });

  socket.on("newMessageNotification", () => {
    setUnreadCount((prev) => prev + 1);
    toast("New message from buyer!", { icon: "💬" });
  });

 // Updated code
socket.on("viewUpdate", (data) => {
  console.log("Live view received:", data); // Helpful for debugging
  setTotalViews(data.totalViews || 0);
  // If your backend isn't sending todayViews yet, it will default to 0
  if (data.todayViews) setTodayViews(data.todayViews); 
});

  socket.on("sellerRatingUpdated", (data) => {
    console.log("Rating Update Received:", data);
    toast.success("You received a new rating ⭐");
    setSeller((prev) => ({
      ...prev,
      averageRating: data.averageRating,
      numReviews: data.numReviews,
    }));
  });

  // 6. --- Cleanup ---
  return () => {
    socket.off("connect", registerUser);
    socket.off("newOrderNotification");
    socket.off("newBookingNotification");
    socket.off("newMessageNotification");
    socket.off("viewUpdate");
    socket.off("sellerRatingUpdated");
    // We don't disconnect here to keep the socket alive across dashboard sub-renders
  };
}, [seller?._id]); // Re-run only if the seller ID changes
if (!seller) {
  return (
    <div className="beautiful-loading">
      <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-3xl border border-white/30 shadow-2xl">
        <div className="loader-dots flex space-x-2 justify-center mb-4">
           <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
           <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
           <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
        <h2 className="text-white font-bold text-xl tracking-widest">ISONGA MARKET</h2>
        <p className="text-white/80 text-sm">Preparing your dashboard...</p>
      </div>
    </div>
  );
}
  /* ---------------- HELPERS ---------------- */

  const renderStars = (avg = 0) => {

    const stars = [];
    const rating = Number(avg);

    for (let i = 1; i <= 5; i++) {

      if (rating >= i) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      }

      else if (rating >= i - 0.5) {
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStar}
            color="gold"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        );
      }

      else {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
      }

    }

    return stars;

  };

  const getFileUrl = (path) => {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http")) return path;
  return `https://api.isongamarket.com/uploads/${path}`;
};
  /* ---------------- UI ---------------- */

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

        <div className="Dashboard_text">
          <h2>My Store</h2>
        </div>

        <div className="Dashboard_rightside">

          <Link to="/seller_profile">

            <div className="dashboard_profile">

              {seller.profile ? (
                <img
                  src={getFileUrl(seller.profile)}
                  alt="Seller"
                  className="dashboard_seller-image"
                />
              ) : (
                <div className="placeholder_profile">No Image</div>
              )}

            </div>

          </Link>

          <button onClick={handleLogout} className="Dashboard_Logout">
            Logout
          </button>

        </div>

      </div>

      {/* Welcome */}

      <div className="Dashboard_heading">

        <h1>
          Welcome Back {seller.name} <FontAwesomeIcon icon={faHand} />
        </h1>

        <p>Grow Your Business Today</p>

      </div>

      {/* Sales */}

      <div className="Dashboard_body1">

        <div className="sales">
          <FontAwesomeIcon icon={faEye} />
          <p>Today Views</p>
          <p className="order_count_main">{todayViews}</p>
        </div>

        {/* --- Hide Rentals icon/box for Assets --- */}
        {sType !== "Asset" && (
          <div className="orders">
            <FontAwesomeIcon icon={faBox} />
            <h2>{orderTitle}</h2>
            <div className="order_count_main">
              <p>Total: {seller.totalOrders}</p>
              <p>New: {newOrdersCount}</p>
            </div>
          </div>
        )}

      </div>

      {/* Views + Ratings */}

      <div className="Dashboard_body2">

        <div className="views">
          <FontAwesomeIcon icon={faEye} />
          <h2>{viewTitle}</h2>
          <p>{totalViews}</p>
        </div>

        <div className="ratings">
          <FontAwesomeIcon icon={faStar} />
          <h2>Your Ratings</h2>
          <p>
            {Number(seller.averageRating).toFixed(1)} ({seller.numReviews} reviews)
          </p>
          <div className="stars">{renderStars(seller.averageRating)}</div>
        </div>

      </div>

      {/* Action Cards */}

      <div className="Dashboard_body3">

        <div className="add_product">
          <Link to={addLink}>
            <FontAwesomeIcon icon={faAdd} />
            <h2>{addText}</h2>
          </Link>
        </div>

        {/* --- Hide Rental History icon/box for Assets --- */}
        {sType !== "Asset" && (
          <div className="viewOrders">
            <Link to={historyLink}>
              <FontAwesomeIcon icon={faBox} />
              <h2>{orderHistory}</h2>
            </Link>
          </div>
        )}

        <div className="buyer_messages">
          <Link to="#">
            <FontAwesomeIcon icon={faBoxOpen} />
            <h2>{AddType}</h2> 
            <p className="order_count_main" style={{ marginTop: "10px", color: "#00d1b2" }}>
              {seller?.totalItemsCount || 0}
            </p>
          </Link>
        </div>

      </div>

      {/* --- Footer (Updated Version) --- */}
<div className="Dashboard_footer">

  <Link to="/dashboard" className="footer_item">
    <FontAwesomeIcon icon={faHome} />
    <h2>Dashboard</h2>
  </Link>

  {/*  Footer Rental Icon: Hide if sType is Asset */}
  {sType !== "Asset" && (
    <Link to={orderLink} className="footer_item">
      <div style={{ position: "relative", display: "inline-block" }}>
        <FontAwesomeIcon icon={faBox} />
        {newOrdersCount > 0 && (
          <span className="order_badge">{newOrdersCount}</span>
        )}
      </div>
      <h2>{orderTitle}</h2>
    </Link>
  )}

  <Link to="/SellerConversations" className="footer_item">
    <div style={{ position: "relative", display: "inline-block" }}>
      <FontAwesomeIcon icon={faCommentDots} />
      {unreadCount > 0 && (
        <span className="badge">{unreadCount}</span>
      )}
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