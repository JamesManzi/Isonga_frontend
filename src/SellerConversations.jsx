import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./SellerConversations.css";

// Initialize socket outside component to prevent multiple connections
const socket = io("https://isonga-backend.onrender.com", {
  withCredentials: true,
  transports: ["websocket"],
});

function SellerConversations() {
  const [sellerId, setSellerId] = useState("");
  const [conversations, setConversations] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch Seller Data and Conversations
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("token");
        if (!token) {
        navigate("/login");
        return;
      }
      try {
        // Fetch seller profile to get ID
        const sellerRes = await axios.get("https://isonga-backend.onrender.com/api/dashboard", 
          {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

        if (!sellerRes.data.success) {
          setLoading(false);
          return navigate("/login");
        }

        const id = sellerRes.data.seller._id;
        setSellerId(id);

        // Identify to Socket server
        socket.emit("userOnline", { userId: id, userModel: "Seller" });

        // Fetch conversation list from backend
        const convRes = await axios.get("https://isonga-backend.onrender.com/api/seller/conversations", { 
          withCredentials: true 
        });

        if (convRes.data.success) {
          setConversations(convRes.data.conversations || []);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // 2. Real-time Listener
  useEffect(() => {
    if (!sellerId) return;

    const handleNewNotification = (data) => {
      // data: { room, message, sender, senderModel, unreadCount }
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.room === data.room);

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: data.message,
            updatedAt: new Date().toISOString(),
            unreadCount: data.unreadCount,
          };
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // If it's a completely new buyer messaging for the first time
          // We trigger a re-fetch to get buyer details (name/profile) from DB
          fetchLatestConversations();
          return prev;
        }
      });
    };

    socket.on("newMessageNotification", handleNewNotification);
    return () => socket.off("newMessageNotification");
  }, [sellerId]);

  const fetchLatestConversations = async () => {
    const res = await axios.get("https://isonga-backend.onrender.com/api/seller/conversations",
      {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    if (res.data.success) setConversations(res.data.conversations);
  };

  // 3. Search logic
  useEffect(() => {
    const filtered = conversations.filter((chat) =>
      chat.buyerName?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [search, conversations]);

  const openChat = async (chat) => {
    try {
      // Mark messages in this room as read
      await axios.put(
        `https://isonga-backend.onrender.com/api/messages/read/${chat.room}`,
        {},
        { withCredentials: true }
      );

      // Navigate to the individual chat page
      // Note: We use buyerId here as the param for the Chat window
      navigate(`/seller_chat/${chat.buyerId}`);
    } catch (error) {
      console.error("Error opening chat:", error);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
const getFileUrl = (path) => {
  if (!path) return "/placeholder.png"; // Fallback if no image exists
  return path.startsWith("http") 
    ? path 
    : `https://isonga-backend.onrender.com/uploads/${path}`;
};
  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/dashboard" className="back-button">←</Link>
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
            <div key={chat.room} className="chat-item" onClick={() => openChat(chat)}>
              <div className="avatar">
                <img
                  src={chat.buyerProfile ? getFileUrl(chat.buyerProfile) : "/placeholder.png"}
                  alt={chat.buyerName}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/50"; }}
                />
              </div>

              <div className="chat-details">
                <div className="chat-top">
                  <h4>{chat.buyerName}</h4>
                  <span className="chat-time">{formatTime(chat.updatedAt)}</span>
                </div>
                <div className="chat-bottom">
                  <p className={chat.unreadCount > 0 ? "unread-text" : ""}>
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
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

export default SellerConversations;