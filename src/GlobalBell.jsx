import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import api from "./api";

const GlobalBell = ({ buyerId }) => {
  const navigate = useNavigate();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchOrderNotifications = async () => {
    if (!buyerId) return;
    try {
      const res = await api.get(`/api/notifications?t=${Date.now()}`);
      if (res.data.success) {
        const fetchedNotifs = res.data.notifications;
        setNotifications(fetchedNotifs);
        const unreadCount = fetchedNotifs.filter((n) => !n.read).length;
        setUnreadNotifCount(unreadCount);
      }
    } catch (err) {
      console.error("Notif Error:", err);
    }
  };

  useEffect(() => {
    if (!buyerId) return;

    fetchOrderNotifications();

    const socket = io("https://isonga-backend.onrender.com");
    socket.emit("userOnline", { userId: buyerId, userModel: "Buyer" });

    socket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      
      // Update count from socket data or increment
      if (data.unreadCount !== undefined) {
        setUnreadNotifCount(data.unreadCount);
      } else {
        setUnreadNotifCount((prev) => prev + 1);
      }

      // Browser Notification
      if (document.hidden && Notification.permission === "granted") {
        new Notification("Isonga Market Update", { body: data.message, icon: "/logo.png" });
      }
    });

    const handleFocus = () => fetchOrderNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      socket.off("new_notification");
      socket.disconnect();
      window.removeEventListener("focus", handleFocus);
    };
  }, [buyerId]);

  const handleBellClick = async () => {
    setUnreadNotifCount(0); // Instant UI feedback
    try {
      const res = await api.put("/api/notifications/mark-read");
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    } finally {
      navigate("/notifications"); // Go to page directly like dashboard
    }
  };

  return (
    <div 
      className="notification-container nav-icon-link" 
      style={{ position: "relative", cursor: "pointer", display: "inline-block" }} 
      onClick={handleBellClick}
    >
      <FontAwesomeIcon icon={faBell} size="2x" />
      {unreadNotifCount > 0 && (
        <span className="global-notification-badge">
          {unreadNotifCount}
        </span>
      )}
    </div>
  );
};

export default GlobalBell;