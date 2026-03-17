import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SellerBookings.css";

function SellerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        "https://isonga-backend.onrender.com/api/seller/bookings",
        { withCredentials: true }
      );

      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `https://isonga-backend.onrender.com/api/bookings/${id}`,
        { status },
        { withCredentials: true }
      );

      if (res.data.success) {
        fetchBookings(); // refresh
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) return <p className="loading">Loading bookings...</p>;

  if (bookings.length === 0) {
    return (
      <div className="empty">
        <h2>No bookings yet</h2>
        <button onClick={() => navigate("/seller_dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="seller-bookings">
      <h1>Service Bookings</h1>

      {bookings.map((booking) => (
        <div key={booking._id} className="booking-card">

          <div className="booking-info">
            <h3>{booking.name}</h3>
            <p><strong>Phone:</strong> {booking.phone}</p>
            <p><strong>Date:</strong> {booking.date}</p>
            <p><strong>Time:</strong> {booking.time}</p>
            <p><strong>Message:</strong> {booking.message || "None"}</p>
            <p><strong>Payment:</strong> {booking.paymentMethod}</p>
            <p><strong>Status:</strong> {booking.status}</p>
          </div>

          {/* PAYMENT PROOF IMAGE */}
          {booking.paymentProof && (
            <div className="payment-proof">
              <p>Payment Proof:</p>
              <img
                src={`https://isonga-backend.onrender.com/uploads/${booking.paymentProof}`}
                alt="proof"
                className="proof-img"
              />
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="booking-actions">
            <button onClick={() => updateStatus(booking._id, "approved")}>
              Approve
            </button>

            <button onClick={() => updateStatus(booking._id, "rejected")}>
              Reject
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}

export default SellerBookings;