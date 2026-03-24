import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
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
        setMessage({ text: "Success! Redirecting to shop...", type: "success" });
        setTimeout(() => navigate("/buyer_dashboard"), 1500);
      } else {
        setMessage({ text: res.data.message, type: "error" });
        setLoading(false);
      }
    } catch (error) {
      setMessage({ text: "Login failed. Please check your credentials.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="buyer_login_page_container">
      {/* Loading Progress Bar */}
      {loading && <div className="buyer_login_loading_bar"></div>}

      <div className="buyer_login_card">
        {/* Left Side: Information */}
        <div className="buyer_login_info_panel">
          <div className="buyer_login_info_content">
            <img src="/logo.png" alt="Logo" className="buyer_login_logo_img" />
            <h1 className="buyer_login_hero_title">Isonga Market</h1>
            <p className="buyer_login_hero_text">
              Join thousands of shoppers finding the best deals from local Rwandan sellers.
            </p>
            <div className="buyer_login_feature_badge">
              <FontAwesomeIcon icon={faShoppingBasket} />
              <span>Fast & Secure Shopping</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="buyer_login_form_panel">
          <div className="buyer_login_form_header">
            <h2 className="buyer_login_title">Buyer Login</h2>
            <p className="buyer_login_subtitle">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="buyer_login_main_form">
            <div className="buyer_login_input_group">
              <label className="buyer_login_input_label">Email Address</label>
              <input
                type="email"
                className="buyer_login_input_field"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="buyer_login_input_group">
              <label className="buyer_login_input_label">Password</label>
              <div className="buyer_login_password_wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="buyer_login_input_field"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="buyer_login_password_toggle"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            <button type="submit" className="buyer_login_submit_btn" disabled={loading}>
              {loading ? "Processing..." : (
                <>
                  Sign In <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>

            {message && (
              <div className={`buyer_login_alert ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="buyer_login_footer_links">
              <span>New here?</span>
              <Link to="/buyer_register" className="buyer_login_link_reg">Create Account</Link>
            </div>
          </form>

          <div className="buyer_login_back_home">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Buyer_Login;