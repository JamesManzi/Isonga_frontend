import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";

const BACKEND_URL = "https://isonga-backend.onrender.com";

function ChatNotification({ userId }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchConversations = async () => {
      try {
        const convRes = await api.get("/api/buyer/conversations");
        if (convRes.data.success && isMounted) {
          setConversations(convRes.data.conversations);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchConversations();

    // 1. Initialize Socket
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("token") },
    });

    // 2. Register User (Crucial so backend can target this specific user)
    socket.on("connect", () => {
      socket.emit("userOnline", {
        userId: userId,
        userModel: "Buyer",
      });
    });

    // 3. Handle Real-time Notifications
    const handleNotification = (data) => {
      setConversations((prev) => {
        // Check both .room and ._id just in case of backend key variance
        const index = prev.findIndex(
          (c) => String(c.room || c._id) === String(data.room)
        );

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            // Use roomUnreadCount to match your current backend logic
            unreadCount: data.roomUnreadCount !== undefined ? data.roomUnreadCount : data.unreadChatCount,
          };
          return updated;
        }

        // If it's a completely new conversation not in the list yet
        fetchConversations();
        return prev;
      });
    };

    socket.on("newMessageNotification", handleNotification);

    // Cleanup
    return () => {
      isMounted = false;
      socket.off("newMessageNotification", handleNotification);
      socket.disconnect();
    };
  }, [userId]);

  // Calculate total unread messages
  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unreadCount || 0),
    0
  );

  return (
    <Link to="/BuyerConversations">
      <div style={{ position: "relative", display: "inline-block" }}>
        <FontAwesomeIcon icon={faEnvelope} size="lg" />
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
              fontWeight: "bold",
              boxShadow: "0 0 5px rgba(0,0,0,0.2)"
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