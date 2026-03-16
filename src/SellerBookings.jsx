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
              {/* Customer Info Section */}
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" value={b.name} readOnly />
              </div>

              <div className="form-group">
                <label>Service</label>
                <input type="text" value={b.product?.name || "Deleted Service"} readOnly />
              </div>

              {/* PAYMENT SECTION - Using your requested structure */}
              <h3>Payment Method</h3>
              <select
                name="paymentMethod"
                value={b.paymentMethod} // Uses the booking's data
                disabled // Keep it disabled so the seller doesn't accidentally change it
              >
                <option value="cash">Cash on Delivery</option>
                <option value="mobile">Mobile Money</option>
                <option value="card">Card Payment</option>
              </select>

              {/* CONDITIONAL UPLOAD FIELD - Shows the saved screenshot */}
              {b.paymentMethod !== "cash" && (
                <div className="payment-upload">
                  <h3>Payment Screenshot</h3>
                  {b.paymentScreenshot ? (
                    <div className="preview-container">
                      <p>Customer Uploaded Proof:</p>
                      <a href={b.paymentScreenshot} target="_blank" rel="noreferrer">
                        <img 
                          src={b.paymentScreenshot} 
                          alt="Payment Proof" 
                          className="payment-preview-img" 
                        />
                      </a>
                    </div>
                  ) : (
                    <p className="no-upload-error">⚠️ No screenshot was uploaded by the customer.</p>
                  )}
                </div>
              )}

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Message</label>
                <textarea value={b.message} readOnly rows="2" />
              </div>

              <div className="form-status">
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