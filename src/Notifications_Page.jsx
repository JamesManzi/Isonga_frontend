import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckDouble, faCircle } from "@fortawesome/free-solid-svg-icons";
import "./Notifications.css";

function Notifications_Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchNotifications = async () => {
    try {
      // 1. Fetch notifications first so the user sees something immediately
      const res = await api.get("/api/notifications");
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }

      // 2. Silently mark them as read in the background
      await api.put("/api/notifications/mark-read");
      
    } catch (err) {
      console.error("Notification Page Error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchNotifications();
}, []);

  return (
    <div className="notifications-page">
      <div className="notif-page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>Notifications</h1>
      </div>

      <div className="notif-list">
        {loading ? (
          <p className="loading-text">Loading updates...</p>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>Your order updates will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n._id} 
              className={`notif-page-card ${!n.read ? "unread-notif" : ""}`}
              onClick={() => n.orderId && navigate(`/my-orders/${n.orderId}`)}
            >
              <div className="notif-status-icon">
                {n.message.includes("✅") ? "📦" : "❌"}
              </div>
              <div className="notif-page-content">
                <p>{n.message}</p>
                <span className="notif-date">
                  {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              {!n.read && <FontAwesomeIcon icon={faCircle} className="unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications_Page;