import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileInvoiceDollar, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
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
      )
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
        fetchBookings(); 
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) return <p className="loading">Loading bookings...</p>;

  if (bookings.length === 0) {
    return (
      <div className="seller-bookings">
        <div className="booking-header">
           <button className="back-btn" onClick={() => navigate(-1)}>←</button>
           <h1>Service Bookings</h1>
        </div>
        <div className="empty">
          <h2>No bookings yet</h2>
          <button className="dashboard-btn" onClick={() => navigate("/seller_dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-bookings">
      <div className="booking-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>Service Bookings</h1>
        <div style={{ width: "40px" }}></div>
      </div>

      {bookings.map((booking) => (
        <div key={booking._id} className="booking-card">
          <div className="booking-info">
            <div className="status-row">
                <h3>{booking.name}</h3>
                <span className={`status-tag ${booking.status}`}>{booking.status}</span>
            </div>
            <p><strong>Phone:</strong> {booking.phone}</p>
            <p><strong>Date:</strong> {booking.date}</p>
            <p><strong>Time:</strong> {booking.time}</p>
            <p><strong>Message:</strong> {booking.message || "None"}</p>
            <p><strong>Payment:</strong> {booking.paymentMethod}</p>

            {/* --- IMPROVED RECEIPT SECTION --- */}
            {booking.paymentProof && (
              <div className="payment-proof-container">
                <p><strong>Payment Receipt:</strong></p>
                <a 
                  href={booking.paymentProof} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="receipt-link"
                >
                  <FontAwesomeIcon icon={faFileInvoiceDollar} /> View Screenshot 
                  <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '10px', marginLeft: '5px' }} />
                </a>
                <div className="proof-preview">
                    <img
                      src={booking.paymentProof}
                      alt="Payment Proof"
                      className="proof-thumbnail"
                      onClick={() => window.open(booking.paymentProof, '_blank')}
                    />
                </div>
              </div>
            )}
          </div>

          <div className="booking-actions">
            {booking.status === "pending" && (
              <>
                <button className="approve-btn" onClick={() => updateStatus(booking._id, "approved")}>
                  Approve
                </button>
                <button className="reject-btn" onClick={() => updateStatus(booking._id, "rejected")}>
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SellerBookings;