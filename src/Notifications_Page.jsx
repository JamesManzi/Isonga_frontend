import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircle, faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
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

  const handleView = (n) => {
    if (n.orderId) navigate(`/buyer/order/${n.orderId}`);
    if (n.bookingId) navigate(`/buyer/booking/${n.bookingId}`);
  };

  const handleDownload = (e, n) => {
    e.stopPropagation();

    if (n.fileUrl) {
      window.open(n.fileUrl, "_blank");
    } else {
      alert("No file available for download");
    }
  };

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
            <p>Your updates will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-card ${!n.read ? "unread" : ""}`}
              onClick={() => handleView(n)}
            >
              <div className="notif-left">
                <div className="notif-icon">
                  {n.message.includes("✅") ? "📦" : "❌"}
                </div>
              </div>

              <div className="notif-center">
                <p className="notif-message">{n.message}</p>
                <span className="notif-date">
                  {new Date(n.createdAt).toLocaleDateString()} •{" "}
                  {new Date(n.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="notif-right">
                {/* VIEW BUTTON */}
                <button
                  className="view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(n);
                  }}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>

                {/* DOWNLOAD BUTTON */}
                {n.fileUrl && (
                  <button
                    className="download-btn"
                    onClick={(e) => handleDownload(e, n)}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                )}

                {!n.read && (
                  <FontAwesomeIcon icon={faCircle} className="unread-dot" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications_Page;