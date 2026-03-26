// ChatPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import "./ChatPage.css";

function ChatPage() {
  const { sellerId } = useParams(); // from /chat/:sellerId
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [buyer, setBuyer] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Fetch buyer info (or seller info depending on role)
    const fetchUser = async () => {
      const res = await axios.get("https://isonga-backend.onrender.com/api/current_user", {
        withCredentials: false,
      });
      setBuyer(res.data.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!buyer) return;

    // Connect socket
    socketRef.current = io("https://isonga-backend.onrender.com", {
      withCredentials: false,
      transports: ["websocket"],
    });

    // Join room for buyer-seller pair
    socketRef.current.emit("joinChatRoom", {
      buyerId: buyer._id,
      sellerId,
    });

    // Listen for incoming messages
    socketRef.current.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Load chat history
    const fetchMessages = async () => {
      const res = await axios.get(
        `https://isonga-backend.onrender.com/api/messages/${buyer._id}/${sellerId}`,
        { withCredentials: false }
      );
      setMessages(res.data.messages || []);
    };
    fetchMessages();

    return () => socketRef.current.disconnect();
  }, [buyer, sellerId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const msg = {
      senderId: buyer._id,
      receiverId: sellerId,
      content: newMessage,
      timestamp: new Date(),
    };

    // Emit to server
    socketRef.current.emit("sendMessage", msg);

    // Optimistic update
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  return (
    <div className="ChatPage">
      <h2>Chat with Seller</h2>
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${
              msg.senderId === buyer._id ? "sent" : "received"
            }`}
          >
            <p>{msg.content}</p>
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatPage;
