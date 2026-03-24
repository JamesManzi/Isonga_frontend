import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
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
        setMessage({ text: "Welcome back! Redirecting...", type: "success" });
        setTimeout(() => navigate("/buyer_dashboard"), 1500);
      } else {
        setMessage({ text: res.data.message, type: "error" });
        setLoading(false);
      }
    } catch (error) {
      console.log(error.response?.data);
      setMessage({ text: "Login failed. Please try again.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="buyer-login-page">
      {/* Top Progress Bar */}
      {loading && <div className="buyer-progress-bar"></div>}

      <div className="login-card-container">
        {/* Left Side: Hero */}
        <div className="buyer-hero-side">
          <div className="hero-content">
            <img src="/logo.png" alt="Logo" className="hero-logo" />
            <h1>Welcome Back!</h1>
            <p>Continue exploring quality products and trusted stores across Rwanda.</p>
            
            <ul className="hero-features">
              <li><FontAwesomeIcon icon={faCheckCircle} /> Discover products near you</li>
              <li><FontAwesomeIcon icon={faCheckCircle} /> Save your favorite items</li>
              <li><FontAwesomeIcon icon={faCheckCircle} /> Shop with confidence</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-side">
          <div className="form-header">
            <h2>Buyer Login</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="yourname@example.com"
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

            <button type="submit" className="buyer-main-btn" disabled={loading}>
              {loading ? "Authenticating..." : (
                <>
                  Login <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>

            {message && (
              <div className={`modern-alert ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="register-redirect">
              New here? <Link to="/buyer_register">Create an account</Link>
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

export default Buyer_Login;