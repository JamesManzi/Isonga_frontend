import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Seller_Chat.css";

// ✅ Token is sent via auth handshake
export const socket = io("https://isonga-backend.onrender.com", {
  transports: ["polling", "websocket"],
  auth: {
    token: localStorage.getItem("token")
  }
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

  const [replyTo, setReplyTo] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false); 

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const typingTimeout = useRef(null);

  const getFileUrl = (path) => {
    if (!path) return "";
    const clean = path.trim().replace(/\\/g, "/");
    return clean.startsWith("http")
      ? clean
      : `https://isonga-backend.onrender.com/${clean.replace(/^\/+/, "")}`;
  };

  // =========================
  // LOAD CHAT
  // =========================
  useEffect(() => {
    const loadChat = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        const sellerRes = await api.get("/api/dashboard");
        if (!sellerRes.data.success) return;

        const sellerData = sellerRes.data.seller;
        setSeller(sellerData);

        const buyerRes = await api.get(`/api/get_buyer/${buyerId}`);
        if (buyerRes.data.success) setBuyer(buyerRes.data.buyer);

        const room = `Buyer_${buyerId}__Seller_${sellerData._id}`;

        socket.emit("userOnline", { userModel: "Seller" });

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

      } catch (err) {
        console.error(err);
      }
    };

    loadChat();
  }, [buyerId, navigate]);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    if (!seller) return;
    const room = `Buyer_${buyerId}__Seller_${seller._id}`;

    const handleReceive = (msg) => {
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleRead = (data) => {
      if (data.room === room) {
        setMessages(prev =>
          prev.map(m => m.read === false ? { ...m, read: true } : m)
        );
      }
    };

    const handleTyping = (data) => {
      if (data.senderId !== seller._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = () => {
      setIsTyping(false);
    };

    const handleDelete = (data) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg._id === data.messageId) {
            // Case 1: Deleted for everyone - replace content with placeholder
            if (data.forEveryone) {
              return { ...msg, message: "This message was deleted", files: [], isSystemDeleted: true };
            }
            // Case 2: Deleted for me - remove from array entirely
            if (data.userId === seller?._id) {
              return null;
            }
          }
          return msg;
        }).filter(Boolean)
      );
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messagesRead", handleRead);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageDeleted", handleDelete);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messagesRead", handleRead);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageDeleted", handleDelete);
    };
  }, [buyerId, seller]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // EMOJI
  // =========================
  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  // =========================
  // SEND MESSAGE
  // =========================
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
        replyTo: replyTo?._id || null,
        room
      });

      setText("");
      setFiles([]);
      setReplyTo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      socket.emit("stopTyping", { room });

    } catch (err) {
      console.error(err);
    }

    setSending(false);
  };

  const handleDeleteMessage = (id, forEveryone) => {
    socket.emit("deleteMessage", {
      messageId: id,
      room: `Buyer_${buyerId}__Seller_${seller._id}`,
      forEveryone
    });
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
      {/* ✅ Product Context Header for Seller */}
{location.state?.productName && (
  <div className="product-context-header">
    <div className="context-card">
      <img 
        src={getFileUrl(location.state.productImage)} 
        className="context-thumbnail" 
        alt="" 
      />
      <div className="context-text">
        <p className="context-label">Inquiring about:</p>
        <h4>{location.state.productName}</h4>
        <span>{location.state.productPrice} Rwf</span>
      </div>
    </div>
  </div>
)}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === seller?._id;
          const isPlaceholder = msg.message === "This message was deleted";

          return (
            <div key={msg._id || i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">

                <div className="bubble" onDoubleClick={() => !isPlaceholder && setReplyTo(msg)}>

                  {msg.replyTo && !isPlaceholder && (
                    <div className="quoted-msg">
                      <p>{msg.replyTo.message || "Media"}</p>
                    </div>
                  )}

                  {msg.message && (
                    <p style={isPlaceholder ? { fontStyle: "italic", color: "#999" } : {}}>
                      {msg.message}
                    </p>
                  )}

                  {msg.files?.map((file, idx) => (
                    <img
                      key={idx}
                      src={getFileUrl(file)}
                      className="chat-image"
                      onClick={() => setZoomImage(getFileUrl(file))}
                      alt=""
                    />
                  ))}

                  <div className="msg-info">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>

                    {isMe && !isPlaceholder && (
                      <span className={`read-status ${msg.read ? "read" : ""}`}>
                        {msg.read ? " ✓✓" : " ✓"}
                      </span>
                    )}
                  </div>

                </div>

                <div className="message-actions">
                  {/* "Delete Me" stays available to empty the chat of placeholders */}
                  <button onClick={() => handleDeleteMessage(msg._id, false)}>
                    Delete Me
                  </button>

                  {/* "Delete All" only appears if I sent it and it's not already deleted */}
                  {isMe && !isPlaceholder && (
                    <button onClick={() => handleDeleteMessage(msg._id, true)}>
                      Delete All
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {isTyping && (
        <div className="typing-indicator">{buyer?.name} is typing...</div>
      )}

      <div className="chat-input">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />

        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <textarea
          value={text}
          placeholder="Type message..."
          onChange={(e) => {
            setText(e.target.value);
            const room = `Buyer_${buyerId}__Seller_${seller?._id}`;
            
            socket.emit("typing", { 
  room, 
  senderId: seller?._id, 
  senderModel: "Seller" // Good for backend logging
});
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
              socket.emit("stopTyping", { room });
            }, 2000);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button onClick={handleSend} disabled={sending}>
          {sending ? "..." : "➤"}
        </button>
      </div>

      {showEmoji && (
        <div className="emoji-box">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="" />
        </div>
      )}

    </div>
  );
}

export default Seller_Chat;