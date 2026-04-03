import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEye,
  faDownload,
  faTimes,
  faShoppingBag,
  faCalendarCheck,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import "./Notifications.css";

function Notifications_Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDetail, setViewDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("order"); 
  const pdfRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications);
          await api.put("/api/notifications/mark-read");
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleView = async (n) => {
    try {
      const type = n.bookingId ? "booking" : "order";
      const id = n.bookingId || n.orderId;
      
      const res = await api.get(`/api/${type}s/${id}`);
      if (res.data.success) {
        // We attach 'type' so the modal knows which fields to show
        setViewDetail({ ...res.data[type], type });
      }
    } catch (err) {
      alert("Details not found. It may have been deleted.");
    }
  };

  const downloadPDF = async () => {
    const element = pdfRef.current;
    if (!element || !viewDetail) return;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Isonga_${viewDetail.type}_${viewDetail._id?.slice(-6)}.pdf`);
    } catch (error) {
      alert("Error generating PDF.");
    }
  };

  const filteredNotifs = notifications.filter((n) => 
    activeTab === "booking" ? n.bookingId : n.orderId
  );

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2>Notifications</h2>
      </div>

      <div className="tab-container">
        <button className={`tab-btn ${activeTab === "order" ? "active" : ""}`} onClick={() => setActiveTab("order")}>
          <FontAwesomeIcon icon={faShoppingBag} /> Orders
        </button>
        <button className={`tab-btn ${activeTab === "booking" ? "active" : ""}`} onClick={() => setActiveTab("booking")}>
          <FontAwesomeIcon icon={faCalendarCheck} /> Bookings
        </button>
      </div>

      <div className="notif-list">
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : filteredNotifs.length === 0 ? (
          <p className="empty-msg">No {activeTab}s found.</p>
        ) : (
          filteredNotifs.map((n) => (
            <div key={n._id} className={`notif-card ${n.read ? "read" : "unread"}`} onClick={() => handleView(n)}>
              <div className="notif-icon-box">
                <FontAwesomeIcon icon={n.bookingId ? faCalendarCheck : faShoppingBag} />
              </div>
              <div className="notif-center">
                <p>{n.message}</p>
                <span className="notif-date">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <div className="notif-right">
                <button className="icon-btn view"><FontAwesomeIcon icon={faEye} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- DETAIL MODAL --- */}
      {viewDetail && (
        <div style={modalOverlayStyle} onClick={() => setViewDetail(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <button onClick={downloadPDF} style={downloadBtnStyle}>
                <FontAwesomeIcon icon={faDownload} /> Download PDF
              </button>
              <button style={closeBtnStyle} onClick={() => setViewDetail(null)}>
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>

            <div ref={pdfRef} style={pdfCanvasStyle}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#2c3e50', margin: 0 }}>ISONGA MARKET</h2>
                    <p style={{ color: '#7f8c8d' }}>Transaction Receipt: {viewDetail.type.toUpperCase()}</p>
                </div>

                <div style={gridStyle}>
                    <section>
                        <h4 style={sectionTitle}>Customer Info</h4>
                        <p><strong>Name:</strong> {viewDetail.name}</p>
                        <p><strong>Phone:</strong> {viewDetail.phone}</p>
                        {viewDetail.address && <p><strong>Address:</strong> {viewDetail.address}</p>}
                        {viewDetail.message && <p><strong>Note:</strong> {viewDetail.message}</p>}
                    </section>
                    <section>
                        <h4 style={sectionTitle}>Status & Method</h4>
                        <p><strong>ID:</strong> #{viewDetail._id?.slice(-8).toUpperCase()}</p>
                        <p><strong>Payment:</strong> {viewDetail.paymentMethod}</p>
                        {viewDetail.deliveryMethod && <p><strong>Delivery:</strong> {viewDetail.deliveryMethod}</p>}
                        <p><strong>Status:</strong> <span style={{ color: "#27ae60", fontWeight: "bold" }}>{viewDetail.status}</span></p>
                    </section>
                </div>

                {/* SHOW SPECIFIC INFO FOR BOOKINGS */}
                {viewDetail.type === "booking" && (
                  <div style={infoBox}>
                    <h4 style={{marginTop: 0}}>Booking Schedule</h4>
                    <p><strong>Date:</strong> {viewDetail.date}</p>
                    <p><strong>Time:</strong> {viewDetail.time}</p>
                  </div>
                )}

                {/* SHOW SPECIFIC INFO FOR ORDERS */}
                {viewDetail.items && (
                  <div style={infoBox}>
                    <h4 style={{marginTop: 0}}>Items Ordered</h4>
                    {viewDetail.items.map((item, i) => (
                      <div key={i} style={itemRow}>
                        <span>{item.product?.name || "Product"} x {item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString()} Rwf</span>
                      </div>
                    ))}
                    <div style={totalStyle}>
                      Total: {(viewDetail.totalPrice || 0).toLocaleString()} Rwf
                    </div>
                  </div>
                )}

                {/* SHOW PAYMENT PROOF IMAGE IF IT EXISTS */}
                {(viewDetail.paymentProof || viewDetail.paymentScreenshot) && (
                   <div style={{marginTop: '15px', textAlign: 'center'}}>
                      <p style={{fontSize: '12px', color: '#666'}}><FontAwesomeIcon icon={faImage} /> Payment Proof attached</p>
                      <img 
                        src={viewDetail.paymentProof || viewDetail.paymentScreenshot} 
                        alt="Receipt" 
                        style={{maxWidth: '100%', borderRadius: '5px', marginTop: '5px', border: '1px solid #eee'}} 
                      />
                   </div>
                )}

                <div style={{ marginTop: '30px', fontSize: '11px', textAlign: 'center', color: '#bdc3c7' }}>
                    Generated by Isonga Market on {new Date().toLocaleDateString()}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES (Keep these or move to CSS) ---------------- */
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: "20px", borderRadius: "12px", width: "95%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" };
const pdfCanvasStyle = { padding: "20px", background: "#fff" };
const downloadBtnStyle = { background: "#27ae60", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
const closeBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "#333" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" };
const sectionTitle = { borderBottom: "2px solid #f1f1f1", paddingBottom: "5px", fontSize: "14px", color: "#2c3e50" };
const infoBox = { marginTop: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #eee" };
const itemRow = { display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "14px" };
const totalStyle = { textAlign: "right", fontWeight: "bold", marginTop: "10px", borderTop: "1px solid #ddd", paddingTop: "5px" };

export default Notifications_Page;