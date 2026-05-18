import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Buyer_Chat.css";

// Singleton socket variable initialized safely
let socket;

function Buyer_Chat() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Keep Original Logic: Get product info from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const pName = queryParams.get("productName");
  const pImage = queryParams.get("productImage");
  const pPrice = queryParams.get("productPrice");

  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
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

  // Establish production-safe socket initialization
  if (!socket) {
    socket = io("https://api.isongamarket.com", {
      transports: ["polling", "websocket"],
      auth: {
        token: localStorage.getItem("token")
      }
    });
  }

  // =========================
  // EMOJI & UTILS
  // =========================
  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const getFileUrl = (path) => {
    if (!path) return "";
    const clean = path.trim().replace(/\\/g, "/");
    return clean.startsWith("http")
      ? clean
      : `https://api.isongamarket.com/${clean.replace(/^\/+/, "")}`;
  };

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  // =========================
  // LOAD CHAT
  // =========================
  useEffect(() => {
    const loadChat = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/buyer_login");

      try {
        const buyerRes = await api.get("/api/buyer_dashboard");
        const buyerData = buyerRes.data.buyer;
        setBuyer(buyerData);

        const sellerRes = await api.get(`/api/get_seller/${sellerId}`);
        if (sellerRes.data.success) setSeller(sellerRes.data.seller);

        const room = `Buyer_${buyerData._id}__Seller_${sellerId}`;

        socket.emit("userOnline", { userModel: "Buyer" });

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
        console.error(err);
      }
    };

    loadChat();
  }, [sellerId, navigate]);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    if (!buyer || !sellerId) return;

    const room = `Buyer_${buyer._id}__Seller_${sellerId}`;

    const handleReceive = (msg) => {
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleRead = (data) => {
      if (data.room === room) {
        setMessages(prev =>
          prev.map(m => !m.read ? { ...m, read: true } : m)
        );
      }
    };

    const handleTyping = (data) => {
      if (data.senderId !== buyer._id && data.room === room) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.room === room) setIsTyping(false);
    };

    const handleDelete = (data) => {
      if (data.room !== room) return;
      setMessages(prev =>
        prev.map(msg => {
          if (msg._id === data.messageId) {
            if (data.forEveryone) {
              return {
                ...msg,
                message: "This message was deleted",
                files: [],
                isSystemDeleted: true
              };
            }
            if (data.userId === buyer._id) return null;
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
  }, [buyer, sellerId]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // =========================
  // SEND MESSAGE
  // =========================
  const handleSend = async () => {
    if (!buyer || (!text.trim() && files.length === 0 && !pName)) return;

    setSending(true);
    let uploadedFiles = [];

    try {
      // Fixed: Send using multipart/form-data config
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append("files", f));

        const res = await api.post("/api/chat/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (res.data.success) uploadedFiles = res.data.files;
      }

      const room = `Buyer_${buyer._id}__Seller_${sellerId}`;

      let finalMessage = text;
      if (pName) {
        const productDetails = ` PRODUCT INQUIRY:\nName: ${decodeURIComponent(pName)}\nPrice: ${pPrice} Rwf\n\n`;
        finalMessage = productDetails + text;

        if (pImage) {
          uploadedFiles.unshift(decodeURIComponent(pImage));
        }

        navigate(location.pathname, { replace: true });
      }

      socket.emit("sendMessage", {
        sender: buyer._id,
        senderModel: "Buyer",
        receiver: sellerId,
        receiverModel: "Seller",
        message: finalMessage,
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
      console.error("Error uploading or sending message:", err);
    }

    setSending(false);
  };

  const handleDeleteMessage = (id, forEveryone) => {
    if (!buyer) return;
    socket.emit("deleteMessage", {
      messageId: id,
      room: `Buyer_${buyer._id}__Seller_${sellerId}`,
      forEveryone
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/BuyerConversations">←</Link>
        <div className="header-user-info">
          <img src={getFileUrl(seller?.profile)} className="header-img" alt="" />
          <h3>{seller?.name || "Loading..."}</h3>
        </div>
      </div>

      {pName && (
        <div className="product-context-header">
          <div className="context-card">
            <img
              src={getFileUrl(decodeURIComponent(pImage))}
              className="context-thumbnail"
              alt=""
            />
            <div>
              <p>Inquiring about:</p>
              <h4>{decodeURIComponent(pName)}</h4>
              <span>{pPrice} Rwf</span>
            </div>
          </div>
        </div>
      )}

      {replyTo && (
        <div className="reply-preview">
          <p>Replying to: {replyTo.message || "Media"}</p>
          <button onClick={() => setReplyTo(null)}>✖</button>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;
          const isDeleted = msg.message === "This message was deleted";

          return (
            <div key={msg._id || i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">
                <div
                  className="bubble"
                  onDoubleClick={() => !isDeleted && setReplyTo(msg)}
                >
                  {msg.replyTo && !isDeleted && (
                    <div className="quoted-msg">
                      <p>{msg.replyTo.message || "Media"}</p>
                    </div>
                  )}

                  <p style={isDeleted ? { fontStyle: "italic", color: "#999" } : { whiteSpace: "pre-wrap" }}>
                    {msg.message}
                  </p>

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
                    {isMe && !isDeleted && (
                      <span className={`read-status ${msg.read ? "read" : ""}`}>
                        {msg.read ? " ✓✓" : " ✓"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="message-actions">
                  {!isDeleted && (
                    <button onClick={() => setReplyTo(msg)}>Reply</button>
                  )}
                  
                  <button onClick={() => handleDeleteMessage(msg._id, false)}>
                    Delete
                  </button>

                  {isMe && !isDeleted && (
                    <button onClick={() => handleDeleteMessage(msg._id, true)}>
                      All
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
        <div className="typing-indicator">
          {seller?.name} is typing...
        </div>
      )}

      {/* Added File Uploading Banner Preview */}
      {files.length > 0 && (
        <div className="file-upload-preview" style={{ padding: "8px 12px", background: "#f1f1f1", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #ddd" }}>
          {files.map((file, i) => (
            <span key={i} style={{ fontSize: "12px", background: "#e0e0e0", padding: "4px 8px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              📄 {file.name.length > 20 ? `${file.name.substring(0, 17)}...` : file.name}
            </span>
          ))}
          <button 
            onClick={() => { setFiles([]); if(fileInputRef.current) fileInputRef.current.value = ""; }} 
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#ff4d4d", fontWeight: "bold", cursor: "pointer" }}
          >
            Clear Files
          </button>
        </div>
      )}

      <div className="chat-input">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <textarea
          value={text}
          placeholder="Type message..."
          onChange={(e) => {
            setText(e.target.value);
            if (!buyer) return;
            
            const room = `Buyer_${buyer._id}__Seller_${sellerId}`;
            socket.emit("typing", { room, senderId: buyer._id });

            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
              socket.emit("stopTyping", { room });
            }, 2000);
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

export default Buyer_Chat;