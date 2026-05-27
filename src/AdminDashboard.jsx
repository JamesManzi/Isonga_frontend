
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHome,
  faUsers,
  faStore,
  faChartLine,
  faBox,
  faCommentDots,
  faSignOutAlt,
  faMoneyBillWave,
  faBell,
  faUserShield,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import api from "./api";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";

function AdminDashboard() {

  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifications, setNotifications] = useState(0);
 const [buyers,setBuyers]=useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {

    try {

      const res = await api.post("/api/logout");

      if (res.data.success) {

        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        localStorage.removeItem("token");

        navigate("/login");
      }

    } catch (error) {

      console.log("Logout error", error);
      toast.error("Logout failed");

    }

  };
/* ---------------- FETCH ADMIN DATA ---------------- */

useEffect(() => {
  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);

      // Pass the authorization headers to your requests
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [statsRes, usersRes, ordersRes] = await Promise.all([
        api.get("/api/admin/dashboard", config),
        api.get("/api/admin/users?limit=5", config),
        api.get("/api/admin/orders?limit=5", config),
      ]);

      if (statsRes.data.success) {
        // Ensure stats matches your schema perfectly
        setStats(statsRes.data); 
      }

      if (usersRes.data.success) {
        setRecentUsers(usersRes.data.users || []);
      }

      if (ordersRes.data.success) {
        setRecentOrders(ordersRes.data.orders || []);
      }

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      toast.error(
        err?.response?.data?.message ||
        "Failed to load admin dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  fetchAdminData();
}, [navigate]);
  /* ---------------- SOCKET ---------------- */

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) return;

    socketRef.current = io("https://api.isongamarket.com", {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Admin socket connected");
    });

    socket.on("newOrder", (data) => {

      toast.success(data.message || "New Order Received");

      setNotifications((prev) => prev + 1);

      setStats((prev) => ({
        ...prev,
        totalOrders: (prev?.totalOrders || 0) + 1,
      }));

    });

    socket.on("newSeller", (data) => {

      toast.success(data.message || "New Seller Registered");

      setNotifications((prev) => prev + 1);

      setStats((prev) => ({
        ...prev,
        totalSellers: (prev?.totalSellers || 0) + 1,
      }));

    });

    socket.on("newUser", () => {

      setNotifications((prev) => prev + 1);

      setStats((prev) => ({
        ...prev,
        totalUsers: (prev?.totalUsers || 0) + 1,
      }));

    });

    return () => {

      socket.off("newOrder");
      socket.off("newSeller");
      socket.off("newUser");

    };

  }, []);

  /* ---------------- CLOSE DROPDOWN ---------------- */

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }

    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  /* ---------------- LOADING ---------------- */

  if (loading) {

    return (

      <div className="beautiful-loading">

        <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-3xl border border-white/30 shadow-2xl">

          <FontAwesomeIcon
            icon={faSpinner}
            spin
            size="3x"
            className="mb-4"
          />

          <h2>Loading Admin Dashboard...</h2>

        </div>

      </div>

    );

  }

  return (

    <div className="Dashboard">

      <Toaster position="top-center" />

      {/* ---------------- NAVBAR ---------------- */}

      <div className="Dashboard_navbar">

        <div className="Dashboard_bars" onClick={toggleMenu}>

          <FontAwesomeIcon icon={faBars} />

          {isMenuOpen && (

            <div className="dropdown_list" ref={dropdownRef}>

              <Link to="/admin/dashboard">Dashboard</Link>

              <Link to="/admin/users">Users</Link>

              <Link to="/admin/sellers">Sellers</Link>

              <Link to="/admin/products">Products</Link>

              <Link to="/admin/orders">Orders</Link>

              <Link to="/admin/messages">Messages</Link>

              <Link to="/admin/reports">Reports</Link>

              <hr />

              <button onClick={handleLogout}>
                Logout
              </button>

            </div>

          )}

        </div>

        <div className="Dashboard_text">
          <h2>Admin Control Panel</h2>
        </div>

        <div className="Dashboard_rightside">

          <div className="notification_icon">

            <FontAwesomeIcon icon={faBell} />

            {notifications > 0 && (
              <span className="badge">
                {notifications}
              </span>
            )}

          </div>

          <button
            onClick={handleLogout}
            className="Dashboard_Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>

        </div>

      </div>

      {/* ---------------- HEADER ---------------- */}

      <div className="Dashboard_heading">

        <h1>
          Welcome Back Admin
          <FontAwesomeIcon
            icon={faUserShield}
            className="faHand"
          />
        </h1>

        <p>
          Monitor your entire marketplace system in real-time
        </p>

      </div>

      {/* ---------------- STATS ---------------- */}

      <div className="Dashboard_body1">

        <div className="sales">

          <FontAwesomeIcon icon={faUsers} />

          <p>Total Users</p>

          <h2>{stats?.totalUsers || 0}</h2>

        </div>

        <div className="orders">

          <FontAwesomeIcon icon={faStore} />

          <p>Total Sellers</p>

          <h2>{stats?.totalSellers || 0}</h2>

        </div>

        <div className="views">

          <FontAwesomeIcon icon={faBox} />

          <p>Total Products</p>

          <h2>{stats?.totalProducts || 0}</h2>

        </div>

        <div className="views">

          <FontAwesomeIcon icon={faChartLine} />

          <p>Total Orders</p>

          <h2>{stats?.totalOrders || 0}</h2>

        </div>

      </div>

      {/* ---------------- EXTRA STATS ---------------- */}

      <div className="Dashboard_body2">

        <div className="ratings">

          <FontAwesomeIcon icon={faMoneyBillWave} />

          <h2>Total Buyers</h2>

          <h2>
            {stats?.totalBuyers || 0}
          </h2>

        </div>

        <div className="ratings">

          <FontAwesomeIcon icon={faCommentDots} />

          <h2>Total Messages</h2>

          <p>{stats?.totalMessages || 0}</p>

        </div>

      </div>

      {/* ---------------- QUICK ACTIONS ---------------- */}

      <div className="Dashboard_body3">

        <Link
          to="/AdminBuyers"
          className="add_product"
        >

          <FontAwesomeIcon icon={faUsers} />

          <h2>Manage Buyers</h2>

        </Link>

        <Link
          to="/AdminManageSellers"
          className="viewOrders"
        >

          <FontAwesomeIcon icon={faStore} />

          <h2>Manage Sellers</h2>

        </Link>

        <Link
          to="/AdminOrders"
          className="buyer_messages"
        >

          <FontAwesomeIcon icon={faChartLine} />

          <h2>Orders</h2>

        </Link>

        <Link
          to="/AdminBookings"
          className="buyer_messages"
        >

          <FontAwesomeIcon icon={faChartLine} />

          <h2>Bookings</h2>

        </Link>

      </div>

      {/* ---------------- RECENT USERS ---------------- */}

      <div className="Dashboard_body2">

        <h2 className="section_title">
          Recent Users
        </h2>

        {recentUsers.length > 0 ? (

          recentUsers.map((user) => (

            <div
              key={user._id}
              className="user_card"
            >

              <div>

                <p>
                  <strong>{user.name}</strong>
                </p>

                <p>{user.email}</p>

              </div>

              <span className="user_role">
                {user.role}
              </span>

            </div>

          ))

        ) : (

          <p>No users found</p>

        )}

      </div>

      {/* ---------------- RECENT ORDERS ---------------- */}

      <div className="Dashboard_body2">

        <h2 className="section_title">
          Recent Orders
        </h2>

        {recentOrders.length > 0 ? (

          recentOrders.map((order) => (

            <div
              key={order._id}
              className="user_card"
            >

              <div>

                <p>
                  <strong>
                    Order #{order._id.slice(-6)}
                  </strong>
                </p>

                <p>
                  {order.customerName || "Customer"}
                </p>

              </div>

              <span className="order_price">
                ${order.totalPrice}
              </span>

            </div>

          ))

        ) : (

          <p>No recent orders</p>

        )}

      </div>

      {/* ---------------- FOOTER ---------------- */}

      <div className="Dashboard_footer">

        <Link
          to="/admin/dashboard"
          className="footer_item"
        >

          <FontAwesomeIcon icon={faHome} />

          <h2>Dashboard</h2>

        </Link>

        <Link
          to="/AdminBuyers"
          className="footer_item"
        >

          <FontAwesomeIcon icon={faUsers} />

          <h2>Buyers</h2>

        </Link>

        <Link
          to="/AdminManageSellers"
          className="footer_item"
        >

          <FontAwesomeIcon icon={faStore} />

          <h2>Sellers</h2>

        </Link>

         <div className="views">

  <FontAwesomeIcon icon={faChartLine} />

  <p>New Orders</p>

  <h2>{stats?.newOrders || 0}</h2>

</div>
      </div>

    </div>

  );

}

export default AdminDashboard;