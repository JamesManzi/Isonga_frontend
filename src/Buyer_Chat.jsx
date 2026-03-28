import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Buyer_Chat.css";

// Use the same socket connection as your seller chat
const socket = io("https://isonga-backend.onrender.com", { 
  withCredentials: false,
  transports: ["websocket"],
});

function Buyer_Chat() {
  const { sellerId } = useParams();

  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  
  // LIGHTBOX STATE
  const [zoomImage, setZoomImage] = useState(null);

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const emojiRef = useRef();

  // 1. INITIAL LOAD & JOIN ROOM
  useEffect(() => {
    const loadChat = async () => {
      const token = localStorage.getItem("token");
        if (!token) {
        navigate("/buyer_login");
        return;
      }
      try {
        // Fetch Buyer Data
        const buyerRes = await axios.get("https://isonga-backend.onrender.com/api/buyer_dashboard", 
           {
          withCredentials: false,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
        const buyerData = buyerRes.data.buyer;
        setBuyer(buyerData);

        // Fetch Seller Data
        const sellerRes = await axios.get(`https://isonga-backend.onrender.com/api/get_seller/${sellerId}`, { withCredentials: false});
        if (sellerRes.data.success) setSeller(sellerRes.data.seller);

        // Define Room ID
        const room = `Buyer_${buyerData._id}__Seller_${sellerId}`;

        // Join Room
        socket.emit("joinRoom", {
          senderId: buyerData._id,
          senderModel: "Buyer",
          receiverId: sellerId,
          receiverModel: "Seller"
        });

        // Load Previous Messages
        const msgRes = await axios.get(`https://isonga-backend.onrender.com/api/messages/${room}`, { withCredentials: false });
        if (msgRes.data.success) setMessages(msgRes.data.messages);

        // MARK MESSAGES AS READ (When Buyer opens the chat)
        await axios.put(`https://isonga-backend.onrender.com/api/messages/read/${room}`, {}, { withCredentials: false });
        socket.emit("messagesRead", { room });

      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };
    loadChat();
  }, [sellerId]);

  // 2. SOCKET LISTENERS (Receive & Read Receipt)
  useEffect(() => {
    const handleReceive = async (msg) => {
      const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);

        // If a message comes from the seller, mark it as read immediately if chat is open
        if (msg.senderModel === "Seller") {
          try {
            await axios.put(`https://isonga-backend.onrender.com/api/messages/read/${room}`, {}, { withCredentials: false });
            socket.emit("messagesRead", { room });
          } catch (err) {
            console.error("Read update error:", err);
          }
        }
      }
    };

    // Update ticks from single to double in real-time
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
        const uploadRes = await axios.post("https://isonga-backend.onrender.com/api/chat/upload", formData, {
          withCredentials: false,
          headers: { "Content-Type": "multipart/form-data" }
        });
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
        room
      });

      setText(""); 
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.log(err);
    }
    setSending(false);
  };

  const renderPreview = () => {
    return files.map((file, index) => {
      const url = URL.createObjectURL(file);
      return (
        <div key={index} className="preview-item">
          {file.type.startsWith("image/") ? <img src={url} alt="" /> : <video src={url} controls />}
          <button type="button" onClick={() => removeFile(index)}>✕</button>
        </div>
      );
    });
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">
        <Link to="/BuyerConversations">←</Link>
        <h3>{seller?.name || "Loading..."}</h3>
      </div>

      {/* MESSAGES AREA */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;
          return (
            <div key={i} className={`message ${isMe ? "sent" : "received"}`}>
              <div className="bubble">
                {msg.message && <p>{msg.message}</p>}
                
                {msg.files && msg.files.map((file, index) => {
                  const clean = file.trim().replace(/\\/g, "/");

const url = clean.startsWith("http")
  ? clean
  : `https://isonga-backend.onrender.com/${clean.replace(/^\/+/, "")}`;
                  const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(clean);

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
                  {/* TICK LOGIC: Displayed only for messages the buyer sent */}
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
      {files.length > 0 && <div className="preview-container">{renderPreview()}</div>}

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