import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client";
import "./SellerConversations.css";

const BACKEND_URL = "https://isonga-backend.onrender.com";

function SellerConversations() {
  const [sellerId, setSellerId] = useState("");
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

      const res = await api.get("/api/seller/conversations");

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
    if (!token) return navigate("/login");

    const init = async () => {
      try {
        // GET SELLER
        const sellerRes = await api.get("/api/dashboard");
        if (!sellerRes.data.success) return navigate("/login");

        const id = sellerRes.data.seller._id;
        setSellerId(id);

        // LOAD DATA FIRST
        await fetchConversations();

        // SOCKET INIT
        const socket = io(BACKEND_URL, {
          transports: ["websocket"],
          auth: { token },
        });

        socketRef.current = socket;

        socket.emit("userOnline", {
          userId: id,
          userModel: "Seller",
        });

        // =========================
        // NEW MESSAGE
        // =========================
        socket.on("newMessageNotification", (data) => {
          setConversations((prev) => {
            const exists = prev.find((c) => c.room === data.room);

            if (!exists) {
              fetchConversations();
              return prev;
            }

            return prev
              .map((c) =>
                c.room === data.room
                  ? {
                      ...c,
                      lastMessage: data.message,
                      updatedAt: data.createdAt,
                      unreadCount: data.unreadCount,
                    }
                  : c
              )
              .sort(
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
        // DELETE SYNC
        // =========================
        socket.on("conversationDeleted", ({ room }) => {
          setConversations((prev) =>
            prev.filter((c) => c.room !== room)
          );
        });

      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    init();

    return () => {
      socketRef.current?.off("newMessageNotification");
      socketRef.current?.off("messagesRead");
      socketRef.current?.off("conversationDeleted");

      socketRef.current?.disconnect();
      socketRef.current = null;

      mountedRef.current = false;
    };
  }, [navigate]);

  // =========================
  // SEARCH
  // =========================
  const filteredChats = conversations.filter((chat) =>
    chat.buyerName?.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // OPEN CHAT
  // =========================
  const openChat = async (chat) => {
    try {
      await api.put(`/api/messages/read/${chat.room}`);
      navigate(`/seller_chat/${chat.buyerId}`);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // DELETE CONVERSATION
  // =========================
  const handleDelete = (e, room) => {
    e.stopPropagation();

    if (!window.confirm("Delete this conversation?")) return;

    // instant UI update
    setConversations((prev) =>
      prev.filter((c) => c.room !== room)
    );

    socketRef.current?.emit("deleteConversation", { room });
  };

  // =========================
  // HELPERS
  // =========================
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http")
      ? path
      : `${BACKEND_URL}/uploads/${path}`;
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/dashboard" className="back-button">
          ←
        </Link>
        <h2>Messages</h2>
      </div>

      <div className="chat-search">
        <input
          type="text"
          placeholder="Search buyers..."
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
                  src={
                    chat.buyerProfile
                      ? getFileUrl(chat.buyerProfile)
                      : "/placeholder.png"
                  }
                  alt={chat.buyerName}
                />
              </div>

              <div className="chat-details">
                <div className="chat-top">
                  <h4>{chat.buyerName}</h4>
                  <span className="chat-time">
                    {formatTime(chat.updatedAt)}
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

              {/* ✅ DELETE BUTTON (NOW INCLUDED LIKE BUYER) */}
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

export default SellerConversations;