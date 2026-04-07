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
  // =========================
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/buyer_login");
      return;
    }

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    // initial load
    fetchConversations();

    // =========================
    // NEW MESSAGE UPDATE
    // =========================
    socket.on("newMessageNotification", (data) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.room === data.room);

        if (!exists) {
          fetchConversations();
          return prev;
        }

        const updated = prev.map((c) =>
          c.room === data.room
            ? {
                ...c,
                lastMessage: data.message,
                updatedAt: data.createdAt,
                unreadCount: data.unreadCount,
              }
            : c
        );

        return updated.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    });

    // =========================
    // READ RECEIPT
    // =========================
    socket.on("messagesRead", ({ room }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.room === room ? { ...c, unreadCount: 0 } : c
        )
      );
    });

    // =========================
    // DELETE SYNC (IMPORTANT FIX)
    // =========================
    socket.on("conversationDeleted", ({ room }) => {
      setConversations((prev) =>
        prev.filter((c) => c.room !== room)
      );
    });

    return () => {
      socket.disconnect();
      mountedRef.current = false;
    };
  }, [navigate]);

  // =========================
  // DELETE CONVERSATION
  // =========================
  const handleDelete = (e, room) => {
    e.stopPropagation();

    if (!window.confirm("Delete this conversation?")) return;

    // instant UI remove
    setConversations((prev) =>
      prev.filter((c) => c.room !== room)
    );

    socketRef.current?.emit("deleteConversation", { room });
  };

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