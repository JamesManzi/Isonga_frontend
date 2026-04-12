import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyBuyerEmail.css";

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
  // 1. If timer is 0 or less, don't start an interval at all
  if (timer <= 0) return;

  // 2. Start the interval
  const interval = setInterval(() => {
    setTimer((prev) => {
      // 3. Check the previous value; if it's hitting 1, clear and stop
      if (prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  // 4. Cleanup: clear the interval if the component unmounts
  return () => clearInterval(interval);
}, []); // Empty dependency array means this logic sets up once on mount

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
      
      // 1. Match the payload to your backend (we use { email })
      const res = await api.post("/api/seller-resend-verification", { email });
      
      if (res.data.success) {
        // 2. Start a full 60-second timer to match backend cooldown
        startTimer(60); 
        alert("Seller verification code resent!");
        setCode(""); 
      } else {
        // Handle cases where success is false but no exception was thrown
        alert(res.data.message || "Failed to resend code.");
      }
    } catch (err) {
      // 3. IMPORTANT: Catch the 429 "Please wait" error from the backend
      // This displays "Please wait before requesting again" instead of "Network error"
      const errorMsg = err.response?.data?.message || "Network error. Please try again.";
      alert(errorMsg);
      
      // Optional: If the error is a 429, restart the timer locally to stay in sync
      if (err.response?.status === 429) {
        startTimer(30); 
      }
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