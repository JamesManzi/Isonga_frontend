import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Booking.css";

function Booking() {
  const { productId } = useParams(); // ID of the service
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/bookService",
        {
          productId,
          ...form
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Booking Sent Successfully!");
        // Reset form
        setForm({
          name: "",
          phone: "",
          date: "",
          time: "",
          message: ""
        });
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
      <h2>Book Service</h2>

      <form onSubmit={handleSubmit} className="booking-form">

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          pattern="07\d{8}"
          required
        />

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <input
          type="time"
          name="time"
          value={form.time}
          onChange={handleChange}
          required
        />

        <textarea
          name="message"
          placeholder="Additional details"
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