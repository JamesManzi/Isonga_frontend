import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ".Booking.css";
function Booking() {
  const { productId } = useParams();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    message: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/api/book", {
        productId,
        ...form
      });

      alert("Booking Sent!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="booking-container">
      <h2>Book Service</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="date"
          onChange={handleChange}
          required
        />

        <textarea
          name="message"
          placeholder="Additional details"
          onChange={handleChange}
        />

        <button type="submit">Send Booking</button>

      </form>
    </div>
  );
}

export default Booking;