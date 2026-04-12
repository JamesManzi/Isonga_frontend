import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyEmail.css";

function VerifySellerEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Specifically for Seller
  const [email] = useState(() => state?.email || sessionStorage.getItem("pending_seller_email"));
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateRemaining = () => {
    const expiry = sessionStorage.getItem("seller_timer_expiry");
    if (!expiry) return 0;
    const remaining = Math.floor((parseInt(expiry) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const [timer, setTimer] = useState(calculateRemaining);

  const startTimer = useCallback((seconds) => {
    const expiryTime = Date.now() + seconds * 1000;
    sessionStorage.setItem("seller_timer_expiry", expiryTime.toString());
    setTimer(seconds);
  }, []);

  useEffect(() => {
    if (state?.email) {
      sessionStorage.setItem("pending_seller_email", state.email);
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
      const res = await api.post("/api/seller-verify-email", { email, code, role: "seller" });
      
      if (res.data.success) {
        sessionStorage.removeItem("pending_seller_email");
        sessionStorage.removeItem("seller_timer_expiry");

        navigate("/login", { 
          state: { message: "Seller account verified! Please login." } 
        });
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualResend = async () => {
    try {
      setLoading(true);
      const res = await api.post("/api/resend-verification", { email, userType: "seller" });
      if (res.data.success) {
        startTimer(59);
        alert("Seller verification code resent!");
        setCode("");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="verify-page-wrapper">
        <div className="verify-card" style={{ textAlign: "center", padding: "40px" }}>
          <p>Seller session expired.</p>
          <button onClick={() => navigate("/login")} className="submit-btn active">Back to Seller Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page-wrapper seller-theme">
      <div className="verify-container">
        <div className="brand-logo">
          <span className="brand-isonga">ISONGA</span>
          <span className="brand-market">SELLER CENTRAL</span>
        </div>
        <div className="verify-card">
          <div className="verify-header">
            <div className="icon-badge seller-icon">
              <ShieldCheck size={32} color="#059669" />
            </div>
            <h2>Verify Seller Identity</h2>
            <p>Verification code sent to: <br/><b>{email}</b></p>
          </div>
          <form onSubmit={handleVerify} className="verify-form">
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="otp-input seller-input"
            />
            <button type="submit" disabled={loading || code.length < 6} className={`submit-btn seller-btn ${loading || code.length < 6 ? "disabled" : "active"}`}>
              {loading ? <Loader2 className="spinner" /> : "Verify Business Account"}
            </button>
          </form>
          <div className="resend-section">
            {timer > 0 ? <p>Resend available in {timer}s</p> : <button onClick={handleManualResend} className="resend-link">Resend Code</button>}
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} /> Back</button>
      </div>
    </div>
  );
}

export default VerifySellerEmail;