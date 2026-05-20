import { useEffect, useState } from "react";
import api from "./api";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faImage,
  faTimes,
  faUserShield,
  faCalendar,
} from "@fortawesome/free-solid-svg-icons";
import "./SellerOrders.css";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/admin/booking");

      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Check backend route.");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      setActionLoading(id);

      const res = await api.put(`/api/admin/booking/status/${id}`, {
        status,
      });

      if (res.data.success) {
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Link to="/admin/dashboard" style={backStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </Link>

      <div style={headerStyle}>
        <h1>All Bookings</h1>
        <span style={badgeStyle}>{bookings.length}</span>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((b) => (
          <div key={b._id} style={cardStyle}>
            
            <div style={topRow}>
              <div>
                <h3>Booking #{b._id.slice(-8)}</h3>
                <small>
                  <FontAwesomeIcon icon={faCalendar} /> {b.date || "No date"}
                </small>
              </div>

              <span style={statusBadge(b.status)}>
                {b.status || "Pending"}
              </span>
            </div>

            <div style={grid}>
              <div style={box}>
                <h4>Customer</h4>
                <p>{b.name}</p>
                <p>{b.phone}</p>
                <p>{b.email}</p>
              </div>

              <div style={box}>
                <h4>Booking</h4>
                <p><b>Service:</b> {b.product.name}</p>
                <p><b>Provider:</b> {b.seller.name}</p>
                <p><b>Time:</b> {b.time}</p>
              </div>
            </div>

            <div style={paymentBox}>
              <p><b>Payment:</b> {b.paymentMethod}</p>
              <p><b>Total:</b> {b.amount} Rwf</p>

              {b.paymentProof && (
                <button
                  onClick={() => setSelectedImg(b.paymentProof)}
                  style={linkBtn}
                >
                  <FontAwesomeIcon icon={faImage} /> View Proof
                </button>
              )}
            </div>

            <div style={btnRow}>
              <button
                onClick={() => updateBookingStatus(b._id, "Accepted")}
                disabled={actionLoading === b._id}
                style={acceptBtn}
              >
                {actionLoading === b._id ? "Updating..." : "Approve"}
              </button>

              <button
                onClick={() => updateBookingStatus(b._id, "Cancelled")}
                disabled={actionLoading === b._id}
                style={cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        ))
      )}

      {/* IMAGE MODAL */}
      {selectedImg && (
        <div style={modal} onClick={() => setSelectedImg(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <button style={closeBtn} onClick={() => setSelectedImg(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} style={imgStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;

/* ---------------- STYLES ---------------- */

const containerStyle = {
  padding: "25px",
  maxWidth: "1100px",
  margin: "auto",
  fontFamily: "sans-serif",
};

const backStyle = {
  textDecoration: "none",
  color: "#3498db",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "20px 0",
};

const badgeStyle = {
  background: "#2c3e50",
  color: "#fff",
  padding: "5px 10px",
  borderRadius: "5px",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "15px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  marginTop: "10px",
};

const box = {
  background: "#f9f9f9",
  padding: "10px",
  borderRadius: "6px",
};

const paymentBox = {
  marginTop: "10px",
  padding: "10px",
  background: "#f6f6f6",
};

const btnRow = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

const acceptBtn = {
  flex: 1,
  background: "#2ecc71",
  border: "none",
  color: "#fff",
  padding: "10px",
};

const cancelBtn = {
  flex: 1,
  background: "#e74c3c",
  border: "none",
  color: "#fff",
  padding: "10px",
};

const statusBadge = (s) => ({
  background:
    s === "Accepted" ? "#2ecc71" : s === "Cancelled" ? "#e74c3c" : "#f1c40f",
  color: "#fff",
  padding: "5px 10px",
  borderRadius: "20px",
});

const linkBtn = {
  background: "none",
  border: "none",
  color: "#3498db",
  cursor: "pointer",
};

const modal = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBox = {
  background: "#fff",
  padding: "10px",
};

const imgStyle = {
  maxWidth: "500px",
  maxHeight: "80vh",
};

const closeBtn = {
  background: "red",
  color: "#fff",
  border: "none",
  float: "right",
};