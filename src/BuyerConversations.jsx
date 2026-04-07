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

  // =========================
  // 1. FETCH FROM CONVERSATIONS API
  // =========================
  const fetchConversations = async () => {
    try {
      const res = await api.get("/api/buyer/conversations");
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 2. SOCKET & INIT SETUP
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/buyer_login");

    // Initialize Socket
    const socket = io(BACKEND_URL, {
      transports: ["polling", "websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    // Initial Data Load
    fetchConversations();

    // Listen for new messages
    socket.on("newMessageNotification", (data) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.room === data.room);
        
        if (index !== -1) {
          // Update existing chat in list
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            lastMessage: data.message,
            updatedAt: data.createdAt,
            unreadCount: data.unreadCount,
          };
          // Re-sort to put latest on top
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // If chat was hidden (deleted) or new, fetch to refresh the list
          fetchConversations();
          return prev;
        }
      });
    });

    // Handle read receipts
    socket.on("messagesRead", ({ room }) => {
      setConversations(prev => 
        prev.map(c => c.room === room ? { ...c, unreadCount: 0 } : c)
      );
    });

    // Sync after a delete is processed by server
    socket.on("conversationDeleted", () => {
      fetchConversations();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate]);

  // =========================
  // 3. DELETE (HIDE) LOGIC
  // =========================
  const handleDelete = (e, room) => {
    e.stopPropagation(); // Don't trigger the navigate to chat
    if (!window.confirm("Delete this conversation?")) return;

    // Optimistic UI: Remove it locally first so it feels instant
    setConversations(prev => prev.filter(c => c.room !== room));

    // Emit to backend to update 'deletedFor' array
    socketRef.current?.emit("deleteConversation", { room });
  };

  // =========================
  // 4. HELPERS & FILTERING
  // =========================
  const getProfileImg = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `${BACKEND_URL}/uploads/${path}`;
  };

  const filteredChats = conversations.filter((chat) =>
    chat.sellerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/buyer_dashboard" className="back-button">←</Link>
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
          <div className="loading-spinner">Loading Conversations...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">No messages found.</div>
        ) : (
          filteredChats.map((chat) => (
            <div 
              key={chat.room} 
              className="chat-item" 
              onClick={() => navigate(`/buyer_chat/${chat.sellerId}`)}
            >
              <div className="avatar">
                <img src={getProfileImg(chat.sellerProfile)} alt={chat.sellerName} />
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
                    <span className="unread-badge">{chat.unreadCount}</span>
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