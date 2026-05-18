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
  const [files, setFiles] = useState([]); // Will store chosen image files
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

  // FIXED: Appends multi-file batches and clears the input cache safely
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length !== selectedFiles.length) {
      alert("Only image files are allowed.");
    }
    
    // Uses functional state update to merge new items with previous choices
    setFiles(prevFiles => [...prevFiles, ...imageFiles]);

    // Resets target input trace so users can drop and pick identical filenames
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

      {/* Showing true visual image previews using URL.createObjectURL */}
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