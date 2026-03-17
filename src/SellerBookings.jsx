import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileInvoiceDollar, 
  faTimes, 
  faArrowLeft 
} from "@fortawesome/free-solid-svg-icons";
import "./SellerBookings.css";

function SellerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null); // State to handle the screenshot modal
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
        fetchBookings(); // refresh list
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
        <h1>Service Bookings</h1>
        <div style={{ width: "40px" }}></div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty">
          <h2>No bookings yet</h2>
          <button
            className="dashboard-btn"
            onClick={() => navigate("/seller_dashboard")}
          >
            Back to Dashboard
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

              {/* ✅ MODIFIED: View Screenshot only, no new tab */}
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
              {booking.status === "pending" && (
                <>
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
                </>
              )}
            </div>
          </div>
        ))
      )}

      {/* ✅ IMAGE MODAL OVERLAY */}
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