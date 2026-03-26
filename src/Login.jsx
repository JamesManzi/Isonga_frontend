import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./Login.css";

function Login() {
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
        "https://isonga-backend.onrender.com/api/login",
        { email, password },
        { withCredentials: false }
      );

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
  
  // Optional: Save user info if you need it for the Navbar
  localStorage.setItem("user", JSON.stringify(res.data.seller));
        setMessage({ text: "Success! Welcome back.", type: "success" });
        setTimeout(() => navigate("/dashboard"), 1500);
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
    <div className="login-page">
      {/* Top Loading Bar */}
      {loading && <div className="top-loading-bar"></div>}

      <div className="login-card-container">
        {/* Left Side: Branding/Hero */}
        <div className="login-hero-side">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <img src="/logo.png" alt="Logo" className="hero-logo" />
            <h1>Isonga Market</h1>
            <p>Empowering Rwandan entrepreneurs to reach more customers, faster.</p>
            <div className="hero-footer">
              <span>Trusted by 500+ Local Shops 🇷🇼</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-side">
          <div className="form-header">
            <h2>Seller Login</h2>
            <p>Enter your credentials to manage your store</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            <div className="form-options">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="main-login-btn" disabled={loading}>
              {loading ? <span className="loader-dots">Authenticating...</span> : (
                <>
                  Sign In <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>

            {message && (
              <div className={`modern-alert ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="register-redirect">
              Don't have a shop yet? <Link to="/register">Create Account</Link>
            </div>
          </form>

          <div className="form-footer">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;