import { useState, useEffect, useRef } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useLocation,
  useSearchParams
} from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Buyer_Chat.css";

// ✅ Socket
export const socket = io("https://isonga-backend.onrender.com", {
  transports: ["polling", "websocket"],
  auth: {
    token: localStorage.getItem("token"),
  },
});

function Buyer_Chat() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ NEW: get product from URL
  const [searchParams] = useSearchParams();

  const productContext = {
    productId: searchParams.get("productId"),
    productName: searchParams.get("productName"),
    productImage: searchParams.get("productImage"),
    productPrice: searchParams.get("productPrice"),
  };

  const hasProduct = productContext.productId;

  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
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
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTyping = (data) => {
      if (data.senderId !== buyer._id) setIsTyping(true);
    };

    const handleStopTyping = () => setIsTyping(false);

    const handleDelete = (data) => {
      setMessages((prev) =>
        prev
          .map((msg) => {
            if (msg._id === data.messageId) {
              if (data.forEveryone) {
                return {
                  ...msg,
                  message: "This message was deleted",
                  files: [],
                };
              }
              if (data.userId === buyer._id) return null;
            }
            return msg;
          })
          .filter(Boolean)
      );
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageDeleted", handleDelete);

    return () => {
      socket.off("receiveMessage", handleReceive);
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
        files.forEach((file) => formData.append("files", file));

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
        replyTo: replyTo?._id || null,
        room,
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
  // DELETE MESSAGE
  // =========================
  const handleDeleteMessage = (id, forEveryone) => {
    socket.emit("deleteMessage", {
      messageId: id,
      room: `Buyer_${buyer._id}__Seller_${sellerId}`,
      forEveryone,
    });
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-container">

      <div className="chat-header">
        <Link to="/BuyerConversations">←</Link>
        <h3>{seller?.name}</h3>
      </div>

      {/* ✅ PRODUCT CONTEXT */}
      {hasProduct && (
        <div className="product-chat-context">
          <div className="context-card">
            <img
              src={getFileUrl(productContext.productImage)}
              alt={productContext.productName}
              className="context-img"
            />
            <div className="context-details">
              <h4>{productContext.productName}</h4>
              <p>{productContext.productPrice} Rwf</p>
            </div>

            <button
              className="close-context"
              onClick={() => {
                window.history.replaceState({}, document.title, location.pathname);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.map((msg) => {
          const isMe = msg.sender === buyer?._id;

          return (
            <div key={msg._id} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">

                <div className="bubble">
                  {msg.message && <p>{msg.message}</p>}

                  {msg.files?.map((file, idx) => (
                    <img
                      key={idx}
                      src={getFileUrl(file)}
                      className="chat-image"
                      onClick={() => setZoomImage(getFileUrl(file))}
                      alt=""
                    />
                  ))}
                </div>

                <div className="message-actions">
                  <button onClick={() => handleDeleteMessage(msg._id, false)}>
                    Delete Me
                  </button>

                  {isMe && (
                    <button onClick={() => handleDeleteMessage(msg._id, true)}>
                      Delete All
                    </button>
                  )}
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
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />

        <button onClick={() => fileInputRef.current.click()}>📎</button>

        <textarea
          value={text}
          placeholder="Type message..."
          onChange={(e) => {
            setText(e.target.value);

            socket.emit("typing", {
              room: `Buyer_${buyer?._id}__Seller_${sellerId}`,
              senderId: buyer?._id,
            });

            if (typingTimeout.current) clearTimeout(typingTimeout.current);

            typingTimeout.current = setTimeout(() => {
              socket.emit("stopTyping", {
                room: `Buyer_${buyer?._id}__Seller_${sellerId}`,
              });
            }, 1500);
          }}
        />

        <button onClick={handleSend} disabled={sending}>
          {sending ? "..." : "➤"}
        </button>
      </div>

      {/* IMAGE ZOOM */}
      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="" />
        </div>
      )}

    </div>
  );
}

export default Buyer_Chat;