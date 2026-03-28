import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "./api";
import "./Booking.css";

function Booking() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [message, setMessage] = useState(null); 
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    message: "",
    paymentMethod: "cash"
  });

  const [loading, setLoading] = useState(false);
  const [paymentImage, setPaymentImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // ✅ ADDED: Function to handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ ADDED: Function to handle file uploads and image preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentImage(file);
      setPreview(URL.createObjectURL(file)); // Creates a temporary URL for the preview <img>
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null); 

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
  // CHANGE "paymentImage" TO "paymentProof"
  formData.append("paymentProof", paymentImage); 
}

      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/bookService",
        formData,
        {
          withCredentials: false,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (res.data.success) {
        setMessage({ text: "Booking Successful!", type: "success" });
        setTimeout(() => {
          navigate("/buyer_dashboard");
        }, 1500);
      } else {
        setMessage({ text: "Booking Failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server Error. Try again later.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h2>Book Service</h2>
        <div className="booking-actions">
          {/* ✅ Updated to return to previous page */}
          <button onClick={() => navigate(-1)} className="btn-back">Back</button>
          <Link to="/login" className="btn-logout">Logout</Link>
        </div>
      </div>

      {/* ✅ Fixed: Changed 'error' to 'message' to match your state */}
      {message && message.type === "error" && (
        <p className="booking-error">{message.text}</p>
      )}

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
          onChange={handleChange}
        />

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