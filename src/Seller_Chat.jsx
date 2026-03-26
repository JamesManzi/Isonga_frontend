import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./Seller_Chat.css";

const socket = io("https://isonga-backend.onrender.com", 
  { withCredentials: true,
    transports: ["websocket"],
   });

function Seller_Chat() {
  const { buyerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [buyer, setBuyer] = useState(null);
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

  // 1. LOAD DATA
  useEffect(() => {
    const loadChat = async () => {
       const token = localStorage.getItem("token");
        if (!token) {
        navigate("/login");
        return;
      }
      try {
        const sellerRes = await axios.get("https://isonga-backend.onrender.com/api/dashboard",
          {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
        if (!sellerRes.data.success) return;
        const sellerData = sellerRes.data.seller;
        setSeller(sellerData);

        const buyerRes = await axios.get(`https://isonga-backend.onrender.com/api/get_buyer/${buyerId}`, { withCredentials: true });
        if (buyerRes.data.success) setBuyer(buyerRes.data.buyer);

        const room = `Buyer_${buyerId}__Seller_${sellerData._id}`;
        socket.emit("joinRoom", {
          senderId: sellerData._id,
          senderModel: "Seller",
          receiverId: buyerId,
          receiverModel: "Buyer"
        });

        const msgRes = await axios.get(`https://isonga-backend.onrender.com/api/messages/${room}`, { withCredentials: true });
        if (msgRes.data.success) setMessages(msgRes.data.messages);

        await axios.put(`https://isonga-backend.onrender.com/api/messages/read/${room}`, {}, { withCredentials: true });
        socket.emit("messagesRead", { room });
      } catch (err) { console.error(err); }
    };
    loadChat();
  }, [buyerId]);

  // 2. RECEIVE MESSAGE
  useEffect(() => {
    const handleReceiveMessage = async (msg) => {
      const room = `Buyer_${buyerId}__Seller_${seller?._id}`;
      if (msg.room === room) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderModel === "Buyer") {
          try {
            await axios.put(`https://isonga-backend.onrender.com/api/messages/read/${room}`, {}, { withCredentials: true });
            socket.emit("messagesRead", { room });
          } catch (err) { console.error(err); }
        }
      }
    };

    const handleMessagesRead = () => {
      setMessages((prev) => prev.map((msg) => (msg.read === false ? { ...msg, read: true } : msg)));
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessagesRead);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [buyerId, seller]);

  // AUTO SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ACTIONS
  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!seller || (!text.trim() && files.length === 0)) return;
    setSending(true);
    let uploadedFiles = [];
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append("files", f));
        const res = await axios.post("https://isonga-backend.onrender.com/api/chat/upload", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
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
        room
      });

      setText(""); setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const renderPreview = () => {
    return files.map((file, index) => {
      const url = URL.createObjectURL(file);
      return (
        <div key={index} className="preview-item">
          {file.type.startsWith("video/") ? <video src={url} /> : <img src={url} alt="" />}
          <button type="button" onClick={() => removeFile(index)}>✕</button>
        </div>
      );
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to="/SellerConversations">←</Link>
        <h3>{buyer?.name || "Loading..."}</h3>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.sender === seller?._id;
          return (
            <div key={i} className={`message ${isMe ? "sent" : "received"}`}>
              <div className="bubble">
                {msg.message && <p>{msg.message}</p>}

                {msg.files && msg.files.map((filePath, idx) => {
                  const clean = filePath.trim().replace(/\\/g, "/");
const url = clean.startsWith("http")
  ? clean
  : `https://isonga-backend.onrender.com/${clean}`;
                  const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(filePath);

                  if (isVideo) {
                    return <video key={idx} src={url} controls className="chat-video" />;
                  } else {
                    return (
                      <img
                        key={idx}
                        src={url}
                        className="chat-image"
                        alt="attachment"
                        onClick={() => setZoomImage(url)} // ZOOM INSTEAD OF NEW TAB
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const link = document.createElement('a');
                          link.href = url; link.target = "_blank"; link.innerText = "📎 View Attachment";
                          e.target.parentNode.appendChild(link);
                        }}
                      />
                    );
                  }
                })}

                <span className="time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <span className="read-status">{msg.read ? " ✓✓" : " ✓"}</span>}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {files.length > 0 && <div className="preview-container">{renderPreview()}</div>}

      {showEmoji && (
        <div className="emoji-box" ref={emojiRef}>
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      <div className="chat-input">
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          accept="image/*,video/*" 
          onChange={handleFileSelect} 
        />
        <button type="button" onClick={() => fileInputRef.current.click()}>📎</button>
        <button type="button" onClick={() => setShowEmoji(prev => !prev)}>😊</button>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type message..."
        />
        
        <button onClick={handleSend} disabled={sending}>
          {sending ? "..." : "➤"}
        </button>
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

export default Seller_Chat;