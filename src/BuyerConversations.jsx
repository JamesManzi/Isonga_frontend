import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { io } from "socket.io-client";
import "./BuyerConversations.css";

const BACKEND_URL = "https://api.isongamarket.com";

function BuyerConversations() {
  const [buyerId, setBuyerId] = useState("");
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0); // Added state

  const navigate = useNavigate();
  const socketRef = useRef(null);

  // =========================
  // MISSING FUNCTION FIXED
  // =========================
  const fetchUnreadMessageCount = async () => {
    try {
      const res = await api.get("/api/messages/unread-count");
      if (res.data.success) {
        setUnreadChatCount(res.data.count);
      }
    } catch (err) {
      console.error("Error fetching message count:", err);
    }
  };

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
        // CHANGED: Using buyer_dashboard route because /buyer/profile was 404
        const profileRes = await api.get("/api/buyer_dashboard");
        if (!isActive) return;

        if (!profileRes.data.success) {
          navigate("/buyer_login");
          return;
        }

        const id = profileRes.data.buyer._id;
        setBuyerId(id);

        socket.on("connect", () => {
          socket.emit("userOnline", {
            userId: id,
            userModel: "Buyer",
          });
        });

        await fetchConversations();
        await fetchUnreadMessageCount(); // Call the fixed function

        socket.on("newMessageNotification", (data) => {
          if (data.unreadChatCount !== undefined) {
            setUnreadChatCount(data.unreadChatCount);
          }
          
          setConversations((prev) => {
            const exists = prev.find((c) => String(c.room) === String(data.room));
            if (!exists) {
              fetchConversations();
              return prev;
            }
            return prev.map((c) =>
              String(c.room) === String(data.room)
                ? {
                    ...c,
                    lastMessage: data.message,
                    unreadCount: data.roomUnreadCount ?? data.unreadChatCount ?? 0,
                    updatedAt: new Date().toISOString()
                  }
                : c
            );
          });
        });

        // Rest of your socket listeners...
        socket.on("messagesRead", ({ room }) => {
          setConversations((prev) =>
            prev.map((c) => (String(c.room) === String(room) ? { ...c, unreadCount: 0 } : c))
          );
          fetchUnreadMessageCount();
        });

      } catch (err) {
        console.error("Init Error:", err);
      }
    };

    init();

    return () => {
      isActive = false;
      socket.disconnect();
    };
  }, [navigate]);

  // Actions...
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
    setConversations((prev) => prev.filter((c) => String(c.room) !== String(room)));
    socketRef.current?.emit("deleteConversation", { room });
  };

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
        <h2>Messages {unreadChatCount > 0 && `(${unreadChatCount})`}</h2>
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
            <div key={chat.room} className="chat-item" onClick={() => openChat(chat)}>
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
              <button className="delete-btn" onClick={(e) => handleDelete(e, chat.room)}>🗑</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BuyerConversations;