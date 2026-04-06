import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client";
import "./BuyerConversations.css";

const socket = io("https://isonga-backend.onrender.com", {
  withCredentials: false,
  transports: ["polling", "websocket"],
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
        const id = buyerRes.data.buyer._id;

        setBuyerId(id);

        socket.emit("userOnline", {
          userId: id,
          userModel: "Buyer",
        });

        const convRes = await api.get("/api/buyer/conversations");

        if (convRes.data.success) {
          setConversations(convRes.data.conversations);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // =========================
  // REAL-TIME EVENTS
  // =========================
  useEffect(() => {
    if (!buyerId) return;

    // NEW MESSAGE UPDATE
    const handleNewMessage = (data) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.room === data.room);

        if (index === -1) return prev;

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
      });
    };

    // MARK AS READ
    const handleMessagesRead = ({ room }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.room === room ? { ...c, unreadCount: 0 } : c
        )
      );
    };

    // 🚨 DELETE CONVERSATION (NEW)
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
      await api.put(`/api/messages/read/${chat.room}`);

      socket.emit("messagesRead", { room: chat.room });

      setConversations((prev) =>
        prev.map((c) =>
          c.room === chat.room
            ? { ...c, unreadCount: 0 }
            : c
        )
      );

      navigate(`/buyer_chat/${chat.sellerId}`);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // DELETE CHAT (MATCHES BACKEND SOCKET)
  // =========================
  const deleteChat = (e, room) => {
    e.stopPropagation();

    socket.emit("deleteConversation", { room });

    setConversations((prev) =>
      prev.filter((c) => c.room !== room)
    );
  };

  // =========================
  // SEARCH FILTER
  // =========================
  const filteredChats = conversations.filter((chat) =>
    chat.sellerName
      ?.toLowerCase()
      .includes(search.toLowerCase())
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
          <div className="empty-state">
            No conversations yet.
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.room}
              className="chat-item"
              onClick={() => openChat(chat)}
            >
              {/* DELETE BUTTON */}
              <button
                className="delete-btn"
                onClick={(e) => deleteChat(e, chat.room)}
              >
                Delete
              </button>

              <div className="avatar">
                <img
                  src={
                    chat.sellerProfile
                      ? getFileUrl(chat.sellerProfile)
                      : "/placeholder.png"
                  }
                  alt={chat.sellerName}
                />
              </div>

              <div className="chat-details">
                <div className="chat-top">
                  <h4>{chat.sellerName}</h4>
                  <span>
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
                      chat.unreadCount > 0
                        ? "unread-text"
                        : ""
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BuyerConversations;