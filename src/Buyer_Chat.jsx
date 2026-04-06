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
  
  // Get product info passed from View_Products.js
  const productContext = location.state || null;

  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  
  // --- NEW: REPLY STATE ---
  const [replyTo, setReplyTo] = useState(null);

  const [zoomImage, setZoomImage] = useState(null);

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const emojiRef = useRef();

  // Helper for file URLs
  const getFileUrl = (path) => {
    if (!path) return "";
    const clean = path.trim().replace(/\\/g, "/");
    return clean.startsWith("http")
      ? clean
      : `https://isonga-backend.onrender.com/${clean.replace(/^\/+/, "")}`;
  };

  // 1. INITIAL LOAD & JOIN ROOM
  useEffect(() => {
    const loadChat = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/buyer_login");
        return;
      }
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

      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };
    loadChat();
  }, [sellerId, navigate]);

  // 2. SOCKET LISTENERS
  useEffect(() => {
    const handleReceive = async (msg) => {
      const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);

        if (msg.senderModel === "Seller") {
          try {
            await api.put(`/api/messages/read/${room}`, {});
            socket.emit("messagesRead", { room });
          } catch (err) {
            console.error("Read update error:", err);
          }
        }
      }
    };

    const handleMessagesRead = (data) => {
      const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;
      if (data.room === room) {
        setMessages((prev) => 
          prev.map((msg) => (msg.read === false ? { ...msg, read: true } : msg))
        );
      }
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [buyer, sellerId]);

  // AUTO SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // HANDLERS
  const onEmojiClick = (emoji) => {
    setText(prev => prev + emoji.emoji);
    setShowEmoji(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!buyer || (!text.trim() && files.length === 0)) return;
    setSending(true);
    let uploadedFiles = [];
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));
        const uploadRes = await api.post("/api/chat/upload", formData);
        if (uploadRes.data.success) uploadedFiles = uploadRes.data.files;
      }

      const room = `Buyer_${buyer._id}__Seller_${sellerId}`;
      socket.emit("sendMessage", {
        sender: buyer._id,
        senderModel: "Buyer",
        receiver: sellerId,
        receiverModel: "Seller",
        message: text,
        files: uploadedFiles,
        productId: productContext?.productId,
        replyTo: replyTo ? replyTo._id : null, // --- ATTACH REPLY ID ---
        room
      });

      setText(""); 
      setFiles([]);
      setReplyTo(null); // --- CLEAR REPLY PREVIEW ---
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.log(err);
    }
    setSending(false);
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">
        <Link to="/BuyerConversations">←</Link>
        <h3>{seller?.name || "Loading..."}</h3>
      </div>

      {/* PRODUCT CONTEXT BAR */}
      {productContext && (
        <div className="product-context-bar">
          <img src={getFileUrl(productContext.productImage)} alt="Context" />
          <div className="context-info">
            <strong>{productContext.productName}</strong>
            <p>{productContext.productPrice} Rwf</p>
            <span>{productContext.productLocation}</span>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;
          return (
            <div key={i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">
                <div className="bubble" onDoubleClick={() => setReplyTo(msg)}>
                  
                  {/* --- DISPLAY QUOTED MESSAGE --- */}
                  {msg.replyTo && (
                    <div className="quoted-msg">
                      <small>{msg.replyTo.sender === buyer?._id ? "You" : seller?.name}</small>
                      <p>{msg.replyTo.message || "📷 Media"}</p>
                    </div>
                  )}

                  {msg.productId && (
                    <div className="msg-product-tag">
                      <p>Product Inquiry: <strong>{msg.productId.name}</strong></p>
                    </div>
                  )}
                  
                  {msg.message && <p className="text">{msg.message}</p>}
                  
                  {msg.files && msg.files.map((file, index) => {
                    const url = getFileUrl(file);
                    return <img key={index} src={url} className="chat-image" alt="" onClick={() => setZoomImage(url)} />;
                  })}

                  <div className="msg-info">
                    <span className="time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMe && <span className={`read-status ${msg.read ? "read" : ""}`}>{msg.read ? " ✓✓" : " ✓"}</span>}
                  </div>
                </div>

                {/* --- REPLY ICON (WhatsApp Style) --- */}
                <button className="reply-btn-icon" onClick={() => setReplyTo(msg)}>
                  <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 5V1L3 9l9 8v-4.2c6.5 0 9 3.9 10 8-1-6.1-4-11.8-10-11.8z"></path></svg>
                </button>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef}></div>
      </div>

      {/* FILE PREVIEW */}
      {files.length > 0 && <div className="preview-container">
        {files.map((file, index) => (
          <div key={index} className="preview-item">
            <img src={URL.createObjectURL(file)} alt="" />
            <button type="button" onClick={() => removeFile(index)}>✕</button>
          </div>
        ))}
      </div>}

      {/* --- REPLY INPUT PREVIEW (Above text area) --- */}
      {replyTo && (
        <div className="reply-input-preview">
          <div className="reply-preview-content">
            <span className="reply-user">{replyTo.sender === buyer?._id ? "You" : seller?.name}</span>
            <p className="reply-text">{replyTo.message || "Media attachment"}</p>
          </div>
          <button className="close-reply-btn" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* INPUT AREA */}
      <div className="chat-input">
        <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} />
        <button type="button" onClick={() => fileInputRef.current.click()}>📎</button>
        <button type="button" onClick={() => setShowEmoji(prev => !prev)}>😊</button>
        <textarea 
          value={text} 
          placeholder="Type message..." 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
        />
        <button onClick={handleSend} disabled={sending} className="send-btn">{sending ? "..." : "➤"}</button>
      </div>

      {showEmoji && <div className="emoji-box" ref={emojiRef}><Picker onEmojiClick={onEmojiClick} /></div>}

      {/* LIGHTBOX */}
      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <div className="lightbox-content"><img src={zoomImage} alt="" /></div>
        </div>
      )}
    </div>
  );
}

export default Buyer_Chat;