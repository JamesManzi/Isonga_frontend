import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes } from "@fortawesome/free-solid-svg-icons";

function SellerBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);

  // ✅ Fetch and filter for Pending OR Read
  const getBookings = () => {
    axios
      .get("https://isonga-backend.onrender.com/api/seller/bookings", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          // 🔥 FIX: Include "Read" so they stay visible after returning to the page
          const incoming = res.data.bookings.filter(
            (booking) => booking.status === "Pending" || booking.status === "Read"
          );
          setBookings(incoming);
        }
      })
      .catch((err) => console.error("Error fetching bookings:", err));
  };

  useEffect(() => {
    getBookings();
  }, []);

  // ✅ Update status and remove from list instantly
  const updateStatus = (bookingId, newStatus) => {
    axios
      .put(
        `https://isonga-backend.onrender.com/api/bookings/${bookingId}`,
        { status: newStatus },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          setBookings((prev) => prev.filter((b) => b._id !== bookingId));
        }
      })
      .catch((err) => console.error("Error updating booking status:", err));
  };

  return (
    <div style={containerStyle}>
      <Link to="/dashboard" style={backStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>

      <h1 style={titleStyle}>Incoming Bookings</h1>

      {bookings.length === 0 ? (
        <p style={{ color: "#7f8c8d" }}>No incoming bookings.</p>
      ) : (
        bookings.map((booking) => (
          <div key={booking._id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Booking ID: ...{booking._id.slice(-6)}</h3>
              <span style={statusBadge(booking.status)}>
                {booking.status}
              </span>
            </div>

            <div style={gridStyle}>
              <section>
                <h4 style={sectionTitle}>Customer Info</h4>
                <p><strong>Name:</strong> {booking.name}</p>
                <p><strong>Phone:</strong> {booking.phone}</p>
                <p><strong>Message:</strong> {booking.message || "No message"}</p>
              </section>

              <section>
                <h4 style={sectionTitle}>Schedule & Payment</h4>
                <p><strong>Date:</strong> {booking.date}</p>
                <p><strong>Time:</strong> {booking.time}</p>
                <p><strong>Payment:</strong> {booking.paymentMethod}</p>

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

            {/* ✅ ACTION BUTTONS */}
            <div style={btnContainer}>
              <button
                onClick={() => updateStatus(booking._id, "Confirmed")}
                style={btnAccept}
              >
                Approve
              </button>

              <button
                onClick={() => updateStatus(booking._id, "Rejected")}
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
        <div
          style={modalOverlayStyle}
          onClick={() => setSelectedImg(null)}
        >
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={closeButtonStyle}
              onClick={() => setSelectedImg(null)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} alt="Receipt" style={modalImgStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const containerStyle = {
  padding: "30px",
  maxWidth: "1000px",
  margin: "0 auto",
  fontFamily: "sans-serif",
};

const backStyle = {
  textDecoration: "none",
  color: "#3498db",
  fontWeight: "600",
};

const titleStyle = {
  margin: "25px 0",
  color: "#2c3e50",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "15px",
};

const sectionTitle = {
  borderBottom: "1px solid #eee",
  paddingBottom: "5px",
};

const statusBadge = (status) => ({
  background:
    status === "Pending" || status === "Read"
      ? "#f1c40f"
      : status === "Rejected"
      ? "#e74c3c"
      : "#2ecc71",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: "20px",
});

const receiptButtonStyle = {
  background: "none",
  border: "none",
  color: "#3498db",
  cursor: "pointer",
};

const btnContainer = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

const btnAccept = {
  flex: 1,
  padding: "10px",
  background: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const btnDecline = {
  flex: 1,
  padding: "10px",
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  position: "relative",
  background: "#fff",
  padding: "10px",
  borderRadius: "8px",
};

const modalImgStyle = {
  maxWidth: "100%",
  maxHeight: "80vh",
};

const closeButtonStyle = {
  position: "absolute",
  top: "-40px",
  right: "0",
  background: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "30px",
  height: "30px",
  cursor: "pointer",
};

export default SellerBookings;