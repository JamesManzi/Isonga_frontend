import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import api from "./api"; // Your axios instance

const NotificationBell = ({ buyerId }) => {
  const navigate = useNavigate();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchOrderNotifications = async () => {
    if (!buyerId) return;
    try {
      const res = await api.get(`/api/notifications?t=${Date.now()}`);
      if (res.data.success) {
        const fetchedNotifs = res.data.notifications;
        setOrderNotifications(fetchedNotifs);
        setUnreadNotifCount(fetchedNotifs.filter((n) => !n.read).length);
      }
    } catch (err) {
      console.error("Notif Error:", err);
    }
  };

  useEffect(() => {
    if (!buyerId) return;

    fetchOrderNotifications();

    // Socket Setup
    const socket = io("https://api.isongamarket.com");
    socket.emit("userOnline", { userId: buyerId, userModel: "Buyer" });

    socket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      if (data.unreadCount !== undefined) {
        setUnreadNotifCount(data.unreadCount);
      } else {
        setUnreadNotifCount((prev) => prev + 1);
      }
      
      if (document.hidden && Notification.permission === "granted") {
        new Notification("Isonga Market Update", { body: data.message, icon: "/logo.png" });
      }
    });

    // Re-fetch on window focus
    const handleFocus = () => fetchOrderNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      socket.off("new_notification");
      socket.disconnect();
      window.removeEventListener("focus", handleFocus);
    };
  }, [buyerId]);

  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMarkAllRead = async () => {
    setUnreadNotifCount(0);
    try {
      const res = await api.put("/api/notifications/mark-read");
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
    navigate("/notifications");
    setShowDropdown(false);
  };

  return (
    <div className="notification-wrapper" style={{ position: "relative" }}>
      <div className="bell-icon-container" onClick={handleToggleDropdown} style={{ cursor: "pointer" }}>
        <FontAwesomeIcon icon={faBell} size="2x" />
        {unreadNotifCount > 0 && (
          <span className="notification-badge-global">{unreadNotifCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown-global">
          <div className="notif-dropdown-header">
            <h4>Notifications</h4>
            <button onClick={handleMarkAllRead}>See All</button>
          </div>
          <div className="notif-dropdown-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((n) => (
                <div key={n._id} className={`notif-dropdown-item ${!n.read ? "unread" : ""}`}>
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            ) : (
              <p className="no-notif-msg">No new notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;