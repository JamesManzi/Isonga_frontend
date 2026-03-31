import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";

function BuyerBookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const getBooking = async () => {
      const res = await api.get(`/api/bookings/${id}`);
      if (res.data.success) {
        setBooking(res.data.booking);
      }
    };
    getBooking();
  }, [id]);

  if (!booking) return <p>Loading...</p>;

  return (
    <div style={containerStyle}>
      <Link to="/notifications">← Back</Link>

      <h1>Booking Details</h1>

      <div style={cardStyle}>
        <p><strong>Name:</strong> {booking.name}</p>
        <p><strong>Phone:</strong> {booking.phone}</p>
        <p><strong>Date:</strong> {booking.date}</p>
        <p><strong>Time:</strong> {booking.time}</p>
        <p><strong>Payment:</strong> {booking.paymentMethod}</p>

        {booking.fileUrl && (
          <button onClick={() => window.open(booking.fileUrl)}>
            ⬇ Download
          </button>
        )}
      </div>
    </div>
  );
}

export default BuyerBookingDetails;