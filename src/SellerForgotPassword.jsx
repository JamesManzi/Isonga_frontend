import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api"; 
import { Mail, ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import "./VerifyEmail.css"; 

function SellerForgotPassword() {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // STEP 1: Request Code (Updated to Seller path)
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/seller/forgot-password", { email });
      if (res.data.success) {
        setStep(2);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify Code (Updated to Seller path)
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await api.post("/api/seller/verify-reset-code", { email, code });
      if (res.data.success) {
        setStep(3);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Save New Password (Updated to Seller path)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/seller/reset-password", { email, code, newPassword });
      if (res.data.success) {
        alert("Seller password updated! Please login.");
        navigate("/seller_login"); // Ensure this matches your seller login route
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Reset failed.");
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
          <div style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#64748b', fontWeight: 'bold' }}>
            SELLER PORTAL
          </div>
        </div>

        <div className="verify-card">
          <div className="verify-header">
            <div className="icon-badge">
              {step === 1 && <Mail size={32} />}
              {step === 2 && <KeyRound size={32} />}
              {step === 3 && <ShieldCheck size={32} />}
            </div>
            <h2>
              {step === 1 && "Seller Recovery"}
              {step === 2 && "Verify Account"}
              {step === 3 && "Reset Password"}
            </h2>
            <p>
              {step === 1 && "Enter your registered seller email."}
              {step === 2 && `We sent a 6-digit code to ${email}`}
              {step === 3 && "Create a new secure password for your store."}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleRequestCode} className="verify-form">
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Seller email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="otp-input"
                  style={{ fontSize: '1rem', textAlign: 'left', padding: '0 15px' }}
                />
              </div>
              <button type="submit" disabled={loading} className="submit-btn active">
                {loading ? <Loader2 className="spinner" /> : "Send Code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="verify-form">
              <div className="input-group">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="otp-input"
                />
              </div>
              <button type="submit" disabled={loading || code.length < 6} className="submit-btn active">
                {loading ? <Loader2 className="spinner" /> : "Verify Code"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="verify-form">
              <div className="input-group" style={{ position: 'relative' }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New Seller Password"
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
              <button type="submit" disabled={loading} className="submit-btn active">
                {loading ? <Loader2 className="spinner" /> : "Update Password"}
              </button>
            </form>
          )}

          <div className="resend-section">
            <button onClick={() => setStep(1)} className="resend-link">
              {step === 1 ? "Wait, I remember it!" : "Back to start"}
            </button>
          </div>
        </div>

        <button onClick={() => navigate("/seller_login")} className="back-btn">
          <ArrowLeft size={18} />
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default SellerForgotPassword;