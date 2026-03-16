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

              <div className="form-group">
                <label>Service Requested</label>
                <input type="text" value={b.product?.name || "Deleted Service"} readOnly />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date & Time</label>
                  <input type="text" value={`${b.date} at ${b.time}`} readOnly />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" value={b.phone} readOnly />
                </div>
              </div>
               <h3>Payment Method</h3>
        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
        >
          <option value="cash">Cash on Delivery</option>
          <option value="mobile">Mobile Money</option>
          <option value="card">Card Payment</option>
        </select>

        {/* CONDITIONAL UPLOAD FIELD */}
        {form.paymentMethod !== "cash" && (
          <div className="payment-upload">
            <h3>Upload Payment Screenshot</h3>
            <p className="upload-hint">Please upload a screenshot of your transaction confirmation.</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            {imagePreview && (
              <div className="preview-container">
                <p>Preview:</p>
                <img src={imagePreview} alt="Payment Proof" className="payment-preview-img" />
              </div>
            )}
          </div>
        )}
              <div className="form-group">
                <label>Message/Notes</label>
                <textarea value={b.message} readOnly rows="3" />
              </div>

              <div className="form-status">
                <label>Booking Status:</label>
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