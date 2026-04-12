import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyEmail.css";

function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // --- 1. PERSISTENCE LAYER (DATA RECOVERY) ---
  // We initialize state directly from sessionStorage if the router state is missing (on refresh)
  const [email] = useState(() => state?.email || sessionStorage.getItem("pending_email"));
  const [userRole] = useState(() => state?.role || sessionStorage.getItem("pending_role") || "buyer");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 2. TIMER PERSISTENCE LOGIC ---
  // Calculate remaining seconds based on a future timestamp stored in storage
  const calculateRemaining = () => {
    const expiry = sessionStorage.getItem("timer_expiry");
    if (!expiry) return 0;
    const remaining = Math.floor((parseInt(expiry) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const [timer, setTimer] = useState(calculateRemaining);

  // Function to set a future expiry time (Current Time + 59 seconds)
  const startTimer = useCallback((seconds) => {
    const expiryTime = Date.now() + seconds * 1000;
    sessionStorage.setItem("timer_expiry", expiryTime.toString());
    setTimer(seconds);
  }, []);

  useEffect(() => {
  if (state?.email) {
    sessionStorage.setItem("pending_email", state.email);
    sessionStorage.setItem("pending_role", state.role || "buyer");
  }
}, [state]);

  // --- 4. COUNTDOWN INTERVAL ---
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // --- 5. ACTION HANDLERS ---
  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    
    setLoading(true);
    try {
      const res = await api.post("/api/verify-email", { email, code });
      
      if (res.data.success) {
        // Clear all verification data from storage on success
        sessionStorage.removeItem("pending_email");
        sessionStorage.removeItem("pending_role");
        sessionStorage.removeItem("initial_sent");
        sessionStorage.removeItem("timer_expiry");

        const targetPath = userRole === "seller" ? "/login" : "/buyer_login";
        navigate(targetPath, { 
          state: { message: "Account verified! Please login." } 
        });
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualResend = async () => {
    try {
      setLoading(true);
      const res = await api.post("/api/resend-verification", { 
        email, 
        userType: userRole 
      });

      if (res.data.success) {
        startTimer(59); // Reset the persistent timer
        alert("A new code has been sent!"); 
        setCode(""); 
      } else {
        alert(res.data.message || "Could not resend code.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 6. SAFETY REDIRECT ---
  if (!email || email === "your email") {
    return (
      <div className="verify-page-wrapper">
        <div className="verify-card" style={{ textAlign: "center", padding: "40px" }}>
          <p>Session expired or invalid access.</p>
          <button 
            onClick={() => navigate("/login")} 
            className="submit-btn active"
            style={{ marginTop: "20px" }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page-wrapper">
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>

      <div className="verify-container">
        <div className="brand-logo">
          <span className="brand-isonga">ISONGA</span>
          <span className="brand-market">MARKET</span>
        </div>

        <div className="verify-card">
          <div className="verify-header">
            <div className="icon-badge">
              <ShieldCheck size={32} />
            </div>
            <h2>Verify {userRole === "seller" ? "Seller" : "Buyer"} Account</h2>
            <p>
              Enter the 6-digit code sent to <br />
              <span className="user-email" style={{ fontWeight: "bold", color: "#2563eb" }}>
                {email}
              </span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="verify-form">
            <div className="input-group">
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength="6"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="otp-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className={`submit-btn ${loading || code.length < 6 ? "disabled" : "active"}`}
            >
              {loading ? <Loader2 className="spinner" /> : "Verify & Continue"}
              {!loading && code.length === 6 && <CheckCircle2 size={20} />}
            </button>
          </form>

          <div className="resend-section">
            {timer > 0 ? (
              <p className="timer-text">
                Resend code in <span className="timer-seconds">{timer}s</span>
              </p>
            ) : (
              <button 
                onClick={handleManualResend} 
                className="resend-link"
                disabled={loading}
              >
                {loading ? "Sending..." : "I didn't receive a code"}
              </button>
            )}
          </div>
        </div>

        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;