import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Added useNavigate
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Seller_Chat.css";

export const socket = io("https://isonga-backend.onrender.com", {
  transports: ["polling", "websocket"],
});

function Seller_Chat() {
  const { buyerId } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [buyer, setBuyer] = useState(null);
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

  const getFileUrl = (path) => {
    if (!path) return "";
    const clean = path.trim().replace(/\\/g, "/");
    return clean.startsWith("http")
      ? clean
      : `https://isonga-backend.onrender.com/${clean.replace(/^\/+/, "")}`;
  };

  // 1. LOAD DATA
  useEffect(() => {
    const loadChat = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const sellerRes = await api.get("/api/dashboard");
        if (!sellerRes.data.success) return;
        const sellerData = sellerRes.data.seller;
        setSeller(sellerData);

        const buyerRes = await api.get(`/api/get_buyer/${buyerId}`);
        if (buyerRes.data.success) setBuyer(buyerRes.data.buyer);

        const room = `Buyer_${buyerId}__Seller_${sellerData._id}`;
        socket.emit("joinRoom", {
          senderId: sellerData._id,
          senderModel: "Seller",
          receiverId: buyerId,
          receiverModel: "Buyer"
        });

        const msgRes = await api.get(`/api/messages/${room}`);
        if (msgRes.data.success) setMessages(msgRes.data.messages);

        await api.put(`/api/messages/read/${room}`);
        socket.emit("messagesRead", { room });
      } catch (err) { console.error(err); }
    };
    loadChat();
  }, [buyerId, navigate]);

  // 2. RECEIVE MESSAGE
  useEffect(() => {
    const handleReceiveMessage = async (msg) => {
      const room = `Buyer_${buyerId}__Seller_${seller?._id}`;
      if (msg.room === room) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderModel === "Buyer") {
          try {
            await api.put(`/api/messages/read/${room}`, {});
            socket.emit("messagesRead", { room });
          } catch (err) { console.error(err); }
        }
      }
    };

    const handleMessagesRead = (data) => {
      const room = `Buyer_${buyerId}__Seller_${seller?._id}`;
      if (data.room === room) {
        setMessages((prev) => prev.map((msg) => (msg.read === false ? { ...msg, read: true } : msg)));
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessagesRead);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [buyerId, seller]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!seller || (!text.trim() && files.length === 0)) return;
    setSending(true);
    let uploadedFiles = [];
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append("files", f));
        const res = await api.post("/api/chat/upload", formData);
        if (res.data.success) uploadedFiles = res.data.files;
      }

      const room = `Buyer_${buyerId}__Seller_${seller._id}`;
      socket.emit("sendMessage", {
        sender: seller._id,
        senderModel: "Seller",
        receiver: buyerId,
        receiverModel: "Buyer",
        message: text,
        files: uploadedFiles,
        replyTo: replyTo ? replyTo._id : null, // --- SEND REPLY ID ---
        room
      });

      setText(""); 
      setFiles([]);
      setReplyTo(null); // --- CLEAR REPLY ---
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { console.error(err); }
    setSending(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/SellerConversations">←</Link>
        <div className="header-user-info">
             <img src={getFileUrl(buyer?.profile)} className="header-img" alt="" />
             <h3>{buyer?.name || "Loading..."}</h3>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === seller?._id;
          return (
            <div key={i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">
                <div className="bubble" onDoubleClick={() => setReplyTo(msg)}>
                  
                  {/* --- DISPLAY QUOTED MESSAGE --- */}
                  {msg.replyTo && (
                    <div className="quoted-msg">
                      <small>{msg.replyTo.sender === seller?._id ? "You" : buyer?.name}</small>
                      <p>{msg.replyTo.message || "📷 Media"}</p>
                    </div>
                  )}

                  {/* --- DISPLAY PRODUCT DETAILS --- */}
                  {msg.productId && (
                    <div className="msg-product-tag">
                      <div className="product-tag-flex">
                        <img src={getFileUrl(msg.productId.files?.[0])} alt="" />
                        <div>
                           <p><strong>{msg.productId.name}</strong></p>
                           <span>{msg.productId.price} Rwf</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.message && <p className="text">{msg.message}</p>}

                  {msg.files && msg.files.map((filePath, idx) => {
                    const url = getFileUrl(filePath);
                    const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(filePath);
                    return isVideo ? (
                      <video key={idx} src={url} controls className="chat-video" />
                    ) : (
                      <img key={idx} src={url} className="chat-image" alt="" onClick={() => setZoomImage(url)} />
                    );
                  })}

                  <div className="msg-info">
                    <span className="time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <span className={`read-status ${msg.read ? "read" : ""}`}>{msg.read ? " ✓✓" : " ✓"}</span>}
                  </div>
                </div>

                {/* REPLY ICON */}
                <button className="reply-btn-icon" onClick={() => setReplyTo(msg)}>
                   <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 5V1L3 9l9 8v-4.2c6.5 0 9 3.9 10 8-1-6.1-4-11.8-10-11.8z"></path></svg>
                </button>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* --- REPLY PREVIEW (Above Input) --- */}
      {replyTo && (
        <div className="reply-input-preview">
          <div className="reply-preview-content">
            <span className="reply-user">{replyTo.sender === seller?._id ? "You" : buyer?.name}</span>
            <p className="reply-text">{replyTo.message || "Media attachment"}</p>
          </div>
          <button className="close-reply-btn" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {files.length > 0 && (
        <div className="preview-container">
          {files.map((file, index) => (
            <div key={index} className="preview-item">
              <img src={URL.createObjectURL(file)} alt="" />
              <button type="button" onClick={() => removeFile(index)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input">
        <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} accept="image/*,video/*" onChange={handleFileSelect} />
        <button type="button" onClick={() => fileInputRef.current.click()}>📎</button>
        <button type="button" onClick={() => setShowEmoji(prev => !prev)}>😊</button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type message..."
        />
        <button onClick={handleSend} disabled={sending} className="send-btn">
          {sending ? "..." : "➤"}
        </button>
      </div>

      {showEmoji && <div className="emoji-box" ref={emojiRef}><Picker onEmojiClick={onEmojiClick} /></div>}

      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <div className="lightbox-content"><img src={zoomImage} alt="" /></div>
        </div>
      )}
    </div>
  );
}

export default Seller_Chat;