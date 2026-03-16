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
              {/* SECTION 1: CUSTOMER INFO */}
              <div className="form-section">
                <label className="section-title">Customer Details</label>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={b.name || "N/A"} readOnly />
                </div>
                <div className="form-group">
                  <label>Service</label>
                  <input type="text" value={b.product?.name || "Service Deleted"} readOnly />
                </div>
              </div>

              {/* SECTION 2: PAYMENT INFO (THIS IS WHAT WAS MISSING) */}
              <div className="form-section payment-section">
                <label className="section-title">Payment Information</label>
                
                <div className="form-group">
                  <label>Method</label>
                  <input 
                    type="text" 
                    className="highlight-input" 
                    value={b.paymentMethod || "Not Provided"} 
                    readOnly 
                  />
                </div>

                <div className="screenshot-container">
                  <label>Screenshot / Proof</label>
                  {b.paymentScreenshot ? (
                    <div className="image-box">
                      <a href={b.paymentScreenshot} target="_blank" rel="noreferrer">
                        <img src={b.paymentScreenshot} alt="Payment Proof" />
                      </a>
                      <p className="tap-hint">Tap image to open full size</p>
                    </div>
                  ) : (
                    <div className="missing-proof">
                      ⚠️ No screenshot uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: STATUS */}
              <div className="form-footer">
                <div className="status-row">
                  <label>Booking Status:</label>
                  <span className={`status-text ${b.status?.toLowerCase()}`}>
                    {b.status || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerBookings;