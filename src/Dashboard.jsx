
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

import axios from "axios";
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

  /* ---------------- SELLER TYPE LOGIC ---------------- */

  const addLink =
    seller?.sellerType === "Product"
      ? "/add_product"
      : seller?.sellerType === "Service"
      ? "/add_product"
      : "/add_product";

  const addText =
    seller?.sellerType === "Product"
      ? "Add New Product"
      : seller?.sellerType === "Service"
      ? "Add New Service"
      : "Add New Asset";

  const orderTitle =
    seller?.sellerType === "Product"
      ? "Orders"
      : seller?.sellerType === "Service"
      ? "Bookings"
      : "Rentals";

  const viewTitle =
    seller?.sellerType === "Product"
      ? "Total Views"
      : seller?.sellerType === "Service"
      ? "Total Views"
      : "Total Views";

      const orderHistory=
      seller?.sellerType==="Product"
      ?"Order History"
      :seller?.sellerType==="Service"
      ?"Booking History"
      :"Asset History"
      /* ---------------- SELLER TYPE LOGIC ---------------- */
// ... your existing addLink, addText, orderTitle ...

const orderLink = 
  seller?.sellerType === "Product" 
    ? "/seller_orders" 
    : seller?.sellerType === "Service" 
    ? "/seller_bookings" // Change this to your new bookings route
    : "/seller_rentals";
  /* ---------------- CLICK OUTSIDE MENU ---------------- */
 const AddType=
     seller?.sellerType==="Product"
     ?"Total Products"
     :seller?.sellerType==="Service"
     ?"Total Services"
     :"Total Assets"
  const historyLink=
  seller?.sellerType==="Product"
  ?"/SellerOrderHistory"
  :seller?.sellerType==="Service"
  ?"/SellerBookingHistory"
  :"none"
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

        const res = await axios.get(
          "https://isonga-backend.onrender.com/api/dashboard",
          { withCredentials: true }
        );

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
        setNewOrdersCount(s.newOrders || 0);
        setTodayViews(res.data.todayViews || 0);
        const unreadRes = await axios.get(
          "https://isonga-backend.onrender.com/api/seller/conversations",
          { withCredentials: true }
        );

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

  /* ---------------- SOCKET REALTIME ---------------- */

  useEffect(() => {

    if (!seller?._id) return;

    if (!socketRef.current) {

      socketRef.current = io("https://isonga-backend.onrender.com", {
        withCredentials: true,
        transports: ["websocket"],
      });

    }

    const socket = socketRef.current;

    socket.emit("userOnline", {
      userId: seller._id,
      userModel: "Seller",
    });

    socket.on("newOrderNotification", (data) => {

      toast.success(data.message || "New Order Received!", { icon: "🛍️" });

      setSeller((prev) => ({
        ...prev,
        totalOrders: (prev.totalOrders || 0) + 1,
      }));

      setNewOrdersCount((prev) => prev + 1);

    });
    socket.on("newBookingNotification", (data) => {
  toast.success(data.message || "New Booking Received!", { icon: "📅" });

  setSeller((prev) => ({
    ...prev,
    totalOrders: (prev.totalOrders || 0) + 1,
  }));

  setNewOrdersCount((prev) => prev + 1);
});
    socket.on("newMessageNotification", () => {

      setUnreadCount((prev) => prev + 1);

      toast("New message from buyer!", { icon: "💬" });

    });

    socket.on("newView", (data) => {
  setTotalViews(data.totalViews);
  setTodayViews(data.todayViews);
  // optional:
  console.log("Today views:", data.todayViews);
});

    socket.on("sellerRatingUpdated", (data) => {

      toast.success("You received a new rating ⭐");

      setSeller((prev) => ({
        ...prev,
        averageRating: data.averageRating,
        numReviews: data.numReviews,
      }));

    });

    return () => {

      socket.off("newOrderNotification");
      socket.off("newBookingNotification");
      socket.off("newMessageNotification");
      socket.off("newView");
      socket.off("sellerRatingUpdated");

    };

  }, [seller?._id]);

 if (!seller) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      {/* Visual Animation */}
      <div className="relative">
        {/* Main Floating Icon */}
        <div className="animate-bounce">
          <svg className="w-24 h-24 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        {/* Shadow Pulse */}
        <div className="w-16 h-2 bg-gray-200 rounded-full mx-auto mt-2 blur-sm animate-pulse"></div>
      </div>

      {/* Progress Bar Style */}
      <div className="mt-8 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 animate-[loading_2s_ease-in-out_infinite] origin-left"></div>
      </div>
      
      <p className="mt-4 text-gray-500 font-medium animate-pulse">Setting up your shop...</p>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.5); }
          100% { transform: scaleX(1); }
        }
      `}} />
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
  return `https://isonga-backend.onrender.com/uploads/${path}`;
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

        <div className="orders">
          <FontAwesomeIcon icon={faBox} />
          <h2>{orderTitle}</h2>
          <p className="order_count_main">
            <p>Total: {seller.totalOrders}</p>
<p>New: {newOrdersCount}</p>
          </p>
        </div>

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

        <div className="viewOrders">
          <Link to={historyLink}>
            <FontAwesomeIcon icon={faBox} />
            <h2>{orderHistory}</h2>
          </Link>
        </div>

        <div className="buyer_messages">
          <Link to="#">
            <FontAwesomeIcon icon={faBoxOpen} />
      <h2>{AddType}</h2> {/* Displays "Total Products", "Total Services", etc. */}
      
      {/* Display the count from the backend */}
      <p className="order_count_main" style={{ marginTop: "10px", color: "#00d1b2" }}>
        {seller.totalItemsCount || 0}
      </p>
          </Link>
        </div>

      </div>

      {/* Footer */}

      <div className="Dashboard_footer">

        <Link to="/dashboard" className="footer_item">
          <FontAwesomeIcon icon={faHome} />
          <h2>Dashboard</h2>
        </Link>

        {/* Updated Footer Item */}
<Link
  to={orderLink}
  className="footer_item"
  onClick={async () => {

    // ✅ 1. Reset UI instantly
    setNewOrdersCount(0);

    try {
      // Tell backend to mark as read
      await axios.post(
        "https://isonga-backend.onrender.com/api/seller/mark-activity-read",
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.log("Mark read failed");
    }

  }}
>
  <div style={{ position: "relative", display: "inline-block" }}>
    <FontAwesomeIcon icon={faBox} />
    {newOrdersCount > 0 && (
      <span className="order_badge">{newOrdersCount}</span>
    )}
  </div>

  <h2>{orderTitle}</h2>
</Link>

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