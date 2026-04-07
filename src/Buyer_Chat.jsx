import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Buyer_Chat.css";

// Socket
export const socket = io("https://isonga-backend.onrender.com", {
  transports: ["polling", "websocket"],
  auth: {
    token: localStorage.getItem("token")
  }
});

function Buyer_Chat() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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

  // =========================
  // EMOJI
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
      : `https://isonga-backend.onrender.com/${clean.replace(/^\/+/, "")}`;
  };

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
  }, [sellerId]);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    if (!buyer) return;

    const room = `Buyer_${buyer._id}__Seller_${sellerId}`;

    const handleReceive = (msg) => {
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleTyping = (data) => {
      if (data.senderId !== buyer._id) setIsTyping(true);
    };

    const handleStopTyping = () => setIsTyping(false);

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [buyer, sellerId]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // SEND MESSAGE
  // =========================
  const handleSend = async () => {
    if (!buyer || (!text.trim() && files.length === 0)) return;

    setSending(true);
    let uploadedFiles = [];

    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append("files", f));

        const res = await api.post("/api/chat/upload", formData);
        if (res.data.success) uploadedFiles = res.data.files;
      }

      const room = `Buyer_${buyer._id}__Seller_${sellerId}`;

      socket.emit("sendMessage", {
        sender: buyer._id,
        senderModel: "Buyer",
        receiver: sellerId,
        receiverModel: "Seller",
        message: text,
        files: uploadedFiles,

        // ✅ MATCH SELLER CHAT
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
      room: `Buyer_${buyer._id}__Seller_${sellerId}`,
      forEveryone
    });
  };

  return (
    <div className="chat-container">

      <div className="chat-header">
        <Link to="/BuyerConversations">←</Link>
        <h3>{seller?.name}</h3>
      </div>

      {/* PRODUCT CONTEXT */}
      {location.state?.productName && (
        <div className="product-context-header">
          <div className="context-card">
            <img
              src={getFileUrl(location.state.productImage)}
              className="context-thumbnail"
              alt=""
            />
            <div>
              <p>Inquiring about:</p>
              <h4>{location.state.productName}</h4>
              <span>{location.state.productPrice} Rwf</span>
            </div>
          </div>
        </div>
      )}

      {/* REPLY PREVIEW */}
      {replyTo && (
        <div className="reply-preview">
          <p>Replying to: {replyTo.message || "Media"}</p>
          <button onClick={() => setReplyTo(null)}>✖</button>
        </div>
      )}

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;
          const isDeleted = msg.message === "This message was deleted";

          return (
            <div key={msg._id || i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">

                {/* REPLY TRIGGER */}
                <div
                  className="bubble"
                  onDoubleClick={() => !isDeleted && setReplyTo(msg)}
                >

                  {/* REPLY DISPLAY */}
                  {msg.replyTo && !isDeleted && (
                    <div className="quoted-msg">
                      <p>{msg.replyTo.message || "Media"}</p>
                    </div>
                  )}

                  {/* MESSAGE */}
                  <p style={isDeleted ? { fontStyle: "italic", color: "#999" } : {}}>
                    {msg.message}
                  </p>

                </div>

                {/* DELETE */}
                <div className="message-actions">
                  <button onClick={() => handleDeleteMessage(msg._id, false)}>
                    Delete Me
                  </button>

                  {isMe && !isDeleted && (
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

      {/* TYPING */}
      {isTyping && (
        <div className="typing-indicator">
          {seller?.name} is typing...
        </div>
      )}

      {/* INPUT */}
      <div className="chat-input">

        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={handleSend} disabled={sending}>
          ➤
        </button>
      </div>

      {/* EMOJI */}
      {showEmoji && (
        <div className="emoji-box">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

    </div>
  );
}

export default Buyer_Chat;