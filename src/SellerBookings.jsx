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
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="no-bookings">No bookings found yet.</div>
      ) : (
        <div className="table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Date & Time</th>
                <th>Phone</th>
                <th>Payment Method</th>
                <th>Payment Proof</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.name}</td>
                  <td>{b.product?.name || "Deleted Service"}</td>
                  <td>{b.date} at {b.time}</td>
                  <td>{b.phone}</td>
                  
                  {/* PAYMENT METHOD COLUMN */}
                  <td className="payment-method-cell">
                    <span className={`payment-tag ${b.paymentMethod}`}>
                      {b.paymentMethod === "mobile" ? "📱 MoMo" : 
                       b.paymentMethod === "card" ? "💳 Card" : "💵 Cash"}
                    </span>
                  </td>

                  {/* PAYMENT PROOF COLUMN */}
                  <td>
                    {b.paymentProof ? (
                      <div className="proof-preview">
                        <a 
                          href={`https://isonga-backend.onrender.com/${b.paymentProof}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <img 
                            src={`https://isonga-backend.onrender.com/${b.paymentProof}`} 
                            alt="Proof" 
                            className="booking-thumbnail"
                          />
                        </a>
                      </div>
                    ) : (
                      <span className="no-proof-text">No Proof</span>
                    )}
                  </td>

                  <td className="msg-cell">{b.message}</td>
                  <td>
                    <span className={`status-badge ${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SellerBookings;