import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faShoppingBag, faShieldCheck, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import "./Buyer_Login.css";

function Buyer_Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/buyer_login",
        { email, password },
        { withCredentials: true }
      );

      if (res.data.success) {
        setMessage({ text: "Welcome back! Heading to shop...", type: "success" });
        setTimeout(() => navigate("/buyer_dashboard"), 1500);
      } else {
        setMessage({ text: res.data.message, type: "error" });
        setLoading(false);
      }
    } catch (error) {
      setMessage({ text: "Login failed. Please try again.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="bl-viewport">
      {loading && <div className="bl-top-loader"></div>}

      <div className="bl-main-wrapper">
        {/* INFO SIDE (Blue/Indigo) */}
        <div className="bl-info-panel">
          <div className="bl-info-inner">
            <img src="/logo.png" alt="Logo" className="bl-brand-logo" />
            <h1 className="bl-hero-title">Shop Smarter.</h1>
            <p className="bl-hero-subtitle">Access the best local vendors in Rwanda from one secure account.</p>
            
            <div className="bl-feature-list">
              <div className="bl-feature-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="bl-f-icon" />
                <span>Find shops in your neighborhood</span>
              </div>
              <div className="bl-feature-item">
                <FontAwesomeIcon icon={faShieldCheck} className="bl-f-icon" />
                <span>Secure payments & verified sellers</span>
              </div>
              <div className="bl-feature-item">
                <FontAwesomeIcon icon={faShoppingBag} className="bl-f-icon" />
                <span>Track your orders in real-time</span>
              </div>
            </div>
          </div>
        </div>

        {/* LOGIN SIDE */}
        <div className="bl-form-panel">
          <div className="bl-form-container">
            <header className="bl-form-header">
              <h2 className="bl-title">Buyer Sign In</h2>
              <p className="bl-subtitle">Welcome back to Isonga Market</p>
            </header>

            <form onSubmit={handleSubmit} className="bl-auth-form">
              <div className="bl-input-field">
                <label className="bl-label">Email Address</label>
                <input
                  type="email"
                  className="bl-control"
                  placeholder="name@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="bl-input-field">
                <label className="bl-label">Password</label>
                <div className="bl-pass-box">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="bl-control"
                    placeholder="Enter password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="bl-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>

              <button type="submit" className="bl-action-btn" disabled={loading}>
                {loading ? "Verifying..." : "Sign In to Shop"}
              </button>

              {message && (
                <div className={`bl-feedback-msg ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="bl-account-switch">
                New shopper? <Link to="/buyer_register" className="bl-link-highlight">Create Account</Link>
              </div>
            </form>

            <footer className="bl-form-footer">
              <Link to="/" className="bl-back-home">← Return Home</Link>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Buyer_Login;