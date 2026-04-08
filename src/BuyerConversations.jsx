import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client";
import "./BuyerConversations.css";

const BACKEND_URL = "https://isonga-backend.onrender.com";

function BuyerConversations() {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const socketRef = useRef(null);
  const mountedRef = useRef(false);

  // =========================
  // FETCH CONVERSATIONS
  // =========================
  const fetchConversations = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/buyer/conversations");

      if (res.data.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INIT SOCKET + LOAD DATA
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/buyer_login");
      return;
    }

    let isSubscribed = true;

    const init = async () => {
      try {
        // 1. Fetch initial list from DB
        await fetchConversations();
        if (!isSubscribed) return;

        // 2. Initialize Socket
        const socket = io(BACKEND_URL, {
          transports: ["polling", "websocket"],
          auth: { token },
        });
        socketRef.current = socket;

        // 3. Register Buyer (THE KEY TO REAL-TIME)
        socket.on("connect", async () => {
          console.log("✅ Socket Connected:", socket.id);
          try {
            const res = await api.get("/api/buyer/profile");
            if (res.data.success && isSubscribed) {
              // Ensure we send "Buyer" to match the backend's .toUpperCase() logic
              socket.emit("userOnline", {
                userId: res.data.buyer._id,
                userModel: "Buyer",
              });
              console.log("📡 Buyer Registered for Notifications:", res.data.buyer._id);
            }
          } catch (err) {
            console.error("Profile fetch error for socket:", err);
          }
        });

        // 4. Real-time New Message Update
        socket.on("newMessageNotification", (data) => {
          console.log("🔔 New message notification received:", data);
          
          setConversations((prev) => {
            // Use String() to prevent ID mismatch errors
            const exists = prev.find((c) => String(c.room) === String(data.room));

            if (!exists) {
              console.log("🆕 New conversation detected, re-fetching list...");
              fetchConversations(); 
              return prev;
            }

            return prev.map((c) =>
              String(c.room) === String(data.room)
                ? {
                    ...c,
                    lastMessage: data.message,
                    updatedAt: data.createdAt,
                    // Use || to fall back if one key is missing
                    unreadCount: data.roomUnreadCount !== undefined ? data.roomUnreadCount : data.unreadChatCount,
                  }
                : c
            ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          });
        });

        // 5. Real-time Read Status
        socket.on("messagesRead", ({ room }) => {
          setConversations((prev) =>
            prev.map((c) => (String(c.room) === String(room) ? { ...c, unreadCount: 0 } : c))
          );
        });

        // 6. Real-time Delete Sync
        socket.on("conversationDeleted", ({ room }) => {
          setConversations((prev) => prev.filter((c) => String(c.room) !== String(room)));
        });

      } catch (err) {
        console.error("Socket Init Error:", err);
      }
    };

    init();

    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [navigate]);
  // =========================
  // HELPERS
  // =========================
  const getProfileImg = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http")
      ? path
      : `${BACKEND_URL}/uploads/${path}`;
  };

  const filteredChats = conversations.filter((chat) =>
    chat.sellerName?.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/buyer_dashboard" className="back-button">
          ←
        </Link>
        <h2>Messages</h2>
      </div>

      <div className="chat-search">
        <input
          type="text"
          placeholder="Search sellers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="chat-list">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">No messages found.</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.room}
              className="chat-item"
              onClick={() =>
                navigate(`/buyer_chat/${chat.sellerId}`)
              }
            >
              <div className="avatar">
                <img
                  src={getProfileImg(chat.sellerProfile)}
                  alt={chat.sellerName}
                />
              </div>

              <div className="chat-details">
                <div className="chat-top">
                  <h4>{chat.sellerName}</h4>
                  <span className="chat-time">
                    {new Date(chat.updatedAt).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>

                <div className="chat-bottom">
                  <p
                    className={
                      chat.unreadCount > 0 ? "unread-text" : ""
                    }
                  >
                    {chat.lastMessage || "No messages yet"}
                  </p>

                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, chat.room)}
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BuyerConversations;