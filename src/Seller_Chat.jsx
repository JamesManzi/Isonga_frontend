import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Seller_Chat.css";

// ✅ FIX: send token to backend
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

  const scrollRef = useRef();
  const fileInputRef = useRef();

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
    const room = `Buyer_${buyerId}__Seller_${seller?._id}`;

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

    const handleDelete = (data) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg._id === data.messageId) {
            if (data.forEveryone) {
              return { ...msg, message: "This message was deleted", files: [] };
            }

            if (msg.sender === data.userId) {
              return null;
            }
          }
          return msg;
        }).filter(Boolean)
      );
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messagesRead", handleRead);
    socket.on("messageDeleted", handleDelete);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messagesRead", handleRead);
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
      room: `Buyer_${buyerId}__Seller_${seller._id}`,
      forEveryone
    });
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-container">

      <div className="chat-header">
        <Link to="/SellerConversations">←</Link>

        <div className="header-user-info">
          <img src={getFileUrl(buyer?.profile)} className="header-img" alt="" />
          <h3>{buyer?.name || "Loading..."}</h3>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === seller?._id;

          return (
            <div key={i} className={`message-row ${isMe ? "sent" : "received"}`}>
              <div className="bubble-wrapper">

                <div className="bubble" onDoubleClick={() => setReplyTo(msg)}>

                  {msg.replyTo && (
                    <div className="quoted-msg">
                      <p>{msg.replyTo.message || "Media"}</p>
                    </div>
                  )}

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

                  <div className="msg-info">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>

                    {isMe && (
                      <span className={`read-status ${msg.read ? "read" : ""}`}>
                        {msg.read ? " ✓✓" : " ✓"}
                      </span>
                    )}
                  </div>

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
        <div ref={scrollRef} />
      </div>

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
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <textarea
          value={text}
          placeholder="Type message..."
          onChange={(e) => setText(e.target.value)}
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

      {/* IMAGE ZOOM */}
      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="" />
        </div>
      )}

    </div>
  );
}

export default Seller_Chat;