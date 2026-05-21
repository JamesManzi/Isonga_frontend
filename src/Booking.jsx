import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "./api";
import "./Booking.css";

function Booking() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerTotal, setSellerTotal] = useState(0);

  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    message: "",
    paymentMethod: ""
  });

  const [loading, setLoading] = useState(false);

  const [paymentImage, setPaymentImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // ================= FETCH PRODUCT =================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/product/${productId}`);

        if (res.data.success) {
          const prod = res.data.product;

          setProduct(prod);
          setSeller(prod.seller);
          setSellerTotal(prod.price);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchProduct();
  }, [productId]);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ================= FILE CHANGE =================
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setPaymentImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage(null);

    if (!form.name || !form.phone || !form.date || !form.time) {
      setMessage({
        text: "Please fill all required fields",
        type: "error"
      });
      return;
    }

    if (form.paymentMethod === "mobile" && !paymentImage) {
      setMessage({
        text: "Please upload payment screenshot",
        type: "error"
      });
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
        formData.append("paymentProof", paymentImage);
      }

      const res = await api.post("/api/bookService", formData);

      if (res.data.success) {
        setMessage({
          text: "Booking Successful!",
          type: "success"
        });

        setTimeout(() => {
          navigate("/buyer_dashboard");
        }, 1500);

      } else {
        setMessage({
          text: "Booking Failed",
          type: "error"
        });
      }

    } catch (err) {
      console.log(err);

      setMessage({
        text: "Server Error. Try again later.",
        type: "error"
      });

    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="booking-container">

      {/* HEADER */}
      <div className="booking-header">
        <h2>Book Service</h2>

        <div className="booking-actions">
          <button
            onClick={() => navigate(-1)}
            className="btn-back"
          >
            Back
          </button>

          <Link to="/login" className="btn-logout">
            Logout
          </Link>
        </div>
      </div>

      {/* ERROR */}
      {message && message.type === "error" && (
        <p className="booking-error">{message.text}</p>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="booking-form">

        <label>Your Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your name"
          required
        />

        <label>Phone Number</label>
        <input
          type="tel"
          name="phone"
          pattern="07\d{8}"
          value={form.phone}
          onChange={handleChange}
          placeholder="07XXXXXXXX"
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
          placeholder="Additional details..."
        />

        {/* PAYMENT METHOD */}
        <label>Payment Method</label>

        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
          required
        >
          <option value="">---Select Method----</option>
          <option value="cash">Cash on Service</option>
          <option value="mobile">Mobile Money</option>
        </select>

        {/* MOBILE MONEY SECTION */}
        {seller && form.paymentMethod === "mobile" && (
          <div className="seller-card">

            <h3>Payment Instructions</h3>

            <p>
              <strong>Seller:</strong> {seller.name}
            </p>

            <p>
              <strong>Phone:</strong> {seller.phone}
            </p>

            <p>
              <strong>Amount:</strong> {sellerTotal} Rwf
            </p>

            <p>
              Dial:
              {" "}
              *182*1*1*{seller.phone}*{sellerTotal}#
            </p>

            {/* UPLOAD SCREENSHOT */}
            <div className="payment-upload">

              <label>Upload Payment Screenshot</label>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              {preview && (
                <div className="preview">
                  <img
                    src={preview}
                    alt="preview"
                    width="140"
                  />
                </div>
              )}

            </div>

          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
        >
          {loading ? "Sending..." : "Send Booking"}
        </button>

      </form>

      {/* SUCCESS / ERROR */}
      {message && (
        <div className={`alert ${message.type}`}>
          <span>
            {message.type === "success" ? "✓" : "⚠"}
          </span>

          <span>{message.text}</span>
        </div>
      )}

    </div>
  );
}

export default Booking;