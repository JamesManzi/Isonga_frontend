import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // Clear old messages

    try {
      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/login",
        { email, password },
        { withCredentials: true }
      );

      if (res.data.success) {
        setMessage({ text: "Login Successful! Redirecting...", type: "success" });
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage({ text: res.data.message, type: "error" });
        setLoading(false);
      }
    } catch (error) {
      setMessage({ text: "Login failed. Please check your connection.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="Login">
      {/* MODERN LOADING OVERLAY */}
      {loading && (
        <div className="modern-loader-overlay">
          <div className="loader-content">
            <div className="spinner-modern"></div>
            <p>Authenticating...</p>
          </div>
        </div>
      )}

      <div className="Login_navbar">
        <div className="Login_logo">
          <img src="/logo.png" alt="logo" />
        </div>
        <div className="Login_heads">
          <h1>Isonga</h1>
          <h2>Market</h2>
        </div>
      </div>

      <div className="Login_Container">
        <div className="Login_Hero">
          <h1>Welcome Back to Isonga Market</h1>
          <p>
            Your business journey continues here. Manage your inventory, respond
            to customers, and track your performance.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="Login_form">
            <h2>Seller Login</h2>
            
            <label>Email</label>
            <input
              type="email"
              className="login-input"
              placeholder="Enter Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              className="login-input"
              placeholder="Enter Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="Login_btn">
              <button type="submit" disabled={loading} className={loading ? "btn-dim" : ""}>
                {loading ? "Please Wait..." : "Login"}
              </button>
            </div>

            <div className="Login_links">
              <Link to="/register">Register</Link>
              <Link to="/">Home</Link>
            </div>
          </div>

          {message && (
            <div className={`alert-modern ${message.type}`}>
              <span className="alert-icon">
                {message.type === "success" ? "✓" : "✕"}
              </span>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;