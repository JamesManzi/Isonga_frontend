import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyEmail.css";

function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // --- PERSISTENCE LOGIC ---
  // If state is lost (refresh), try to get data from sessionStorage
  const [email] = useState(state?.email || sessionStorage.getItem("pending_email"));
  const [userRole] = useState(state?.role || sessionStorage.getItem("pending_role") || "buyer");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(59);

  // 1. Sync data to sessionStorage on load and trigger initial code
  useEffect(() => {
    if (state?.email) {
      sessionStorage.setItem("pending_email", state.email);
      sessionStorage.setItem("pending_role", state.role || "buyer");
    }

    // Automatically trigger code if we have an email and haven't sent one yet this session
    if (email && !sessionStorage.getItem("initial_sent")) {
      autoResend();
    }
  }, [state, email]);

  // 2. Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) setTimer(timer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Hidden auto-resend for the first load
  const autoResend = async () => {
    try {
      await api.post("/api/resend-verification", { 
        email, 
        userType: userRole 
      });
      sessionStorage.setItem("initial_sent", "true");
    } catch (err) {
      console.error("Auto-resend failed", err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    
    setLoading(true);
    try {
      const res = await api.post("/api/verify-email", { email, code });
      
      if (res.data.success) {
        // SUCCESS: Clear session data
        sessionStorage.removeItem("pending_email");
        sessionStorage.removeItem("pending_role");
        sessionStorage.removeItem("initial_sent");

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

  const handleResend = async () => {
    try {
      setLoading(true);
      const res = await api.post("/api/resend-verification", { 
        email, 
        userType: userRole 
      });

      if (res.data.success) {
        setTimer(59);
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

  // 3. Safety Redirect: If no email is found even in storage, send back to login
  if (!email || email === "your email") {
    return (
      <div className="verify-page-wrapper">
        <div className="verify-card" style={{ textAlign: 'center' }}>
          <p>Session expired. Please log in again.</p>
          <button onClick={() => navigate("/login")} className="submit-btn active">Back to Login</button>
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
              We’ve sent a 6-digit code to <br />
              <span className="user-email">{email}</span>
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
                onClick={handleResend} 
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