import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { io } from "socket.io-client";
import api from "./api"; // Your axios instance
import "./NotificationBell.css"
const NotificationBell = ({ userId }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await api.get("/api/notifications");
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const socket = io("https://isonga-backend.onrender.com");
    socket.emit("userOnline", { userId, userModel: "Buyer" });

    socket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("new_notification");
      socket.disconnect();
    };
  }, [userId]);

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (unreadCount > 0) {
      try {
        await api.put("/api/notifications/mark-read");
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }
  };

  return (
    <div className="bell-wrapper" style={{ position: "relative", cursor: "pointer" }}>
      <div onClick={handleBellClick}>
        <FontAwesomeIcon icon={faBell} size="lg" />
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="bell-dropdown">
          <div className="bell-dropdown-header">
            Notifications
            <button onClick={() => navigate("/notifications")}>See All</button>
          </div>
          <div className="bell-dropdown-list">
            {notifications.slice(0, 5).map((n) => (
              <div key={n._id} className={`bell-item ${!n.read ? "unread" : ""}`}>
                {n.message}
              </div>
            ))}
            {notifications.length === 0 && <p className="empty-text">No notifications</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;