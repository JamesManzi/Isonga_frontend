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

        // KEEP THIS SIMPLE (IMPORTANT)
        socket.emit("userOnline", {
          userId: id,
          userModel: "Buyer",
        });

        const convRes = await api.get("/api/buyer/conversations");

        console.log("CONVERSATIONS:", convRes.data);

        if (convRes.data.success) {
          setConversations(convRes.data.conversations || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!buyerId) return;

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

    socket.on("newMessageNotification", handleNewMessage);

    return () => {
      socket.off("newMessageNotification", handleNewMessage);
    };
  }, [buyerId]);

  const filteredChats = conversations.filter((chat) =>
    chat.sellerName?.toLowerCase().includes(search.toLowerCase())
  );

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http")
      ? path
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

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
          <div className="loading">Loading Chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">No conversations yet.</div>
        ) : (
          filteredChats.map((chat) => (
            <div key={chat.room} className="chat-item">
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
                </div>

                <div className="chat-bottom">
                  <p>{chat.lastMessage}</p>
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