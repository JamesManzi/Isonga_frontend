import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Booking.css";

function Booking() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/bookService",
        { productId, ...form },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Booking Sent Successfully!");
        setForm({ name: "", phone: "", date: "", time: "", message: "" });
      } else {
        alert(res.data.message || "Booking failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h2>Book Service</h2>
        <div className="booking-actions">
          <button onClick={() => navigate(-1)} className="btn-back">Back</button>
          <Link to="/login" className="btn-logout">Logout</Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">

        <label htmlFor="name">Your Name</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Enter your name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="tel"
          name="phone"
          placeholder="07XXXXXXXX"
          pattern="07\d{8}"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <label htmlFor="date">Booking Date</label>
        <input
          id="date"
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <label htmlFor="time">Booking Time</label>
        <input
          id="time"
          type="time"
          name="time"
          value={form.time}
          onChange={handleChange}
          required
        />

        <label htmlFor="message">Additional Details</label>
        <textarea
          id="message"
          name="message"
          placeholder="Write any additional information..."
          value={form.message}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Booking"}
        </button>
      </form>
    </div>
  );
}

export default Booking;