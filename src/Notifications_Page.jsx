import { useState, useEffect, useRef } from "react"; // Added useRef
import { useNavigate } from "react-router-dom";
import api from "./api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEye,
  faDownload,
  faCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "./Notifications.css";

function Notifications_Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDetail, setViewDetail] = useState(null);
  const pdfRef = useRef(); // Reference for the PDF generator
  const navigate = useNavigate();

  // ... fetchNotifications logic remains the same ...
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        if (res.data.success) setNotifications(res.data.notifications);
        await api.put("/api/notifications/mark-read");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleView = async (n) => {
    try {
      const type = n.orderId ? "order" : "booking";
      const id = n.orderId || n.bookingId;
      const res = await api.get(`/api/${type}s/${id}`);
      if (res.data.success) {
        setViewDetail({ ...res.data[type], type });
      }
    } catch (err) {
      alert("Details not found.");
    }
  };

  // PROFESSIONAL PDF DOWNLOAD LOGIC
  const downloadPDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true, // Allows images from other domains
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`${viewDetail.type}_${viewDetail._id.slice(-6)}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <button onClick={() => navigate(-1)}><FontAwesomeIcon icon={faArrowLeft} /></button>
        <h2>Notifications</h2>
      </div>

      <div className="notif-list">
        {loading ? <p>Loading...</p> : notifications.map((n) => (
          <div key={n._id} className="notif-card" onClick={() => handleView(n)}>
            <div className="notif-center"><p>{n.message}</p></div>
            <div className="notif-right">
              <button className="icon-btn view"><FontAwesomeIcon icon={faEye} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- DETAIL MODAL --- */}
      {viewDetail && (
        <div style={modalOverlayStyle} onClick={() => setViewDetail(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <button onClick={downloadPDF} style={downloadBtnStyle}>
                <FontAwesomeIcon icon={faDownload} /> Download PDF
              </button>
              <button style={{ border: "none", background: "none", cursor: "pointer" }} onClick={() => setViewDetail(null)}>
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>

            {/* THIS IS THE PART THAT GETS TURNED INTO A PDF */}
            <div ref={pdfRef} style={pdfCanvasStyle}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#2c3e50', margin: 0 }}>ISONGA MARKET</h2>
                    <p style={{ color: '#7f8c8d' }}>Official Transaction Receipt</p>
                </div>

                <div style={gridStyle}>
                    <section>
                        <h4 style={sectionTitle}>Customer Information</h4>
                        <p><strong>Name:</strong> {viewDetail.name}</p>
                        <p><strong>Phone:</strong> {viewDetail.phone}</p>
                        {viewDetail.address && <p><strong>Address:</strong> {viewDetail.address}</p>}
                    </section>
                    <section>
                        <h4 style={sectionTitle}>Order Status</h4>
                        <p><strong>ID:</strong> #{viewDetail._id.slice(-8)}</p>
                        <p><strong>Status:</strong> {viewDetail.status}</p>
                        <p><strong>Date:</strong> {new Date(viewDetail.createdAt).toLocaleDateString()}</p>
                    </section>
                </div>

                {viewDetail.items && (
                    <div style={itemBox}>
                        <h4 style={{ marginTop: 0 }}>Items Ordered</h4>
                        {viewDetail.items.map((item, i) => (
                            <div key={i} style={itemRow}>
                                <span>{item.product?.name || "Product"} x {item.quantity}</span>
                                <span>{item.price * item.quantity} Rwf</span>
                            </div>
                        ))}
                        <div style={totalStyle}>Total: {viewDetail.totalPrice} Rwf</div>
                    </div>
                )}
                
                <div style={{ marginTop: '30px', fontSize: '12px', textAlign: 'center', color: '#bdc3c7' }}>
                    Thank you for shopping with Isonga Market!
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const modalOverlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
  background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
};

const modalContentStyle = {
  background: "#fff", padding: "20px", borderRadius: "12px",
  width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto"
};

const pdfCanvasStyle = {
    padding: "30px", background: "#fff", border: "1px solid #eee"
};

const downloadBtnStyle = {
  background: "#27ae60", color: "#fff", border: "none",
  padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600"
};

const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" };
const sectionTitle = { borderBottom: "2px solid #f1f1f1", paddingBottom: "5px", color: "#2c3e50" };
const itemBox = { marginTop: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px" };
const itemRow = { display: "flex", justifyContent: "space-between", marginBottom: "8px" };
const totalStyle = { textAlign: "right", fontWeight: "bold", marginTop: "15px", borderTop: "1px solid #ddd", paddingTop: "10px", fontSize: "1.1rem" };

export default Notifications_Page;