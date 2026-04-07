import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client";
import "./BuyerConversations.css";

const socket = io("https://isonga-backend.onrender.com", {
  transports: ["polling", "websocket"],
  auth: {
    token: localStorage.getItem("token"), // ✅ send token for socket auth
  },
});

function BuyerConversations() {
  const [buyerId, setBuyerId] = useState("");
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/buyer_login");
        return;
      }

      try {
        const buyerRes = await api.get("/api/buyer_dashboard");

        const buyer = buyerRes.data.buyer;
        setBuyerId(buyer._id);

        // ✅ mark user online
        socket.emit("userOnline", {
          userId: buyer._id,
          userModel: "Buyer",
        });

        // ✅ fetch conversations
        const convRes = await api.get("/api/buyer/conversations");

        if (convRes.data.success) {
          setConversations(convRes.data.conversations);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    if (!buyerId) return;

    // NEW MESSAGE
    const handleNewMessage = (data) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.room === data.room);

        if (index !== -1) {
          const updated = [...prev];

          updated[index] = {
            ...updated[index],
            lastMessage: data.message,
            updatedAt: data.createdAt,
            unreadCount: data.unreadCount,
          };

          return updated.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        }

        return prev;
      });
    };

    // MESSAGES READ
    const handleMessagesRead = ({ room }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.room === room ? { ...c, unreadCount: 0 } : c
        )
      );
    };

    // DELETE CONVERSATION
    const handleConversationDeleted = ({ room }) => {
      setConversations((prev) =>
        prev.filter((c) => c.room !== room)
      );
    };

    socket.on("newMessageNotification", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("conversationDeleted", handleConversationDeleted);

    return () => {
      socket.off("newMessageNotification", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("conversationDeleted", handleConversationDeleted);
    };
  }, [buyerId]);

  // =========================
  // OPEN CHAT
  // =========================
  const openChat = async (chat) => {
    try {
      await api.put(`/api/messages/read/${chat.room}`, {});

      socket.emit("messagesRead", { room: chat.room });

      setConversations((prev) =>
        prev.map((c) =>
          c.room === chat.room ? { ...c, unreadCount: 0 } : c
        )
      );

      navigate(`/buyer_chat/${chat.sellerId}`);
    } catch (err) {
      console.error("Open chat error:", err);
    }
  };

  // =========================
  // DELETE CONVERSATION
  // =========================
  const deleteConversation = (room) => {
    if (!window.confirm("Delete this conversation?")) return;

    socket.emit("deleteConversation", { room });

    // optimistic update
    setConversations((prev) =>
      prev.filter((c) => c.room !== room)
    );
  };

  // =========================
  // FILTER
  // =========================
  const filteredChats = conversations.filter((chat) =>
    chat.sellerName?.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // IMAGE HELPER
  // =========================
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";

    return path.startsWith("http")
      ? path
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">
        <Link to="/buyer_dashboard" className="back-button">
          ←
        </Link>
        <h2>Messages</h2>
      </div>

      {/* SEARCH */}
      <div className="chat-search">
        <input
          type="text"
          placeholder="Search sellers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CHAT LIST */}
      <div className="chat-list">
        {loading ? (
          <div className="loading">Loading Chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">No conversations yet.</div>
        ) : (
          filteredChats.map((chat) => (
            <div key={chat.room} className="chat-item">
              
              {/* AVATAR */}
              <div
                className="avatar"
                onClick={() => openChat(chat)}
              >
                <img
                  src={
                    chat.sellerProfile
                      ? getFileUrl(chat.sellerProfile)
                      : "/placeholder.png"
                  }
                  alt={chat.sellerName}
                />
              </div>

              {/* DETAILS */}
              <div
                className="chat-details"
                onClick={() => openChat(chat)}
              >
                <div className="chat-top">
                  <h4>{chat.sellerName}</h4>
                  <span>
                    {new Date(chat.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="chat-bottom">
                  <p
                    className={
                      chat.unreadCount > 0 ? "unread-text" : ""
                    }
                  >
                    {chat.lastMessage}
                  </p>

                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {/* DELETE BUTTON */}
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(chat.room);
                }}
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