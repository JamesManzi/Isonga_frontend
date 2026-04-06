import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyEmail.css";

function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  const { state } = useLocation();
  const navigate = useNavigate();

  // Get data passed from the registration pages
  const email = state?.email || "your email";
  const userRole = state?.role || "buyer"; // 'buyer' or 'seller'

  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) setTimer(timer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    
    setLoading(true);
    try {
      // The backend route handles both models now
      const res = await api.post("/api/verify-email", { email, code });
      
      if (res.data.success) {
        // Decide which login page to send them to
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
      setLoading(true); // Reuse your loading state or create a 'resending' state
      
      // Send both email AND role if your backend uses it for logic
      const res = await api.post("/api/resend-verification", { 
        email, 
        userType: userRole // match the key your backend expects
      });

      if (res.data.success) {
        setTimer(59); // Restart the countdown
        alert("A new code has been sent to your inbox!"); 
        setCode(""); // Clear the old, expired code from the input
      } else {
        alert(res.data.message || "Could not resend code.");
      }
    } catch (err) {
      console.error("Resend failed", err);
      alert("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
            <h2>Verify {userRole} Account</h2>
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
      disabled={loading} // Prevent double-clicking while the API is calling
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