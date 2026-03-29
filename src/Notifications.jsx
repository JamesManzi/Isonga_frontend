import { useEffect, useState } from "react";
import api from "./api";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
          // Mark all as read once the user opens this page
          await api.put("/api/notifications/mark-read");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div className="notifications-container">
      <h2>Activity Feed</h2>
      {loading ? (
        <p>Loading updates...</p>
      ) : notifications.length === 0 ? (
        <p>No new updates yet.</p>
      ) : (
        notifications.map((n) => (
          <div key={n._id} className={`notif-card ${n.status === 'Unread' ? 'unread' : ''}`}>
            <div className="notif-content">
              <p>{n.message}</p>
              <span className="notif-time">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;