import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Buyer_Chat.css";

const socket = io("https://isonga-backend.onrender.com", { withCredentials: true });

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

  // LOAD CHAT
  useEffect(() => {
    const loadChat = async () => {
      try {
        const buyerRes = await axios.get("https://isonga-backend.onrender.com/api/buyer_dashboard", { withCredentials: true });
        if (!buyerRes.data.success) return;
        const buyerData = buyerRes.data.buyer;
        setBuyer(buyerData);

        const sellerRes = await axios.get(`https://isonga-backend.onrender.com/api/get_seller/${sellerId}`, { withCredentials: true });
        if (sellerRes.data.success) setSeller(sellerRes.data.seller);

        const room = `Buyer_${buyerData._id}__Seller_${sellerId}`;
        socket.emit("joinRoom", {
          senderId: buyerData._id,
          senderModel: "Buyer",
          receiverId: sellerId,
          receiverModel: "Seller"
        });

        const msgRes = await axios.get(`https://isonga-backend.onrender.com/api/messages/${room}`, { withCredentials: true });
        if (msgRes.data.success) setMessages(msgRes.data.messages);
      } catch (err) { console.log(err); }
    };
    loadChat();
  }, [sellerId]);

  // RECEIVE MESSAGE
  useEffect(() => {
    const handleReceive = (msg) => {
      const room = `Buyer_${buyer?._id}__Seller_${sellerId}`;
      if (msg.room === room) setMessages(prev => [...prev, msg]);
    };
    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [buyer, sellerId]);

  // AUTO SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const dropped = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...dropped]);
    }
  };

  const handleSend = async () => {
    if (!buyer || (!text.trim() && files.length === 0)) return;
    setSending(true);
    let uploadedFiles = [];
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));
        const uploadRes = await axios.post("https://isonga-backend.onrender.com/api/chat/upload", formData, {
          withCredentials: true,
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
      setText(""); setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { console.log(err); }
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

      {/* MESSAGES */}
      <div className="chat-messages" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {messages.map((msg, i) => {
          const isMe = msg.sender === buyer?._id;
          return (
            <div key={i} className={`message ${isMe ? "sent" : "received"}`}>
              <div className="bubble">
                {msg.message && <p>{msg.message}</p>}
                {msg.files && msg.files.map((file, index) => {
                  const clean = file.trim().replace(/\\/g, "/");
                  const url = `https://isonga-backend.onrender.com/${clean.replace(/^\/+/, "")}`;
                  const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(clean);

                  if (isVideo) {
                    return <video key={index} src={url} controls className="chat-video" />;
                  } else {
                    return (
                      <img
                        key={index}
                        src={url}
                        className="chat-image"
                        alt="img"
                        onClick={() => setZoomImage(url)} // OPEN LIGHTBOX
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const link = document.createElement('a');
                          link.href = url;
                          link.target = "_blank";
                          link.innerText = "📎 View Attachment";
                          link.style.display = "block";
                          link.style.color = "#3498db";
                          e.target.parentNode.appendChild(link);
                        }}
                      />
                    );
                  }
                })}
                <span className="time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef}></div>
      </div>

      {/* PREVIEW */}
      {files.length > 0 && <div className="preview-container">{renderPreview()}</div>}

      {/* EMOJI */}
      {showEmoji && (
        <div className="emoji-box" ref={emojiRef}>
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* INPUT */}
      <div className="chat-input">
        <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} accept="image/*,video/*" onChange={handleFileSelect} />
        <button type="button" onClick={() => fileInputRef.current.click()}>📎</button>
        <button type="button" onClick={() => setShowEmoji(prev => !prev)}>😊</button>
        <textarea value={text} placeholder="Type message..." onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
        <button onClick={handleSend} disabled={sending}>{sending ? "..." : "➤"}</button>
      </div>

      {/* LIGHTBOX MODAL */}
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