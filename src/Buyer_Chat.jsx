import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Buyer_Chat.css";

// ✅ FIX: Send token to backend
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

  const [searchParams] = useSearchParams();

  const productContext = {
    productId: searchParams.get("productId"),
    productName: searchParams.get("productName"),
    productImage: searchParams.get("productImage"),
    productPrice: searchParams.get("productPrice"),
  };

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
  // FIX ADDED: EMOJI HANDLER
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

        socket.emit("userOnline", { userModel: "Buyer" });

        socket.emit("joinRoom", {
          senderId: buyerData._id,
          senderModel: "Buyer",
          receiverId: sellerId,
          receiverModel: "Seller",
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
    if (!buyer) return;

    const room = `Buyer_${buyer._id}__Seller_${sellerId}`;

    const handleReceive = (msg) => {
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleTyping = (data) => {
      if (data.senderId !== buyer._id) {
        setIsTyping(true);
      }
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
        files.forEach(file => formData.append("files", file));

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
        productId: productContext.productId || null,
        replyTo: replyTo?._id || null,
        room
      });

      setText("");
      setFiles([]);
      setReplyTo(null);
      socket.emit("stopTyping", { room });

    } catch (err) {
      console.error(err);
    }

    setSending(false);
  };

  // =========================
  // DELETE
  // =========================
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
      {productContext.productId && (
        <div className="product-chat-context">
          <div className="context-card">
            <img src={getFileUrl(productContext.productImage)} alt="" />
            <div>
              <h4>{productContext.productName}</h4>
              <p>{productContext.productPrice} Rwf</p>
            </div>
          </div>
        </div>
      )}

      {/* REPLY PREVIEW (FIX ADDED) */}
      {replyTo && (
        <div className="reply-preview">
          <p>
            Replying to: {replyTo.message || "Media"}
          </p>
          <button onClick={() => setReplyTo(null)}>✖</button>
        </div>
      )}

      {/* CHAT MESSAGES */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;

          return (
            <div key={msg._id || i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">

                {/* FIX ADDED: REPLY TRIGGER */}
                <div
                  className="bubble"
                  onDoubleClick={() => setReplyTo(msg)}
                >

                  {/* REPLY DISPLAY */}
                  {msg.replyTo && (
                    <div className="quoted-msg">
                      <p>{msg.replyTo.message || "Media"}</p>
                    </div>
                  )}

                  {/* PRODUCT */}
                  {msg.productId && (
                    <div className="product-message">
                      <h4>{msg.productId.name}</h4>
                      <p>{msg.productId.price} Rwf</p>
                    </div>
                  )}

                  <p>{msg.message}</p>

                </div>
              </div>
            </div>
          );
        })}

        <div ref={scrollRef}></div>
      </div>

      {/* TYPING */}
      {isTyping && (
        <div className="typing-indicator">
          {seller?.name} is typing...
        </div>
      )}

      {/* INPUT */}
      <div className="chat-input">

        {/* FIX ADDED: EMOJI BUTTON */}
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <textarea
          value={text}
          placeholder="Type message..."
          onChange={(e) => {
            setText(e.target.value);

            const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;

            socket.emit("typing", {
              room,
              senderId: buyer?._id
            });

            if (typingTimeout.current) clearTimeout(typingTimeout.current);

            typingTimeout.current = setTimeout(() => {
              socket.emit("stopTyping", { room });
            }, 1500);
          }}
        />

        <button onClick={handleSend} disabled={sending}>
          ➤
        </button>
      </div>

      {/* FIX ADDED: EMOJI PICKER */}
      {showEmoji && (
        <div className="emoji-box">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

    </div>
  );
}

export default Buyer_Chat;