import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEye,
  faDownload,
  faCircle,
  faTimes,
  faImage
} from "@fortawesome/free-solid-svg-icons";
import "./Notifications.css";

function Notifications_Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDetail, setViewDetail] = useState(null); // Stores the order/booking data
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
        }
        await api.put("/api/notifications/mark-read");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // FETCH SPECIFIC DATA FOR THE EYE ICON
  const handleView = async (n) => {
    setDetailLoading(true);
    try {
      const type = n.orderId ? "order" : "booking";
      const id = n.orderId || n.bookingId;
      
      const res = await api.get(`/api/${type}s/${id}`); // Adjust endpoint as per your backend
      if (res.data.success) {
        setViewDetail({ ...res.data[type], type }); 
      }
    } catch (err) {
      alert("Could not load details. It might have been deleted.");
    } finally {
      setDetailLoading(false);
    }
  };

  // DOWNLOAD HANDLER (Print to PDF)
  const handleDownload = () => {
    window.print(); 
    // For a cleaner PDF, you can use libraries like html2pdf.js or jspdf
  };

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2>Notifications</h2>
      </div>

      <div className="notif-list">
        {loading ? (
          <div className="ring-loader"></div>
        ) : notifications.length === 0 ? (
          <p>No notifications</p>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className={`notif-card ${!n.read ? "unread" : ""}`}>
              <div className="notif-left">
                <span>{n.orderId ? "📦" : "📅"}</span>
              </div>

              <div className="notif-center">
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>

              <div className="notif-right">
                <button className="icon-btn view" onClick={() => handleView(n)}>
                  <FontAwesomeIcon icon={faEye} />
                </button>
                {!n.read && <FontAwesomeIcon icon={faCircle} className="dot" />}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- DETAIL MODAL (Displays when eye is clicked) --- */}
      {viewDetail && (
        <div style={modalOverlayStyle} onClick={() => setViewDetail(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()} className="printable">
            <button style={closeButtonStyle} onClick={() => setViewDetail(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={titleStyle}>{viewDetail.type === "order" ? "Order Details" : "Booking Details"}</h2>
              <button onClick={handleDownload} style={downloadBtnStyle}>
                <FontAwesomeIcon icon={faDownload} /> Download PDF
              </button>
            </div>

            <div style={cardStyle}>
               <div style={gridStyle}>
                  <section>
                    <h4 style={sectionTitle}>Customer Information</h4>
                    <p><strong>Name:</strong> {viewDetail.name}</p>
                    <p><strong>Phone:</strong> {viewDetail.phone}</p>
                    {viewDetail.address && <p><strong>Address:</strong> {viewDetail.address}</p>}
                  </section>
                  <section>
                    <h4 style={sectionTitle}>Status & Date</h4>
                    <p><strong>Status:</strong> {viewDetail.status}</p>
                    <p><strong>Date:</strong> {viewDetail.date || new Date(viewDetail.createdAt).toLocaleDateString()}</p>
                  </section>
               </div>

               {viewDetail.items && (
                 <div style={itemBox}>
                    <h4>Items Ordered</h4>
                    {viewDetail.items.map((item, i) => (
                      <div key={i} style={itemRow}>
                        <span>{item.product?.name} x {item.quantity}</span>
                        <span>{item.price * item.quantity} Rwf</span>
                      </div>
                    ))}
                    <div style={totalStyle}>Total: {viewDetail.totalPrice} Rwf</div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div style={modalOverlayStyle}>
          <div className="ring-loader"></div>
        </div>
      )}
    </div>
  );
}

/* ---------------- EXTRA STYLES (MATCHING YOUR SELLER UI) ---------------- */

const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, width: "100%", height: "100%",
  background: "rgba(0,0,0,0.7)",
  display: "flex", justifyContent: "center", alignItems: "center",
  zIndex: 2000,
  padding: "20px"
};

const modalContentStyle = {
  background: "#f4f7f6",
  padding: "30px",
  borderRadius: "15px",
  width: "100%",
  maxWidth: "800px",
  position: "relative",
  maxHeight: "90vh",
  overflowY: "auto"
};

const downloadBtnStyle = {
  background: "#3498db",
  color: "#fff",
  border: "none",
  padding: "8px 15px",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
};

const closeButtonStyle = {
  position: "absolute",
  top: "15px", right: "15px",
  background: "none", border: "none", fontSize: "20px", cursor: "pointer"
};

// Reusing your Seller styles for consistency
const cardStyle = { background: "#fff", padding: "20px", borderRadius: "10px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const sectionTitle = { borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#2c3e50" };
const itemBox = { marginTop: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px" };
const itemRow = { display: "flex", justifyContent: "space-between", marginBottom: "5px" };
const totalStyle = { textAlign: "right", fontWeight: "bold", marginTop: "10px", borderTop: "1px solid #ddd", paddingTop: "10px" };
const titleStyle = { margin: 0, color: "#2c3e50" };

export default Notifications_Page;