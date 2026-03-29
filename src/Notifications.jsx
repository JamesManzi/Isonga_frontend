import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this
import api from "./api";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      
      // 🛡️ SECURITY CHECK: Don't even try if there's no token
      if (!token) {
        console.warn("No token found, redirecting to login...");
        navigate("/buyer_login");
        return;
      }

      try {
        const res = await api.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
          
          // Only mark as read if there are actually unread notifications
          const hasUnread = res.data.notifications.some(n => !n.read);
          if (hasUnread) {
            await api.put("/api/notifications/mark-read");
          }
        }
      } catch (err) {
        // If it's a 401, your api.js interceptor handles the redirect
        console.error("Notification Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [navigate]);

  return (
    <div className="notifications-container">
      <div className="notif-header">
        <h2>Activity Feed</h2>
      </div>
      
      {loading ? (
        <div className="loading-state">
           <p>Loading updates...</p>
        </div>
      ) : notifications.length === 0 ? (
        <p className="no-notif">No new updates yet.</p>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            /* ✅ FIXED: Use !n.read instead of n.status */
            <div key={n._id} className={`notif-card ${!n.read ? 'unread' : ''}`}>
              <div className="notif-content">
                <p>{n.message}</p>
                <span className="notif-time">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;