import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes, faHistory } from "@fortawesome/free-solid-svg-icons";

function SellerBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);

  // ✅ Fetch only Incoming/Pending bookings
  const getBookings = () => {
    axios
      .get("https://isonga-backend.onrender.com/api/seller/bookings", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          // ✅ ONLY show Pending or Read bookings (Active requests)
          const incoming = res.data.bookings.filter(
            (b) => b.status === "Pending" || b.status === "Read"
          );
          setBookings(incoming);
        }
      })
      .catch((err) => console.error("Error fetching bookings:", err));
  };

  useEffect(() => {
    getBookings();
  }, []);

  // ✅ Update + REMOVE from UI instantly
  const updateStatus = (bookingId, newStatus) => {
    axios
      .put(
        `https://isonga-backend.onrender.com/api/bookings/${bookingId}`,
        { status: newStatus },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          // 🔥 Remove booking immediately from state so it "disappears"
          setBookings((prevBookings) =>
            prevBookings.filter((b) => b._id !== bookingId)
          );
        }
      })
      .catch((err) => console.error("Error updating booking status:", err));
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/dashboard" style={backStyle}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </Link>
        <Link to="/booking_history" style={historyLinkStyle}>
          <FontAwesomeIcon icon={faHistory} /> View History
        </Link>
      </div>

      <h1 style={titleStyle}>Incoming Service Bookings</h1>

      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p style={{ color: "#7f8c8d", fontSize: "1.1rem" }}>No new booking requests.</p>
          <Link to="/booking_history" style={{ color: "#3498db", textDecoration: "none" }}>Check History</Link>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking._id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Booking ID: ...{booking._id.slice(-6).toUpperCase()}</h3>
              <span style={statusBadge(booking.status)}>{booking.status}</span>
            </div>

            <div style={gridStyle}>
              <section>
                <h4 style={sectionTitle}>Client Info</h4>
                <p style={textStyle}><strong>Name:</strong> {booking.name}</p>
                <p style={textStyle}><strong>Phone:</strong> {booking.phone}</p>
                <p style={textStyle}><strong>Payment:</strong> {booking.paymentMethod}</p>
              </section>

              <section>
                <h4 style={sectionTitle}>Schedule</h4>
                <p style={textStyle}><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                <p style={textStyle}><strong>Time:</strong> {booking.time}</p>

                {booking.paymentScreenshot && (
                  <button
                    onClick={() => setSelectedImg(booking.paymentScreenshot)}
                    style={receiptButtonStyle}
                  >
                    <FontAwesomeIcon icon={faImage} /> View Receipt
                  </button>
                )}
              </section>
            </div>

            <div style={itemBox}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#7f8c8d" }}>Service Note</h4>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>{booking.message || "No additional message."}</p>
            </div>

            {/* ✅ ACTION BUTTONS */}
            <div style={btnContainer}>
              <button
                onClick={() => updateStatus(booking._id, "approved")}
                style={btnAccept}
              >
                Approve Booking
              </button>

              <button
                onClick={() => updateStatus(booking._id, "rejected")}
                style={btnDecline}
              >
                Decline
              </button>
            </div>
          </div>
        ))
      )}

      {/* ✅ IMAGE MODAL */}
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

/* ---------------- STYLES (Matching your Order layout) ---------------- */

const containerStyle = { padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" };
const backStyle = { textDecoration: "none", color: "#3498db", fontWeight: "600" };
const historyLinkStyle = { textDecoration: "none", color: "#2c3e50", fontWeight: "600", fontSize: "0.9rem" };
const titleStyle = { margin: "25px 0", color: "#2c3e50" };
const cardStyle = { background: "#fff", padding: "20px", borderRadius: "10px", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "15px" };
const sectionTitle = { borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#7f8c8d", fontSize: "0.9rem", textTransform: "uppercase" };
const textStyle = { margin: "8px 0", fontSize: "0.9rem", color: "#2c3e50" };
const itemBox = { marginTop: "15px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #eee" };
const btnContainer = { display: "flex", gap: "10px", marginTop: "20px" };
const btnAccept = { flex: 1, padding: "12px", background: "#27ae60", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };
const btnDecline = { flex: 1, padding: "12px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };
const receiptButtonStyle = { background: "none", border: "none", color: "#3498db", cursor: "pointer", padding: "5px 0", fontSize: "0.9rem" };

const statusBadge = (status) => ({
  background: status === "approved" ? "#2ecc71" : status === "rejected" ? "#e74c3c" : "#f1c40f",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "0.8rem",
  fontWeight: "bold"
});

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { position: "relative", background: "#fff", padding: "10px", borderRadius: "8px", maxWidth: "90%" };
const modalImgStyle = { maxWidth: "100%", maxHeight: "80vh", display: "block" };
const closeButtonStyle = { position: "absolute", top: "-40px", right: "0", background: "#fff", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer" };

export default SellerBookings;