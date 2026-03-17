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
    message: "",
    paymentMethod: "cash"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // file upload
  const [paymentImage, setPaymentImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // validation
    if (!form.name || !form.phone || !form.date || !form.time) {
      setError("Please fill all required fields");
      return;
    }

    if (form.paymentMethod !== "cash" && !paymentImage) {
      setError("Please upload payment proof");
      return;
    }

    setLoading(true);

    try {
      // use FormData for file upload
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("date", form.date);
      formData.append("time", form.time);
      formData.append("message", form.message);
      formData.append("paymentMethod", form.paymentMethod);

      if (paymentImage) {
        formData.append("paymentProof", paymentImage);
      }

      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/bookService",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (res.data.success) {
        alert("Booking Sent Successfully!");
        navigate("/buyer_dashboard");
      } else {
        setError(res.data.message || "Booking failed");
      }

    } catch (err) {
      console.error(err);
      setError("Error sending booking");
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

      {error && <p className="booking-error">{error}</p>}

      <form onSubmit={handleSubmit} className="booking-form">

        <label>Your Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label>Phone Number</label>
        <input
          type="tel"
          name="phone"
          placeholder="07XXXXXXXX"
          pattern="07\d{8}"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <label>Booking Date</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <label>Booking Time</label>
        <input
          type="time"
          name="time"
          value={form.time}
          onChange={handleChange}
          required
        />

        <label>Additional Details</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
        />

        {/* PAYMENT SECTION */}
        <label>Payment Method</label>
        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
        >
          <option value="cash">Cash on Service</option>
          <option value="mobile">Mobile Money</option>
          <option value="card">Card</option>
        </select>

        {/* CONDITIONAL FILE UPLOAD */}
        {form.paymentMethod !== "cash" && (
          <div className="payment-upload">
            <label>Upload Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />

            {preview && (
              <div className="preview">
                <p>Preview:</p>
                <img src={preview} alt="preview" width="120" />
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? "Sending..." : "Send Booking"}
        </button>
      </form>
    </div>
  );
}

export default Booking;