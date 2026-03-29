import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { Mail, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyEmail.css";

function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email || "your email";

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
      const res = await api.post("/api/verify-email", { email, code });
      if (res.data.success) {
        navigate("/buyer_login", { state: { message: "Verified successfully!" } });
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page-wrapper">
      {/* Decorative background elements */}
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>

      <div className="verify-container">
        {/* Brand Identity */}
        <div className="brand-logo">
          <span className="brand-isonga">ISONGA</span>
          <span className="brand-market">MARKET</span>
        </div>

        <div className="verify-card">
          <div className="verify-header">
            <div className="icon-badge">
              <ShieldCheck size={32} />
            </div>
            <h2>Verify your identity</h2>
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
                placeholder="······"
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
              <p>Resend code in <span>{timer}s</span></p>
            ) : (
              <button onClick={() => setTimer(59)} className="resend-link">
                I didn't receive a code
              </button>
            )}
          </div>
        </div>

        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={18} />
          Back to registration
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;