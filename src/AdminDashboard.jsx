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
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

import api from "./api";
import toast, { Toaster } from "react-hot-toast";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    try {
      const res = await api.post("/api/logout");
      if (res.data.success) {
        navigate("/login");
      }
    } catch (error) {
      console.log("Logout error", error);
      toast.error("Logout failed");
    }
  };

  /* ---------------- FETCH ADMIN DATA ---------------- */
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const statsRes = await api.get("/admin/dashboard");
        setStats(statsRes.data);

        const usersRes = await api.get("/admin/users");
        setUsers(usersRes.data.users || []);
      } catch (err) {
        console.log(err);
        toast.error("Failed to load admin data");
      }
    };

    fetchAdmin();
  }, []);

  /* ---------------- CLICK OUTSIDE MENU ---------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="Dashboard">
      <Toaster position="top-center" />

      {/* NAVBAR */}
      <div className="Dashboard_navbar">
        <div className="Dashboard_bars" onClick={toggleMenu}>
          <FontAwesomeIcon icon={faBars} />

          {isMenuOpen && (
            <div className="dropdown_list" ref={dropdownRef}>
              <Link to="/admin/dashboard">Dashboard</Link>
              <Link to="/admin/users">Users</Link>
              <Link to="/admin/sellers">Sellers</Link>
              <hr />
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>

        <div className="Dashboard_text">
          <h2>Admin Panel</h2>
        </div>

        <button onClick={handleLogout} className="Dashboard_Logout">
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>

      {/* HEADER */}
      <div className="Dashboard_heading">
        <h1>Admin Dashboard</h1>
        <p>Manage users, sellers and platform activity</p>
      </div>

      {/* STATS CARDS */}
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
          <FontAwesomeIcon icon={faChartLine} />
          <p>Total Orders</p>
          <h2>{stats?.totalOrders || 0}</h2>
        </div>
      </div>

      {/* USERS LIST */}
      <div className="Dashboard_body2">
        <h2>Recent Users</h2>

        {users.slice(0, 5).map((user) => (
          <div key={user._id} className="user_card">
            <p>{user.name}</p>
            <p>{user.email}</p>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="Dashboard_body3">
        <Link to="/admin/users" className="add_product">
          <FontAwesomeIcon icon={faUsers} />
          <h2>Manage Users</h2>
        </Link>

        <Link to="/admin/sellers" className="viewOrders">
          <FontAwesomeIcon icon={faStore} />
          <h2>Manage Sellers</h2>
        </Link>

        <Link to="/admin/reports" className="buyer_messages">
          <FontAwesomeIcon icon={faChartLine} />
          <h2>Reports</h2>
        </Link>
      </div>

      {/* FOOTER */}
      <div className="Dashboard_footer">
        <Link to="/admin/dashboard" className="footer_item">
          <FontAwesomeIcon icon={faHome} />
          <h2>Dashboard</h2>
        </Link>

        <Link to="/admin/users" className="footer_item">
          <FontAwesomeIcon icon={faUsers} />
          <h2>Users</h2>
        </Link>

        <Link to="/admin/sellers" className="footer_item">
          <FontAwesomeIcon icon={faStore} />
          <h2>Sellers</h2>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;