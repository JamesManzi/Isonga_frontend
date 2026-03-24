import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEye, 
  faEyeSlash, 
  faArrowRight, 
  faShoppingBasket, 
  faShieldCheck, 
  faMapMarkerAlt 
} from "@fortawesome/free-solid-svg-icons";
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
      console.error(error.response?.data);
      setMessage({ text: "Login failed. Please check your credentials.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="buyer_login_viewport">
      {/* MODERN PROGRESS BAR */}
      {loading && <div className="buyer_login_top_loader"></div>}

      <div className="buyer_login_card_wrapper">
        
        {/* LEFT SIDE: HERO/INFO */}
        <div className="buyer_login_hero_panel">
          <div className="buyer_login_hero_inner">
            <img src="/logo.png" alt="Isonga Logo" className="buyer_login_brand_logo" />
            <h1 className="buyer_login_hero_heading">Shop Smarter.</h1>
            <p className="buyer_login_hero_desc">
              Access quality products from trusted local vendors across Rwanda.
            </p>
            
            <div className="buyer_login_features">
              <div className="buyer_login_feature_item">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="buyer_login_f_icon" />
                <span>Find local shops near you</span>
              </div>
              <div className="buyer_login_feature_item">
                <FontAwesomeIcon icon={faShieldCheck} className="buyer_login_f_icon" />
                <span>Secure payments & verified sellers</span>
              </div>
              <div className="buyer_login_feature_item">
                <FontAwesomeIcon icon={faShoppingBasket} className="buyer_login_f_icon" />
                <span>Track your orders effortlessly</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="buyer_login_form_panel">
          <div className="buyer_login_form_container">
            <header className="buyer_login_header">
              <h2 className="buyer_login_main_title">Buyer Sign In</h2>
              <p className="buyer_login_main_subtitle">Welcome back to Isonga Market</p>
            </header>

            <form onSubmit={handleSubmit} className="buyer_login_actual_form">
              {/* Email Field */}
              <div className="buyer_login_field_box">
                <label className="buyer_login_field_label">Email Address</label>
                <input
                  type="email"
                  className="buyer_login_field_input"
                  placeholder="yourname@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="buyer_login_field_box">
                <label className="buyer_login_field_label">Password</label>
                <div className="buyer_login_pass_relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="buyer_login_field_input"
                    placeholder="Enter password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="buyer_login_pass_eye"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>

              {/* FORGOT PASSWORD LINK */}
              <div className="buyer_login_forgot_container">
                <Link to="/buyer_forgot_password" className="buyer_login_forgot_anchor">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button type="submit" className="buyer_login_action_btn" disabled={loading}>
                {loading ? "Authenticating..." : (
                  <>
                    Sign In <FontAwesomeIcon icon={faArrowRight} />
                  </>
                )}
              </button>

              {/* Feedback Message */}
              {message && (
                <div className={`buyer_login_status_msg ${message.type}`}>
                  {message.text}
                </div>
              )}

              {/* Register Redirect */}
              <div className="buyer_login_switch_prompt">
                New shopper? <Link to="/buyer_register" className="buyer_login_reg_link">Create Account</Link>
              </div>
            </form>

            <footer className="buyer_login_card_footer">
              <Link to="/" className="buyer_login_home_link">← Back to Home</Link>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Buyer_Login;