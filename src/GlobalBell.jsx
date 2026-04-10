import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import api from "./api";

const SOCKET_URL = "https://api.isongamarket.com";

const GlobalBell = ({ buyerId }) => {
  const navigate = useNavigate();

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // -----------------------------
  // FETCH NOTIFICATIONS
  // -----------------------------
  const fetchOrderNotifications = useCallback(async () => {
    if (!buyerId) return;

    try {
      const res = await api.get(`/api/notifications?t=${Date.now()}`);

      if (res.data.success) {
        const fetched = res.data.notifications || [];

        setNotifications(fetched);

        const unread = fetched.filter((n) => !n.read).length;
        setUnreadNotifCount(unread);
      }
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
  }, [buyerId]);

  // -----------------------------
  // SOCKET + SYNC SETUP
  // -----------------------------
  useEffect(() => {
    if (!buyerId) return;

    // initial fetch
    fetchOrderNotifications();

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.emit("userOnline", {
      userId: buyerId,
      userModel: "Buyer",
    });

    newSocket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev]);

      if (data.unreadCount !== undefined) {
        setUnreadNotifCount(data.unreadCount);
      } else {
        setUnreadNotifCount((prev) => prev + 1);
      }

      // browser notification
      if (document.hidden && Notification.permission === "granted") {
        new Notification("Isonga Market Update", {
          body: data.message,
          icon: "/logo.png",
        });
      }
    });

    // refresh when user returns to tab
    const handleFocus = () => fetchOrderNotifications();
    const handlePageShow = () => fetchOrderNotifications();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      newSocket.disconnect();
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [buyerId, fetchOrderNotifications]);

  // -----------------------------
  // HANDLE BELL CLICK
  // -----------------------------
  const handleBellClick = async () => {
    setUnreadNotifCount(0);

    try {
      const res = await api.put("/api/notifications/mark-read");

      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      }
    } catch (err) {
      console.error("Mark read error:", err);
    } finally {
      navigate("/notifications");
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div
      className="notification-container nav-icon-link"
      style={{
        position: "relative",
        cursor: "pointer",
        display: "inline-block",
      }}
      onClick={handleBellClick}
    >
      <FontAwesomeIcon icon={faBell} size="2x" />

      {unreadNotifCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            background: "red",
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {unreadNotifCount}
        </span>
      )}
    </div>
  );
};

export default GlobalBell;