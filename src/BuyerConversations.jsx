import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./BuyerConversations.css";

const socket = io("https://isonga-backend.onrender.com", { withCredentials: true });

function BuyerConversations() {
  const [buyerId, setBuyerId] = useState("");
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const buyerRes = await axios.get("https://isonga-backend.onrender.com/api/buyer_dashboard", { withCredentials: true });
        if (!buyerRes.data.success) return navigate("/buyer_login");
        setBuyerId(buyerRes.data.buyer._id);

        socket.emit("userOnline", { userId: buyerRes.data.buyer._id, userModel: "Buyer" });

        const convRes = await axios.get("https://isonga-backend.onrender.com/api/buyer/conversations", { withCredentials: true });
        if (convRes.data.success) setConversations(convRes.data.conversations);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [navigate]);

  // Real-time updates
  useEffect(() => {
    if (!buyerId) return;

    const handleNewMessage = (data) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.room === data.room);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], lastMessage: data.message, updatedAt: data.createdAt, unreadCount: data.unreadCount };
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
        return prev;
      });
    };

    const handleMessagesRead = ({ room }) => {
      setConversations((prev) =>
        prev.map((c) => (c.room === room ? { ...c, unreadCount: 0 } : c))
      );
    };

    socket.on("newMessageNotification", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("newMessageNotification", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [buyerId]);

  const openChat = async (chat) => {
    try {
      await axios.put(`https://isonga-backend.onrender.com/api/messages/read/${chat.room}`, {}, { withCredentials: true });
      socket.emit("messagesRead", { room: chat.room });

      setConversations((prev) => prev.map((c) => (c.room === chat.room ? { ...c, unreadCount: 0 } : c)));
      navigate(`/buyer_chat/${chat.sellerId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChats = conversations.filter((chat) => chat.sellerName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/buyer_dashboard" className="back-button">←</Link>
        <h2>Messages</h2>
      </div>

      <div className="chat-search">
        <input type="text" placeholder="Search sellers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="chat-list">
        {filteredChats.length === 0 ? <div className="empty-state">No conversations yet.</div> :
          filteredChats.map((chat) => (
            <div key={chat.room} className="chat-item" onClick={() => openChat(chat)}>
              <div className="avatar">
                <img src={chat.sellerProfile ? `https://isonga-backend.onrender.com/uploads/${chat.sellerProfile}` : "/placeholder.png"} alt={chat.sellerName} />
              </div>
              <div className="chat-details">
                <div className="chat-top">
                  <h4>{chat.sellerName}</h4>
                  <span>{new Date(chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="chat-bottom">
                  <p className={chat.unreadCount > 0 ? "unread-text" : ""}>{chat.lastMessage}</p>
                  {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount}</span>}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default BuyerConversations;