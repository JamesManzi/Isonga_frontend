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

  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      setLoading(true);

      const res = await api.get("/api/admin/bookings");

      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
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
      <div className="orders-loading">
        <div className="orders-loader-card">
          <div className="ring-loader"></div>
          <h2>ISONGA MARKET</h2>
          <p>
            <FontAwesomeIcon icon={faUserShield} /> ADMIN BOOKINGS
          </p>
          <p>Loading all bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Link to="/admin/dashboard" style={backStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </Link>

      <div style={headerStyle}>
        <h1 style={{ margin: 0 }}>All Bookings</h1>
        <span style={countBadge}>Total: {bookings.length}</span>
      </div>

      {bookings.length === 0 ? (
        <p style={{ textAlign: "center" }}>No bookings found.</p>
      ) : (
        bookings.map((b) => (
          <div key={b._id} style={cardStyle}>
            
            {/* HEADER */}
            <div style={orderHeader}>
              <div>
                <h3 style={{ margin: 0 }}>
                  Booking #{b._id.slice(-8).toUpperCase()}
                </h3>
                <small>
                  <FontAwesomeIcon icon={faCalendar} /> {b.date || "No date"}
                </small>
              </div>

              <span style={statusBadge(b.status)}>
                {b.status || "Pending"}
              </span>
            </div>

            {/* INFO */}
            <div style={gridStyle}>
              
              <div style={boxStyle}>
                <h4>Customer</h4>
                <p>{b.name}</p>
                <p>{b.phone}</p>
                <p>{b.email}</p>
              </div>

              <div style={boxStyle}>
                <h4>Booking Details</h4>
                <p><b>Service:</b> {b.serviceName}</p>
                <p><b>Provider:</b> {b.providerName}</p>
                <p><b>Time:</b> {b.time}</p>
              </div>
            </div>

            {/* PAYMENT */}
            <div style={itemsBox}>
              <h4>Payment</h4>

              <p>
                Method: <b>{b.paymentMethod}</b>
              </p>

              <p>
                Total: <b>{b.amount} Rwf</b>
              </p>

              {b.paymentProof && (
                <button
                  onClick={() => setSelectedImg(b.paymentProof)}
                  style={linkBtn}
                >
                  <FontAwesomeIcon icon={faImage} /> View Proof
                </button>
              )}
            </div>

            {/* ACTIONS */}
            <div style={btnWrap}>
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
          <div style={modalBox}>
            <button style={closeBtn} onClick={() => setSelectedImg(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <img src={selectedImg} style={img} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;