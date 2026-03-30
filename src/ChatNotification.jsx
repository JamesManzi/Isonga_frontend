import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import { socket } from "./Socket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";

function ChatNotification() {

  const [conversations, setConversations] = useState([]);
  const [buyerId, setBuyerId] = useState("");

  useEffect(() => {

    const fetchUser = async () => {
      try {
        const res = await api.get("/api/buyer_dashboard");
        if (!res.data.success) return;

        const buyer = res.data.buyer;
        setBuyerId(buyer._id);

        socket.emit("userOnline", {
          userId: buyer._id,
          userModel: "Buyer"
        });

        const convRes = await api.get("/api/buyer/conversations");

        if (convRes.data.success) {
          setConversations(convRes.data.conversations);
        }

      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();

  }, []);

  useEffect(() => {

    const handleNotification = (data) => {

      setConversations(prev => {

        const index = prev.findIndex(c => c._id === data.room);

        if (index !== -1) {

          const updated = [...prev];

          updated[index] = {
            ...updated[index],
            unreadCount: (updated[index].unreadCount || 0) + 1
          };

          return updated;

        }

        return [
          {
            _id: data.room,
            unreadCount: 1
          },
          ...prev
        ];

      });

    };

    socket.on("newMessageNotification", handleNotification);

    return () => {
      socket.off("newMessageNotification", handleNotification);
    };

  }, []);

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unreadCount || 0),
    0
  );

  return (

    <Link to="/BuyerConversations">

      <div style={{ position: "relative" }}>

        <FontAwesomeIcon icon={faEnvelope} size="lg"  className="faEnvelope"/>

        {totalUnread > 0 && (

          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-10px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "11px"
            }}
          >
            {totalUnread}
          </span>

        )}

      </div>

    </Link>

  );
}

export default ChatNotification;