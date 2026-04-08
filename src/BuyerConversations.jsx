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

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/buyer_login");
    return;
  }

  let isActive = true;

  const socket = io(BACKEND_URL, {
    transports: ["websocket", "polling"],
    auth: { token },
  });

  socketRef.current = socket;

  const init = async () => {
    try {
      const profileRes = await api.get("/api/buyer/profile");
      if (!isActive) return;

      if (!profileRes.data.success) {
        navigate("/buyer_login");
        return;
      }

      const id = profileRes.data.buyer._id;
      setBuyerId(id);

      // connect first
      socket.on("connect", () => {
        socket.emit("userOnline", {
          userId: id,
          userModel: "Buyer",
        });
      });

      await fetchConversations();
      if (!isActive) return;

      socket.on("newMessageNotification", (data) => {
        console.log("SOCKET DATA:", data);

        setConversations((prev) => {
          const exists = prev.find(
            (c) => String(c.room) === String(data.room)
          );

          if (!exists) {
            fetchConversations();
            return prev;
          }

          return prev.map((c) =>
            String(c.room) === String(data.room)
              ? {
                  ...c,
                  lastMessage: data.message,
                  unreadCount:
                    data.roomUnreadCount ?? data.unreadChatCount ?? 0,
                }
              : c
          );
        });
      });

      socket.on("messagesRead", ({ room }) => {
        setConversations((prev) =>
          prev.map((c) =>
            String(c.room) === String(room)
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      });

      socket.on("conversationDeleted", ({ room }) => {
        setConversations((prev) =>
          prev.filter((c) => String(c.room) !== String(room))
        );
      });

    } catch (err) {
      console.error(err);
    }
  };

  init();

  return () => {
    isActive = false;
    socket.disconnect();
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