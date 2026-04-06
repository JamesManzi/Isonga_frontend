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
        productId: productContext?.productId, // Link the message to the product
        room
      });

      setText(""); 
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Optional: Clear product context after first message to prevent tagging every message
      // navigate(location.pathname, { replace: true, state: null });

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

      {productContext && (
  <div className="product-context-bar">
    <img src={getFileUrl(productContext.productImage)} alt="Context" />
    <div className="context-info">
      <strong>{productContext.productName}</strong>
      <p>{productContext.productPrice} Rwf</p> {/* Added Price */}
      <span>{productContext.productLocation}</span> {/* Added Location */}
    </div>
  </div>
)}

      {/* MESSAGES AREA */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;
          return (
            <div key={i} className={`message ${isMe ? "sent" : "received"}`}>
              <div className="bubble">
                {/* SHOW PRODUCT TAG IN THE BUBBLE IF IT EXISTS */}
                {msg.productId && (
                  <div className="msg-product-tag">
                    <p>Product Inquiry: <strong>{msg.productId.name}</strong></p>
                  </div>
                )}
                
                {msg.message && <p>{msg.message}</p>}
                
                {msg.files && msg.files.map((file, index) => {
                  const url = getFileUrl(file);
                  const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(file);
                  return isVideo ? (
                    <video key={index} src={url} controls className="chat-video" />
                  ) : (
                    <img
                      key={index}
                      src={url}
                      className="chat-image"
                      alt="attachment"
                      onClick={() => setZoomImage(url)}
                    />
                  );
                })}

                <div className="msg-info">
                  <span className="time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMe && (
                    <span className={`read-status ${msg.read ? "read" : ""}`}>
                      {msg.read ? " ✓✓" : " ✓"}
                    </span>
                  )}
                </div>
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
            {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt="" /> : <video src={URL.createObjectURL(file)} controls />}
            <button type="button" onClick={() => removeFile(index)}>✕</button>
          </div>
        ))}
      </div>}

      {/* EMOJI BOX */}
      {showEmoji && (
        <div className="emoji-box" ref={emojiRef}>
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* INPUT AREA */}
      <div className="chat-input">
        <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} accept="image/*,video/*" onChange={handleFileSelect} />
        <button type="button" onClick={() => fileInputRef.current.click()}>📎</button>
        <button type="button" onClick={() => setShowEmoji(prev => !prev)}>😊</button>
        <textarea 
          value={text} 
          placeholder="Type message..." 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
        />
        <button onClick={handleSend} disabled={sending} className="send-btn">
          {sending ? "..." : "➤"}
        </button>
      </div>

      {/* LIGHTBOX */}
      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={zoomImage} alt="Zoomed" />
            <button className="close-lightbox" onClick={() => setZoomImage(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Buyer_Chat;