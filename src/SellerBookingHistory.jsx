import { useEffect, useState } from "react";
import api from "./api";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes, faHistory } from "@fortawesome/free-solid-svg-icons";
import "./SellerBookingHistory.css";
function SellerBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true); 
  // Inside SellerBookingHistory.js

const getBookings = async () => {
  setLoading(true); // spinner shows immediately
  try {
     const res = await api.get("/api/seller/bookings");
    if (res.data.success) {
      const history = res.data.bookings.filter((b) => b.status !== "Pending");
      setBookings(history);
    }
  } catch (err) {
    console.error("Error fetching history:", err);
  } finally {
    setLoading(false); // spinner disappears only after data loads
  }
};
useEffect(() => {
    getBookings();
  }, []);
 
  
  if (loading) {
  return (
    <div className="history-loading">
      <div className="history-card">

        {/* Animated bars */}
        <div className="line-loader">
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Fake order skeleton */}
        <div className="fake-order">
          <div className="fake-title shimmer"></div>
          <div className="fake-row shimmer"></div>
          <div className="fake-row shimmer"></div>
          <div className="fake-row small shimmer"></div>
        </div>

        <p>Loading Booking history...</p>
      </div>
    </div>
  );
}

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <Link to="/dashboard" style={{ textDecoration: "none", color: "#3498db", fontWeight: "600" }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>

      <h1 style={{ margin: "25px 0", color: "#2c3e50" }}>
        <FontAwesomeIcon icon={faHistory} /> Booking History
      </h1>

      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px", color: "#7f8c8d" }}>
          <p>No processed bookings in your history yet.</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking._id} style={historyCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#34495e" }}>Booking ...{booking._id.slice(-6)}</h3>
              <span style={statusBadge(booking.status)}>{booking.status}</span>
            </div>

            <div style={gridStyle}>
              <section>
                <h4 style={sectionTitle}>Customer</h4>
                <p style={textStyle}><strong>Name:</strong> {booking.name}</p>
                <p style={textStyle}><strong>Phone:</strong> {booking.phone}</p>
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
              <h4 style={{ margin: "0 0 5px 0", fontSize: "0.9rem", color: "#7f8c8d" }}>Message:</h4>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>{booking.message || "No message provided."}</p>
              <div style={totalStyle}>Payment: {booking.paymentMethod}</div>
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

// --- Styles (Identical to your History reference) ---
const historyCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "15px",
  borderLeft: "5px solid #bdc3c7",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
};

const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" };
const sectionTitle = { borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#7f8c8d", fontSize: "0.9rem", textTransform: "uppercase" };
const textStyle = { margin: "5px 0", fontSize: "0.9rem", color: "#2c3e50" };

const itemBox = {
  marginTop: "12px",
  background: "#fcfcfc",
  padding: "10px",
  borderRadius: "5px",
  border: "1px dashed #eee"
};

const totalStyle = {
  textAlign: "right",
  fontWeight: "bold",
  color: "#2c3e50",
  marginTop: "8px",
  paddingTop: "5px",
  borderTop: "1px solid #eee"
};

const statusBadge = (status) => ({
  backgroundColor: status === "Accepted" ? "#27ae60" : "#95a5a6",
  color: "white",
  padding: "3px 10px",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: "bold"
});

const receiptButtonStyle = {
  background: "none",
  border: "none",
  color: "#3498db",
  cursor: "pointer",
  fontSize: "0.85rem",
  padding: 0,
  marginTop: "5px"
};

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { position: "relative", background: "#fff", padding: "10px", borderRadius: "8px", maxWidth: "90%" };
const modalImgStyle = { maxWidth: "100%", maxHeight: "80vh", display: "block" };
const closeButtonStyle = { position: "absolute", top: "-35px", right: "0", background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" };

export default SellerBookingHistory;