import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faLock } from "@fortawesome/free-solid-svg-icons";
import "./Buyer_Login.css";
import api from "./api";

function Buyer_Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [attempts, setAttempts] = useState(0);
  const [lockTime, setLockTime] = useState(0);

  const navigate = useNavigate();
  const MAX_ATTEMPTS = 5;

  // ✅ Load saved attempts + lock
  useEffect(() => {
    const savedAttempts = localStorage.getItem("buyer_attempts");
    const lockUntil = localStorage.getItem("buyer_lockUntil");

    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts));
    }

    if (lockUntil) {
      const remaining = Math.floor((parseInt(lockUntil) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockTime(remaining);
      } else {
        localStorage.removeItem("buyer_lockUntil");
      }
    }
  }, []);

  // ✅ Save attempts
  useEffect(() => {
    localStorage.setItem("buyer_attempts", attempts);
  }, [attempts]);

  // ✅ Countdown timer
  useEffect(() => {
    let timer;

    if (lockTime > 0) {
      timer = setInterval(() => {
        setLockTime((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("buyer_lockUntil");
            localStorage.removeItem("buyer_attempts");
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
      const res = await api.post("/api/buyer_login", { email, password });

      if (res.data.success) {
        // ✅ Clear lock + attempts
        localStorage.removeItem("buyer_attempts");
        localStorage.removeItem("buyer_lockUntil");

        setAttempts(0);
        setLockTime(0);

        // ✅ Save user
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.buyer));

        setMessage({ text: "Success! Welcome back.", type: "success" });

        setTimeout(() => navigate("/buyer_dashboard"), 1500);
      } else {
        handleFailure(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || "Server error. Please try again later.";
      handleFailure(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFailure = (errorText) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      const expiryTime = Date.now() + 30000; // 30 sec

      localStorage.setItem("buyer_lockUntil", expiryTime);

      setLockTime(30);

      setMessage({
        text: "Too many attempts. Locked for 30 seconds.",
        type: "error",
      });
    } else {
      setMessage({
        text: `${errorText} (${MAX_ATTEMPTS - newAttempts} attempts left)`,
        type: "error",
      });
    }
  };

  return (
    <div className="buyer-page">
      {loading && <div className="buyer-top-loading-bar"></div>}

      <div className="buyer-card-container">
        <div className="buyer-hero-side">
          <div className="buyer-hero-overlay"></div>
          <div className="buyer-hero-content">
            <img src="/logo.png" alt="Logo" className="buyer-hero-logo" />
            <h1>Isonga Market</h1>
            <p>Discover quality products and support local businesses across Rwanda.</p>
          </div>
        </div>

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
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={lockTime > 0}
              />
            </div>

            <div className="buyer-input-group">
              <label>Password</label>
              <div className="buyer-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={lockTime > 0}
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="buyer-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="buyer-main-btn"
              disabled={loading || lockTime > 0}
            >
              {lockTime > 0 ? (
                <>Locked ({lockTime}s) <FontAwesomeIcon icon={faLock} /></>
              ) : loading ? (
                "Verifying..."
              ) : (
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
          </form>
        </div>
      </div>
    </div>
  );
}

export default Buyer_Login;