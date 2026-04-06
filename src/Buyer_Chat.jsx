import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Buyer_Chat.css";

export const socket = io("https://isonga-backend.onrender.com", {
  transports: ["polling", "websocket"],
});

function Buyer_Chat() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const productContext = location.state || null;

  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // --- NEW: TYPING & DELETE STATES ---
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const emojiRef = useRef();

  const getFileUrl = (path) => {
    if (!path) return "";
    const clean = path.trim().replace(/\\/g, "/");
    return clean.startsWith("http") ? clean : `https://isonga-backend.onrender.com/${clean.replace(/^\/+/, "")}`;
  };

  // 1. INITIAL LOAD
  useEffect(() => {
    const loadChat = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/buyer_login"); return; }
      try {
        const buyerRes = await api.get("/api/buyer_dashboard");
        const buyerData = buyerRes.data.buyer;
        setBuyer(buyerData);

        const sellerRes = await api.get(`/api/get_seller/${sellerId}`);
        if (sellerRes.data.success) setSeller(sellerRes.data.seller);

        const room = `Buyer_${buyerData._id}__Seller_${sellerId}`;

        socket.emit("joinRoom", {
          senderId: buyerData._id,
          senderModel: "Buyer",
          receiverId: sellerId,
          receiverModel: "Seller"
        });

        const msgRes = await api.get(`/api/messages/${room}`);
        if (msgRes.data.success) setMessages(msgRes.data.messages);

        await api.put(`/api/messages/read/${room}`);
        socket.emit("messagesRead", { room });
      } catch (err) { console.error("Error loading chat:", err); }
    };
    loadChat();
  }, [sellerId, navigate]);

  // 2. SOCKET LISTENERS
  useEffect(() => {
    const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;

    socket.on("receiveMessage", (msg) => {
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderModel === "Seller") {
          api.put(`/api/messages/read/${room}`).then(() => socket.emit("messagesRead", { room }));
        }
      }
    });

    socket.on("messagesRead", (data) => {
      if (data.room === room) {
        setMessages(prev => prev.map(m => !m.read ? { ...m, read: true } : m));
      }
    });

    // --- TYPING LISTENERS ---
    socket.on("displayTyping", (data) => {
      if (data.room === room) setPartnerTyping(true);
    });

    socket.on("stopTyping", (data) => {
      if (data.room === room) setPartnerTyping(false);
    });

    // --- DELETE LISTENER ---
    socket.on("messageDeleted", (data) => {
      if (data.room === room) {
        setMessages(prev => prev.filter(m => m._id !== data.messageId));
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messagesRead");
      socket.off("displayTyping");
      socket.off("stopTyping");
      socket.off("messageDeleted");
    };
  }, [buyer, sellerId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, partnerTyping]);

  // --- NEW: TYPING HANDLER ---
  const handleTextChange = (e) => {
    setText(e.target.value);
    const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { room, senderId: buyer?._id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stopTyping", { room });
    }, 2000);
  };

  // --- NEW: DELETE HANDLER ---
  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      const res = await api.delete(`/api/messages/delete/${messageId}`);
      if (res.data.success) {
        const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;
        socket.emit("deleteMessage", { messageId, room });
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    } catch (err) { console.error("Delete failed", err); }
  };

  const onEmojiClick = (emoji) => {
    setText(prev => prev + emoji.emoji);
    setShowEmoji(false);
  };

  const handleSend = async () => {
    if (!buyer || (!text.trim() && files.length === 0)) return;
    setSending(true);
    const room = `Buyer_${buyer._id}__Seller_${sellerId}`;
    let uploadedFiles = [];
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));
        const uploadRes = await api.post("/api/chat/upload", formData);
        if (uploadRes.data.success) uploadedFiles = uploadRes.data.files;
      }

      socket.emit("sendMessage", {
        sender: buyer._id,
        senderModel: "Buyer",
        receiver: sellerId,
        receiverModel: "Seller",
        message: text,
        files: uploadedFiles,
        productId: productContext?.productId,
        replyTo: replyTo ? replyTo._id : null,
        room
      });

      setText(""); setFiles([]); setReplyTo(null);
      // Stop typing status on send
      socket.emit("stopTyping", { room });
      setIsTyping(false);
    } catch (err) { console.log(err); }
    setSending(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/BuyerConversations">←</Link>
        <div className="chat-header-info">
            <h3>{seller?.name || "Loading..."}</h3>
            {partnerTyping && <span className="typing-indicator">typing...</span>}
        </div>
      </div>

      {productContext && (
        <div className="product-context-bar">
          <img src={getFileUrl(productContext.productImage)} alt="Context" />
          <div className="context-info">
            <strong>{productContext.productName}</strong>
            <p>{productContext.productPrice} Rwf</p>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;
          return (
            <div key={i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">
                <div className="bubble" onDoubleClick={() => setReplyTo(msg)}>
                  {/* DELETE BUTTON */}
                  {isMe && (
                    <button className="msg-delete-btn" onClick={() => deleteMessage(msg._id)}>×</button>
                  )}
                  
                  {msg.replyTo && (
                    <div className="quoted-msg">
                      <small>{msg.replyTo.sender === buyer?._id ? "You" : seller?.name}</small>
                      <p>{msg.replyTo.message || "📷 Media"}</p>
                    </div>
                  )}

                  {msg.productId && (
                    <div className="msg-product-tag">
                      <p>Inquiry: <strong>{msg.productId.name}</strong></p>
                    </div>
                  )}
                  
                  {msg.message && <p className="text">{msg.message}</p>}
                  
                  {msg.files?.map((file, idx) => (
                    <img key={idx} src={getFileUrl(file)} className="chat-image" alt="" onClick={() => setZoomImage(getFileUrl(file))} />
                  ))}

                  <div className="msg-info">
                    <span className="time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMe && <span className={`read-status ${msg.read ? "read" : ""}`}>{msg.read ? " ✓✓" : " ✓"}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef}></div>
      </div>

      {replyTo && (
        <div className="reply-input-preview">
          <div className="reply-preview-content">
            <span className="reply-user">{replyTo.sender === buyer?._id ? "You" : seller?.name}</span>
            <p className="reply-text">{replyTo.message || "Media attachment"}</p>
          </div>
          <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      <div className="chat-input">
        <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setFiles(Array.from(e.target.files))} />
        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <textarea 
          value={text} 
          placeholder="Type message..." 
          onChange={handleTextChange} 
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
        />
        <button onClick={handleSend} disabled={sending} className="send-btn">{sending ? "..." : "➤"}</button>
      </div>

      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="" />
        </div>
      )}
    </div>
  );
}

export default Buyer_Chat;