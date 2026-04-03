import { useEffect, useState, useRef } from "react";
import api from "./api";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faImage, 
  faTimes, 
  faHistory, 
  faDownload 
} from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./SellerBookingHistory.css";

function SellerBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Refs to capture specific booking cards for PDF generation
  const bookingRefs = useRef({});

  const getBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/seller/bookings");
      if (res.data.success) {
        // Filter out Pending to show only Accepted/Cancelled in History
        const history = res.data.bookings.filter((b) => b.status !== "Pending");
        setBookings(history);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    getBookings();
  }, []);

  // PDF DOWNLOAD LOGIC
  const downloadBookingPDF = async (bookingId) => {
    const element = bookingRefs.current[bookingId];
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff" 
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Booking_Receipt_${bookingId.slice(-6)}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="history-card">
          <div className="line-loader">
            <div></div><div></div><div></div>
          </div>
          <p>Loading Booking history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Link to="/dashboard" style={backLinkStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>

      <h1 style={titleStyle}>
        <FontAwesomeIcon icon={faHistory} /> Booking History
      </h1>

      {bookings.length === 0 ? (
        <div style={emptyStateStyle}>
          <p>No processed bookings in your history yet.</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking._id} style={historyCardStyle}>
            
            {/* Header Area */}
            <div style={cardHeaderStyle}>
              <h3 style={{ margin: 0, color: "#34495e" }}>Booking ...{booking._id.slice(-6)}</h3>
              
              <div style={actionAreaStyle}>
                <button 
                  onClick={() => downloadBookingPDF(booking._id)}
                  style={downloadBtnStyle}
                >
                  <FontAwesomeIcon icon={faDownload} /> PDF
                </button>
                <span style={statusBadge(booking.status)}>{booking.status}</span>
              </div>
            </div>

            {/* Captured Content for PDF */}
            <div ref={(el) => (bookingRefs.current[booking._id] = el)} style={{ padding: '5px' }}>
              <div style={gridStyle}>
                <section>
                  <h4 style={sectionTitle}>Customer</h4>
                  <p style={textStyle}><strong>Name:</strong> {booking.name}</p>
                  <p style={textStyle}><strong>Phone:</strong> {booking.phone}</p>
                  <p style={textStyle}><strong>Message:</strong> {booking.message || "No message"}</p>
                </section>

                <section>
                  <h4 style={sectionTitle}>Schedule & Payment</h4>
                  <p style={textStyle}><strong>Date:</strong> {booking.date}</p>
                  <p style={textStyle}><strong>Time:</strong> {booking.time}</p>
                  {booking.paymentScreenshot && (
                    <button onClick={() => setSelectedImg(booking.paymentScreenshot)} style={receiptButtonStyle}>
                      <FontAwesomeIcon icon={faImage} /> View Receipt
                    </button>
                  )}
                </section>
              </div>

              <div style={itemBox}>
                <h4 style={{ margin: "0 0 5px 0", fontSize: "0.85rem", color: "#7f8c8d" }}>Message:</h4>
                <p style={{ fontSize: "0.9rem", margin: "0 0 10px 0", color: "#2c3e50" }}>
                    {booking.message || "No message provided."}
                </p>
                <div style={totalStyle}>Payment Method: {booking.paymentMethod}</div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal for Receipt */}
      {selectedImg && (
        <div style={modalOverlayStyle} onClick={() => setSelectedImg(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={() => setSelectedImg(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} alt="Receipt" style={modalImgStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

/* --- STYLES --- */

const containerStyle = { padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" };
const backLinkStyle = { textDecoration: "none", color: "#3498db", fontWeight: "600" };
const titleStyle = { margin: "25px 0", color: "#2c3e50" };
const emptyStateStyle = { textAlign: "center", marginTop: "50px", color: "#7f8c8d" };

const historyCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  borderLeft: "5px solid #bdc3c7",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "15px",
  paddingBottom: "10px",
  borderBottom: "1px solid #f9f9f9"
};

const actionAreaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const downloadBtnStyle = {
  background: "#fff",
  color: "#27ae60",
  border: "1px solid #27ae60",
  borderRadius: "4px",
  padding: "4px 10px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  gap: "5px"
};

const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const sectionTitle = { borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#7f8c8d", fontSize: "0.85rem", textTransform: "uppercase" };
const textStyle = { margin: "5px 0", fontSize: "0.9rem", color: "#2c3e50" };
const itemBox = { marginTop: "15px", background: "#fcfcfc", padding: "12px", borderRadius: "5px", border: "1px dashed #eee" };
const totalStyle = { textAlign: "right", fontWeight: "bold", color: "#2c3e50", marginTop: "8px", paddingTop: "5px", borderTop: "1px solid #eee", fontSize: "0.9rem" };

const statusBadge = (status) => ({
  backgroundColor: status === "Accepted" ? "#27ae60" : "#95a5a6",
  color: "white", padding: "4px 12px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold"
});

const receiptButtonStyle = { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: "0.85rem", padding: 0, marginTop: "5px" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { position: "relative", background: "#fff", padding: "10px", borderRadius: "8px", maxWidth: "90%" };
const modalImgStyle = { maxWidth: "100%", maxHeight: "80vh", display: "block" };
const closeButtonStyle = { position: "absolute", top: "-35px", right: "0", background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" };

export default SellerBookingHistory;