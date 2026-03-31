import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEye,
  faDownload,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
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
  console.log("CLICKED NOTIF:", n);

  const id = n.refId || n.orderId || n.bookingId || n._id;

  if (!id) {
    alert("No ID found for this notification");
    return;
  }

  if (n.type === "Order") {
    navigate(`/buyer/order/${id}`);
  }

  if (n.type === "Booking") {
    navigate(`/buyer/booking/${id}`);
  }
};

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <button onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2>Notifications</h2>
      </div>

      <div className="notif-list">
        {loading ? (
          <p>Loading...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-card ${!n.read ? "unread" : ""}`}
              onClick={() => handleView(n)}
            >
              <div className="notif-left">
                <span>{n.type === "Order" ? "📦" : "📅"}</span>
              </div>

              <div className="notif-center">
                <p>{n.message}</p>
                <small>
                  {new Date(n.createdAt).toLocaleString()}
                </small>
              </div>

              <div className="notif-right">
                {/* VIEW */}
                <button
                  className="icon-btn view"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(n);
                  }}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>

                {/* DOWNLOAD */}
                {n.fileUrl && (
                  <button
                    className="icon-btn download"
                    onClick={(e) => handleDownload(e, n)}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                )}

                {!n.read && (
                  <FontAwesomeIcon icon={faCircle} className="dot" />
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