import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircle } from "@fortawesome/free-solid-svg-icons";
import "./Notifications.css";

function Notifications_Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
        }

        // Mark all as read (optional - keep original behavior)
        await api.put("/api/notifications/mark-read");

      } catch (err) {
        console.error("Notification Page Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const fetchDetails = async (notif) => {
  try {
    let details = {};

    if (notif.orderId) {
      const res = await api.get(`/api/orders/${notif.orderId}`);
      details = res.data.order || {};
    }

    if (notif.bookingId) {
      const res = await api.get(`/api/bookings/${notif.bookingId}`);
      details = res.data.booking || {};
    }

    // ✅ ALWAYS OPEN MODAL EVEN IF API FAILS
    setSelectedNotif({ ...notif, ...details });

  } catch (err) {
    console.error(err);

    // ✅ fallback: still open modal
    setSelectedNotif(notif);
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
            <p>Your Notifications updates will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-page-card ${!n.read ? "unread-notif" : ""}`}
              onClick={() => fetchDetails(n)}
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

      {/* ✅ MAIN MODAL */}
      {selectedNotif && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedNotif(null)}
            >
              ✖
            </button>

            <h2>
              {selectedNotif.items ? "Order Details" : "Booking Details"}
            </h2>

            {/* CUSTOMER */}
            <p><strong>Name:</strong> {selectedNotif.name}</p>
            <p><strong>Phone:</strong> {selectedNotif.phone}</p>
            <p><strong>Address:</strong> {selectedNotif.address}</p>

            {/* BOOKING INFO */}
            {selectedNotif.date && (
              <>
                <p><strong>Date:</strong> {selectedNotif.date}</p>
                <p><strong>Time:</strong> {selectedNotif.time}</p>
                <p><strong>Message:</strong> {selectedNotif.message || "No message"}</p>
              </>
            )}

            {/* PAYMENT */}
            <p><strong>Payment:</strong> {selectedNotif.paymentMethod}</p>

            {/* RECEIPT */}
            {selectedNotif.paymentProof && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImg(selectedNotif.paymentProof);
                }}
              >
                📷 View Receipt
              </button>
            )}

            {/* ITEMS */}
            {selectedNotif.items && (
              <div>
                <h3>Items</h3>
                {selectedNotif.items.map((item, i) => (
                  <div key={i}>
                    {item.product?.name || "Deleted Product"} × {item.quantity}
                  </div>
                ))}
              </div>
            )}

            {/* TOTAL */}
            {selectedNotif.totalPrice && (
              <h3>Total: {selectedNotif.totalPrice} Rwf</h3>
            )}

            {/* DOWNLOAD */}
            {selectedNotif.fileUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(selectedNotif.fileUrl, "_blank");
                }}
              >
                ⬇ Download
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ IMAGE MODAL (OUTSIDE MAIN MODAL) */}
      {selectedImg && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedImg(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedImg(null)}
            >
              ✖
            </button>

            <img
              src={selectedImg}
              alt="Receipt"
              style={{ maxWidth: "100%", maxHeight: "80vh" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications_Page;