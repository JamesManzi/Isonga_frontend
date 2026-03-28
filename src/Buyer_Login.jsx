import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight } from "@fortawesome/free-solid-svg-icons";
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
    const res = await api.post("/api/buyer_login");
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
  
  // Optional: Save user info if you need it for the Navbar
  localStorage.setItem("user", JSON.stringify(res.data.buyer));
        setMessage({ text: "Success! Welcome back.", type: "success" });
        setTimeout(() => navigate("/buyer_dashboard"), 1500);
      } else {
        setMessage({ text: res.data.message, type: "error" });
        setLoading(false);
      }
    } catch (error) {
      setMessage({ text: "Server error. Try again later.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="buyer-page">
      {/* Top Loading Bar */}
      {loading && <div className="buyer-top-loading-bar"></div>}

      <div className="buyer-card-container">
        {/* Left Side: Branding/Hero */}
        <div className="buyer-hero-side">
          <div className="buyer-hero-overlay"></div>
          <div className="buyer-hero-content">
            <img src="/logo.png" alt="Logo" className="buyer-hero-logo" />
            <h1>Isonga Market</h1>
            <p>Discover quality products and support local businesses across Rwanda.</p>
            <div className="buyer-hero-footer">
              <span>Join 10,000+ Happy Shoppers 🇷🇼</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="buyer-form-side">
          <div className="buyer-form-header">
            <h2>Buyer Login</h2>
            <p>Sign in to continue your shopping journey</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="buyer-input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="yourname@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="buyer-input-group">
              <label>Password</label>
              <div className="buyer-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="buyer-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            <div className="buyer-form-options">
              <Link to="/buyer-forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="buyer-main-btn" disabled={loading}>
              {loading ? <span className="buyer-loader-dots">Verifying...</span> : (
                <>
                  Sign In <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>

            {message && (
              <div className={`buyer-modern-alert ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="buyer-register-redirect">
              New to Isonga? <Link to="/buyer_register">Create Account</Link>
            </div>
          </form>

          <div className="buyer-form-footer">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Buyer_Login;