import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyBuyerEmail.css";

function VerifyBuyerEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Specifically for Buyer
  const [email] = useState(() => state?.email || sessionStorage.getItem("pending_buyer_email"));
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateRemaining = () => {
    const expiry = sessionStorage.getItem("buyer_timer_expiry");
    if (!expiry) return 0;
    const remaining = Math.floor((parseInt(expiry) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const [timer, setTimer] = useState(calculateRemaining);

  const startTimer = useCallback((seconds) => {
    const expiryTime = Date.now() + seconds * 1000;
    sessionStorage.setItem("buyer_timer_expiry", expiryTime.toString());
    setTimer(seconds);
  }, []);

  useEffect(() => {
    if (state?.email) {
      sessionStorage.setItem("pending_buyer_email", state.email);
    }
  }, [state]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    
    setLoading(true);
    try {
      const res = await api.post("/api/buyer-verify-email", { email, code, role: "buyer" });
      
      if (res.data.success) {
        sessionStorage.removeItem("pending_buyer_email");
        sessionStorage.removeItem("buyer_timer_expiry");

        navigate("/buyer_login", { 
          state: { message: "Buyer account verified! Please login." } 
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
      const res = await api.post("/api/buyer-resend-verification", { email, userType: "buyer" });
      if (res.data.success) {
        startTimer(59);
        alert("Buyer verification code resent!"); 
        setCode(""); 
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="verify-page-wrapper">
        <div className="verify-card" style={{ textAlign: "center", padding: "40px" }}>
          <p>Buyer session expired.</p>
          <button onClick={() => navigate("/buyer_login")} className="submit-btn active">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page-wrapper buyer-theme">
      <div className="verify-container">
        <div className="brand-logo">
          <span className="brand-isonga">ISONGA</span>
          <span className="brand-market">BUYER</span>
        </div>
        <div className="verify-card">
          <div className="verify-header">
            <div className="icon-badge buyer-icon">
              <ShieldCheck size={32} />
            </div>
            <h2>Verify Buyer Account</h2>
            <p>Code sent to: <b>{email}</b></p>
          </div>
          <form onSubmit={handleVerify} className="verify-form">
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="otp-input"
            />
            <button type="submit" disabled={loading || code.length < 6} className={`submit-btn ${loading || code.length < 6 ? "disabled" : "active"}`}>
              {loading ? <Loader2 className="spinner" /> : "Verify Buyer"}
              {!loading && code.length === 6 && <CheckCircle2 size={20} />}
            </button>
          </form>
          <div className="resend-section">
            {timer > 0 ? <p>Resend in {timer}s</p> : <button onClick={handleManualResend} className="resend-link">Resend Code</button>}
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} /> Back</button>
      </div>
    </div>
  );
}

export default VerifyBuyerEmail;