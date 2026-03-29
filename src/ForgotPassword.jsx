import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { Mail, Lock, ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import "./VerifyEmail.css"; // Reuse your existing glassmorphic styles

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Requesting the Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/forgot-password", { email });
      if (res.data.success) {
        setStep(2);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Error sending reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Saving New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await api.post("/api/reset-password", { email, code, newPassword });
      if (res.data.success) {
        alert("Password reset successful! Please login.");
        navigate("/buyer_login"); // Or dynamic based on role if needed
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Reset failed. Check your code.");
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
              {step === 1 ? <Mail size={32} /> : <Lock size={32} />}
            </div>
            <h2>{step === 1 ? "Forgot Password?" : "Reset Password"}</h2>
            <p>
              {step === 1 
                ? "Enter your email to receive a reset code." 
                : `Enter the code sent to ${email}`}
            </p>
          </div>

          {step === 1 ? (
            /* STEP 1: EMAIL FORM */
            <form onSubmit={handleRequestCode} className="verify-form">
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="otp-input" // Reusing style for consistency
                  style={{ fontSize: '1rem', textAlign: 'left', padding: '0 15px' }}
                />
              </div>
              <button type="submit" disabled={loading} className="submit-btn active">
                {loading ? <Loader2 className="spinner" /> : "Send Reset Code"}
              </button>
            </form>
          ) : (
            /* STEP 2: RESET FORM */
            <form onSubmit={handleResetPassword} className="verify-form">
              <div className="input-group">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="otp-input"
                />
              </div>

              <div className="input-group" style={{ position: 'relative' }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New Password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="otp-input"
                  style={{ fontSize: '1rem', textAlign: 'left', padding: '0 15px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '15px', top: '35%', background: 'none', border: 'none', color: '#64748b' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" disabled={loading || code.length < 6} className="submit-btn active">
                {loading ? <Loader2 className="spinner" /> : "Update Password"}
              </button>
            </form>
          )}

          <div className="resend-section">
            <button onClick={() => setStep(1)} className="resend-link">
              Back to start
            </button>
          </div>
        </div>

        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={18} />
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;