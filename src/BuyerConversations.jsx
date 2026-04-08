import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client";
import "./BuyerConversations.css";

const BACKEND_URL = "https://isonga-backend.onrender.com";

function BuyerConversations() {
  const [buyerId, setBuyerId] = useState("");
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const socketRef = useRef(null);

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
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/buyer_login");
      return;
    }

    let isSubscribed = true;

    const init = async () => {
      try {
        // 1. GET BUYER (Sequential logic like Seller)
        const profileRes = await api.get("/api/buyer/profile");
        if (!isSubscribed) return;

        if (!profileRes.data.success) {
          return navigate("/buyer_login");
        }

        const id = profileRes.data.buyer._id;
        setBuyerId(id);

        // 2. LOAD DATA FIRST
        await fetchConversations();
        if (!isSubscribed) return;

        // 3. SOCKET INIT
        const socket = io(BACKEND_URL, {
          transports: ["websocket", "polling"],
          auth: { token },
        });

        socketRef.current = socket;

        // Emit online status immediately after connection
        socket.on("connect", () => {
          socket.emit("userOnline", {
            userId: id,
            userModel: "Buyer",
          });
        });

        // =========================
        // REAL-TIME UPDATES
        // =========================
        socket.on("newMessageNotification", (data) => {
          setConversations((prev) => {
            // Use String conversion to ensure ID matching works
            const exists = prev.find((c) => String(c.room) === String(data.room));

            if (!exists) {
              fetchConversations();
              return prev;
            }

            return prev
              .map((c) =>
                String(c.room) === String(data.room)
                  ? {
                      ...c,
                      lastMessage: data.message,
                      updatedAt: data.createdAt,
                      // Matching the 'roomUnreadCount' key from backend
                      unreadCount: data.roomUnreadCount,
                    }
                  : c
              )
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          });
        });

        socket.on("messagesRead", ({ room }) => {
          setConversations((prev) =>
            prev.map((c) =>
              String(c.room) === String(room) ? { ...c, unreadCount: 0 } : c
            )
          );
        });

        socket.on("conversationDeleted", ({ room }) => {
          setConversations((prev) =>
            prev.filter((c) => String(c.room) !== String(room))
          );
        });

      } catch (err) {
        console.error("Socket Init Error:", err);
        if (isSubscribed) setLoading(false);
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
  // ACTIONS & HELPERS
  // =========================
  const openChat = async (chat) => {
    try {
      await api.put(`/api/messages/read/${chat.room}`);
      navigate(`/buyer_chat/${chat.sellerId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (e, room) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;

    setConversations((prev) =>
      prev.filter((c) => String(c.room) !== String(room))
    );

    socketRef.current?.emit("deleteConversation", { room });
  };

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
          <div className="loading">Loading Chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">No conversations yet.</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.room}
              className="chat-item"
              onClick={() => openChat(chat)}
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
                    {new Date(chat.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="chat-bottom">
                  <p className={chat.unreadCount > 0 ? "unread-text" : ""}>
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