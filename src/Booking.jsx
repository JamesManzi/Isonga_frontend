import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Booking.css";

function Booking() {
  const { productId } = useParams();
  const navigate = useNavigate();

  // State for messages (Success/Error)
  const [message, setMessage] = useState(null);

  // Form Data State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    message: "",
    paymentMethod: "cash",
  });

  const [loading, setLoading] = useState(false);
  const [paymentImage, setPaymentImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // ✅ Fix 1: Added missing handleChange function
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Fix 2: Added missing handleFileChange function
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentImage(file);
      // Create a local URL for the image preview
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null); // Clear previous messages

    // Validation
    if (!form.name || !form.phone || !form.date || !form.time) {
      setMessage({ text: "Please fill all required fields", type: "error" });
      return;
    }

    if (form.paymentMethod !== "cash" && !paymentImage) {
      setMessage({ text: "Please upload payment proof", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("date", form.date);
      formData.append("time", form.time);
      formData.append("message", form.message);
      formData.append("paymentMethod", form.paymentMethod);
      
      if (paymentImage) {
        formData.append("paymentImage", paymentImage);
      }

      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/bookService",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        setMessage({ text: "Booking Successful!", type: "success" });
        // Redirect after a short delay so user sees the success message
        setTimeout(() => {
          navigate("/buyer_dashboard");
        }, 1500);
      } else {
        setMessage({ text: res.data.message || "Booking Failed", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "Server Error. Try again later.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      {/* Header Section */}
      <div className="booking-header">
        <h2>Book Service</h2>
        <div className="booking-actions">
          {/* ✅ Fix 3: Updated to navigate(-1) for dynamic back behavior */}
          <button onClick={() => navigate(-1)} className="btn-back">
            Back
          </button>
          <Link to="/login" className="btn-logout">
            Logout
          </Link>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="booking-form">
        <label>Your Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          placeholder="Enter Your Name"
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
          placeholder="Any specific requests?"
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
                <img src={preview} alt="preview" width="120" style={{ borderRadius: "8px" }} />
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? "Sending..." : "Send Booking"}
        </button>
      </form>

      {/* Alert Message Overlay */}
      {message && (
        <div className={`alert ${message.type}`}>
          <span className="alert-icon">
            {message.type === "success" ? "✓" : "⚠"}
          </span>
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}

export default Booking;