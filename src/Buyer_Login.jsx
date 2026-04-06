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
  const navigate = useNavigate();

  // --- Login Attempts Logic ---
  const [attempts, setAttempts] = useState(0);
  const [lockTime, setLockTime] = useState(0);
  const MAX_ATTEMPTS = 5;

  // --- Load saved attempts/lock (NO REFRESH RESET FIX) ---
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
        localStorage.removeItem("buyer_attempts");
      }
    }
  }, []);

  // --- Save attempts ---
  useEffect(() => {
    localStorage.setItem("buyer_attempts", attempts);
  }, [attempts]);

  // Countdown Timer
  useEffect(() => {
    if (lockTime > 0) {
      const timer = setInterval(() => {
        setLockTime((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("buyer_lockUntil");
            localStorage.removeItem("buyer_attempts");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockTime > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/api/buyer_login", { email, password });

      if (res.data.success) {
        const user = res.data.buyer;

        // 1. Handle Unverified Buyers First
        if (user.isVerified === false) {
          // Pass the email and role to the VerifyEmail page
          navigate("/verify-email", { 
            state: { email: user.email, role: "buyer" } 
          });
          return; // Stop execution here
        }

        // 2. Verified Buyer Success Path
        // Clear security data
        localStorage.removeItem("buyer_attempts");
        localStorage.removeItem("buyer_lockUntil");
        setAttempts(0);
        setLockTime(0);

        // Save session data
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(user));

        setMessage({ text: "Success! Welcome back.", type: "success" });
        
        // Navigate to buyer dashboard after a short delay
        setTimeout(() => navigate("/buyer_dashboard"), 1200);

      } else {
        handleFailure(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      // Check for specific backend messages regarding verification
      const errMsg = error.response?.data?.message || "Login failed. Please try again.";
      handleFailure(errMsg);
    } finally {
      setLoading(false);
    }
  };
  const handleFailure = (errorText) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + 30 * 1000; // 30 sec lock

      localStorage.setItem("buyer_lockUntil", lockUntil);
      setLockTime(30);

      setMessage({ 
        text: "Too many attempts. Locked for 30s.", 
        type: "error" 
      });
    } else {
      setMessage({ 
        text: `${errorText} (${MAX_ATTEMPTS - newAttempts} attempts left)`, 
        type: "error" 
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
                placeholder="yourname@example.com"
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
                  placeholder="••••••••"
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

            <div className="buyer-form-options">
              <Link to="/forgot-password">Forgot password?</Link>
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