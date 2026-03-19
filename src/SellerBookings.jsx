import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Added Link
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileInvoiceDollar, 
  faTimes, 
  faArrowLeft,
  faHistory // Added history icon
} from "@fortawesome/free-solid-svg-icons";
import "./SellerBookings.css";

function SellerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null); 
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
        // [CRITICAL UPDATE]: Filter out "approved" and "rejected"
        // This makes them disappear from this list instantly after update
        const activeBookings = res.data.bookings.filter(
          (b) => b.status !== "approved" && b.status !== "rejected"
        );
        setBookings(activeBookings);
      }
    } catch (err) {
      console.log("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `https://isonga-backend.onrender.com/api/bookings/${id}`,
        { status },
        { withCredentials: true }
      );

      if (res.data.success) {
        // This will re-run the fetch and the filter will hide the updated booking
        fetchBookings(); 
      }
    } catch (err) {
      console.log("Error updating status:", err);
    }
  };

  if (loading) return <p className="loading">Loading bookings...</p>;

  return (
    <div className="seller-bookings">
      <div className="booking-header">
        <button className="back_btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>Active Bookings</h1>
        {/* Link to the History Page you just created */}
        <Link to="/booking_history" className="history_link_btn">
          <FontAwesomeIcon icon={faHistory} />
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="empty">
          <h2>No new bookings</h2>
          <p>Check your history for processed requests.</p>
          <button
            className="dashboard-btn"
            onClick={() => navigate("/booking_history")}
          >
            View History
          </button>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking._id} className="booking-card">
            <div className="booking-info">
              <div className="status-row">
                <h3>{booking.name}</h3>
                <span className={`status-tag ${booking.status}`}>
                  {booking.status}
                </span>
              </div>

              <p><strong>Phone:</strong> {booking.phone}</p>
              <p><strong>Date:</strong> {booking.date}</p>
              <p><strong>Time:</strong> {booking.time}</p>
              <p><strong>Message:</strong> {booking.message || "None"}</p>
              <p><strong>Payment:</strong> {booking.paymentMethod}</p>

              {booking.paymentScreenshot && (
                <div className="payment-proof-container">
                  <p><strong>Payment Receipt:</strong></p>
                  <button 
                    className="view-screenshot-trigger"
                    onClick={() => setSelectedImg(booking.paymentScreenshot)}
                  >
                    <FontAwesomeIcon icon={faFileInvoiceDollar} /> View Screenshot
                  </button>
                </div>
              )}
            </div>

            <div className="booking-actions">
              <button
                className="approve-btn"
                onClick={() => updateStatus(booking._id, "approved")}
              >
                Approve
              </button>

              <button
                className="reject-btn"
                onClick={() => updateStatus(booking._id, "rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}

      {/* Screenshot Modal remains the same */}
      {selectedImg && (
        <div className="screenshot-modal-overlay" onClick={() => setSelectedImg(null)}>
          <div className="screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-x" onClick={() => setSelectedImg(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} alt="Payment Receipt" className="full-proof-img" />
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerBookings;