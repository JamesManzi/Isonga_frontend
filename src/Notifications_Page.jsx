import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircle } from "@fortawesome/free-solid-svg-icons";
import "./Notifications.css";

function Notifications_Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
        }

        await api.put("/api/notifications/mark-read");
      } catch (err) {
        console.error(err);
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
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-page-card ${!n.read ? "unread-notif" : ""}`}
              onClick={() => {
                if (n.orderId) navigate(`/buyer/order/${n.orderId}`);
                if (n.bookingId) navigate(`/buyer/booking/${n.bookingId}`);
              }}
            >
              <div className="notif-status-icon">
                {n.message.includes("✅") ? "📦" : "❌"}
              </div>

              <div className="notif-page-content">
                <p>{n.message}</p>
                <span className="notif-date">
                  {new Date(n.createdAt).toLocaleDateString()} at{" "}
                  {new Date(n.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {!n.read && (
                <FontAwesomeIcon icon={faCircle} className="unread-dot" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications_Page;