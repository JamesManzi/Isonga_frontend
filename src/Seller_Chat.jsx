import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Seller_Chat.css";

// Singleton socket variable initialized safely
let socket;

function Seller_Chat() {
  const { buyerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [seller, setSeller] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // Will store chosen image files
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);

  const [replyTo, setReplyTo] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const typingTimeout = useRef(null);

  // Safely initialize the socket instance with fresh token access
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
      if (!token) return navigate("/login");

      try {
        const sellerRes = await api.get("/api/dashboard");
        if (!sellerRes.data.success) return;

        const sellerData = sellerRes.data.seller;
        setSeller(sellerData);

        const buyerRes = await api.get(`/api/get_buyer/${buyerId}`);
        if (buyerRes.data.success) setBuyer(buyerRes.data.buyer);

        const room = `Buyer_${buyerId}__Seller_${sellerData._id}`;

        const joinChat = () => {
          socket.emit("userOnline", { userModel: "Seller", userId: sellerData._id });
          socket.emit("joinRoom", {
            senderId: sellerData._id,
            senderModel: "Seller",
            receiverId: buyerId,
            receiverModel: "Buyer"
          });
          socket.emit("messagesRead", { room });
        };

        if (socket.connected) {
          joinChat();
        } else {
          socket.once("connect", joinChat);
        }

        const msgRes = await api.get(`/api/messages/${room}`);
        if (msgRes.data.success) setMessages(msgRes.data.messages);

        await api.put(`/api/messages/read/${room}`);

      } catch (err) {
        console.error("Load Chat Error:", err);
      }
    };

    loadChat();
    
    return () => {
      socket.off("connect");
    };
  }, [buyerId, navigate]);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    if (!seller || !buyerId) return;

    const room = `Buyer_${buyerId}__Seller_${seller._id}`;

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
      if (data.senderId !== seller._id && data.room === room) {
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
            if (data.userId === seller._id) return null;
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
  }, [messages, isTyping]);

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

        const res = await api.post("/api/chat/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
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
    if (!seller) return;
    socket.emit("deleteMessage", {
      messageId: id,
      room: `Buyer_${buyerId}__Seller_${seller._id}`,
      forEveryone
    });
  };

  // Appends multi-file batches and clears the input cache safely
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length !== selectedFiles.length) {
      alert("Only image files are allowed.");
    }
    
    setFiles(prevFiles => [...prevFiles, ...imageFiles]);

    if (e.target) {
      e.target.value = "";
    }
  };

  // Function to remove a single image from selection before sending
  const removeSelectedFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(updatedFiles);
    if (updatedFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

      {location.state?.productName && (
        <div className="product-context-header">
          <div className="context-card">
            <img 
              src={getFileUrl(location.state.productImage)} 
              className="context-thumbnail" 
              alt="" 
            />
            <div className="context-text">
              <p>Inquiring about:</p>
              <h4>{location.state.productName}</h4>
              <span>{location.state.productPrice} Rwf</span>
            </div>
          </div>
        </div>
      )}

      {replyTo && (
        <div className="reply-preview">
          <p>Replying to: {replyTo.message || "📎 Media"}</p>
          <button onClick={() => setReplyTo(null)}>✖</button>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === seller?._id;
          const isDeleted = msg.message === "This message was deleted";

          return (
            <div key={msg._id || i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">
                <div className="bubble" onDoubleClick={() => !isDeleted && setReplyTo(msg)}>
                  
                  {msg.productId && (
                    <div className="product-in-chat">
                      <img
                        src={getFileUrl(msg.productId.files?.[0])}
                        className="chat-product-img"
                        alt=""
                      />
                      <div>
                        <p>{msg.productId.name}</p>
                        <span>{msg.productId.price} Rwf</span>
                      </div>
                    </div>
                  )}

                  {msg.replyTo && !isDeleted && (
                    <div className="quoted-msg">
                      <p>
                        {msg.replyTo.message
                          ? msg.replyTo.message
                          : msg.replyTo.files?.length
                          ? "📎 Media"
                          : "Message"}
                      </p>
                    </div>
                  )}

                  {msg.message && (
                    <p style={isDeleted ? { fontStyle: "italic", color: "#999" } : { whiteSpace: "pre-wrap" }}>
                      {msg.message}
                    </p>
                  )}

                  {/* FIXED: Wraps message image outputs into a uniform column layout */}
                  {msg.files && msg.files.length > 0 && (
                    <div 
                      className="chat-image-container" 
                      style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}
                    >
                      {msg.files.map((file, idx) => (
                        <img
                          key={idx}
                          src={getFileUrl(file)}
                          className="chat-image"
                          onClick={() => setZoomImage(getFileUrl(file))}
                          alt=""
                          style={{ display: "block", maxWidth: "100%", borderRadius: "8px" }}
                        />
                      ))}
                    </div>
                  )}

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
        <div className="typing-indicator">{buyer?.name} is typing...</div>
      )}

      {/* Showing interactive layout image previews before dispatching */}
      {files.length > 0 && (
        <div className="file-upload-preview" style={{ padding: "10px 12px", background: "#f9f9f9", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #eee" }}>
          {files.map((file, i) => (
            <div key={i} style={{ position: "relative", display: "inline-block", width: "60px", height: "60px" }}>
              <img 
                src={URL.createObjectURL(file)} 
                alt="preview" 
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", border: "1px solid #ccc" }} 
              />
              <button 
                onClick={() => removeSelectedFile(i)}
                style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            onClick={() => { setFiles([]); if(fileInputRef.current) fileInputRef.current.value = ""; }} 
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#ff4d4d", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
          >
            Clear All
          </button>
        </div>
      )}

      <div className="chat-input">
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <textarea
          value={text}
          placeholder="Type message..."
          onChange={(e) => {
            setText(e.target.value);
            if (!seller) return;

            const room = `Buyer_${buyerId}__Seller_${seller._id}`;

            socket.emit("typing", {
              room,
              senderId: seller._id
            });

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

export default Seller_Chat;