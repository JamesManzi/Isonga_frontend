import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "./Buyer_Login.css";

function Buyer_Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setMessage({ text: "Success! Redirecting...", type: "success" });
        setTimeout(() => {
          navigate("/buyer_dashboard");
        }, 1500);
      } else {
        setMessage({ text: res.data.message || "Login failed", type: "error" });
        setLoading(false);
      }
    } catch (error) {
      setMessage({ text: "Error connecting to server.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="buyer_login_container">
      {/* MODERN TOP LOADING BAR */}
      {loading && <div className="buyer_login_line_loader"></div>}

      <div className="buyer_login_navbar">
        <div className="buyer_login_logo">
          <img src="/logo.png" alt="Logo" />
        </div>
        <div className="buyer_login_heads">
          <h1>Isonga</h1>
          <h2>Market</h2>
        </div>
      </div>

      <div className="buyer_login_main_section">
        <div className="buyer_login_hero">
          <h1>Welcome Back to Isonga Market</h1>
          <p>
            Continue exploring quality products and trusted stores.
            Sign in now and enjoy a smarter, faster shopping experience.
          </p>
          <ul className="buyer_login_list">
            <li>✓ Discover products near you</li>
            <li>✓ Save your favorite items</li>
            <li>✓ Shop with confidence</li>
          </ul>
        </div>

        <div className="buyer_login_form_box">
          <form onSubmit={handleSubmit}>
            <h2>Buyer Login</h2>
            
            <label>Email</label>
            <input
              type="email"
              className="buyer_login_input"
              placeholder="Enter Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              className="buyer_login_input"
              placeholder="Enter Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* FORGOT PASSWORD LINK */}
            <div className="buyer_login_forgot">
              <Link to="/buyer_forgot_password">Forgot Password?</Link>
            </div>

            <div className="buyer_login_btn_wrapper">
              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>

            <div className="buyer_login_links">
              <Link to="/buyer_register">Register</Link>
              <Link to="/">Home</Link>
            </div>

            {message && (
              <div className={`buyer_login_alert ${message.type}`}>
                <span className="buyer_login_alert_icon">
                  {message.type === "success" ? "✓" : "⚠"}
                </span>
                <span>{message.text}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Buyer_Login;