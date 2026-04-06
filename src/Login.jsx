import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [lockTime, setLockTime] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const navigate = useNavigate();
  const MAX_ATTEMPTS = 5;

  // ✅ Load saved attempts + lock on page load
  useEffect(() => {
    const savedAttempts = localStorage.getItem("attempts");
    const lockUntil = localStorage.getItem("lockUntil");

    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts));
    }

    if (lockUntil) {
      const remaining = Math.floor((parseInt(lockUntil) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockTime(remaining);
      } else {
        localStorage.removeItem("lockUntil");
      }
    }
  }, []);

  // ✅ Save attempts whenever they change
  useEffect(() => {
    localStorage.setItem("attempts", attempts);
  }, [attempts]);

  // ✅ Countdown timer
  useEffect(() => {
    let timer;

    if (lockTime > 0) {
      timer = setInterval(() => {
        setLockTime((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("lockUntil");
            localStorage.removeItem("attempts"); // reset attempts after lock ends
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [lockTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockTime > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/api/login", { email, password });

      if (res.data.success) {
        const user = res.data.seller;
        // ✅ Clear all security data
        localStorage.removeItem("attempts");
        localStorage.removeItem("lockUntil");

        setAttempts(0);
        setLockTime(0);
        // ✅ Save user
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.seller));
       if (!user.isVerified) {
    navigate("/verify-email");
    return;
         }
        setMessage({ text: "Success! Welcome back.", type: "success" });

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        handleFailure(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || "Login failed. Please try again.";
      handleFailure(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFailure = (errorText) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      const expiryTime = Date.now() + 30000; // 30 seconds

      localStorage.setItem("lockUntil", expiryTime);

      setLockTime(30);

      setMessage({
        text: "Too many attempts. Locked for 30 seconds.",
        type: "error",
      });
    } else {
      setMessage({
        text: `${errorText}. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
        type: "error",
      });
    }
  };
  return (
    <div className="login-page">
      {loading && <div className="top-loading-bar"></div>}

      <div className="login-card-container">
        {/* Left Side */}
        <div className="login-hero-side">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <img src="/logo.png" alt="Logo" className="hero-logo" />
            <h1>Isonga Market</h1>
            <p>Empowering Rwandan entrepreneurs to reach more customers, faster.</p>
          </div>
        </div>

        {/* Right Side */}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={lockTime > 0}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={lockTime > 0}
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="password-toggle"  
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="main-login-btn"
              disabled={loading || lockTime > 0}
            >
              {lockTime > 0
                ? `Locked (${lockTime}s)`
                : loading
                ? "Authenticating..."
                : (
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