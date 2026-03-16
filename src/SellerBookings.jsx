import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SellerBookings.css";

function SellerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get("https://isonga-backend.onrender.com/api/seller/bookings", {
          withCredentials: true,
        });
        if (res.data.success) {
          setBookings(res.data.bookings);
        }
      } catch (err) {
        console.error("Error fetching bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <button onClick={() => navigate(-1)} className="btn-back">← Back</button>
        <h2>Service Bookings</h2>
      </div>

      {loading ? (
        <p className="loading-text">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="no-bookings">No bookings found yet.</div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b._id} className="booking-form-card">
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" value={b.name} readOnly />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Service</label>
                  <input type="text" value={b.product?.name || "Deleted Service"} readOnly />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={b.phone} readOnly />
                </div>
              </div>

              {/* PAYMENT SECTION */}
              <div className="payment-details-section">
                <div className="form-group">
                  <label>Payment Method</label>
                  <input type="text" value={b.paymentMethod || "Not Specified"} readOnly className="payment-method-input" />
                </div>

                {/* SHOW SCREENSHOT IF IT EXISTS */}
                {b.paymentScreenshot && (
                  <div className="screenshot-display">
                    <label>Payment Proof</label>
                    <div className="image-container">
                      <a href={b.paymentScreenshot} target="_blank" rel="noreferrer">
                        <img 
                          src={b.paymentScreenshot} 
                          alt="Payment Screenshot" 
                          className="view-payment-img" 
                        />
                      </a>
                      <p className="zoom-hint">Click image to enlarge</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Customer Message</label>
                <textarea value={b.message} readOnly rows="2" />
              </div>

              <div className="form-status">
                <label>Status:</label>
                <span className={`status-badge ${b.status.toLowerCase()}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerBookings;