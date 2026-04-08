import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client"; // Import directly or from your Socket config
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";

function ChatNotification({ userId }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      try {
        const convRes = await api.get("/api/buyer/conversations");
        if (convRes.data.success) {
          setConversations(convRes.data.conversations);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchConversations();

    // Use the existing socket connection logic
    const socket = io("https://isonga-backend.onrender.com", {
      auth: { token: localStorage.getItem("token") },
    });

    const handleNotification = (data) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === data.room);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            unreadCount: data.unreadChatCount,
          };
          return updated;
        }
        return [{ _id: data.room, unreadCount: data.unreadChatCount }, ...prev];
      });
    };

    socket.on("newMessageNotification", handleNotification);

    return () => {
      socket.off("newMessageNotification", handleNotification);
      socket.disconnect();
    };
  }, [userId]);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <Link to="/BuyerConversations">
      <div style={{ position: "relative" }}>
        <FontAwesomeIcon icon={faEnvelope} size="lg" className="faEnvelope" />
        {totalUnread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-10px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "11px",
            }}
          >
            {totalUnread}
          </span>
        )}
      </div>
    </Link>
  );
}

export default ChatNotification;