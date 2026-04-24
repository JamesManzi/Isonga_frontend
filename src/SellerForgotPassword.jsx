import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye,faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import api from "./api";
import {
  Mail,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";
import "./VerifyEmail.css";

function SellerForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const togglePassword=()=>{
    setShowPass(prev=>!prev);
  }

  // =========================
  // TIMER SYSTEM (RESEND LOCK)
  // =========================

  const calculateRemaining = () => {
    const expiry = sessionStorage.getItem("seller_reset_timer");
    if (!expiry) return 0;

    return Math.max(
      Math.floor((Number(expiry) - Date.now()) / 1000),
      0
    );
  };

  const [timer, setTimer] = useState(() => calculateRemaining());

  const startTimer = useCallback((seconds) => {
    const expiry = Date.now() + seconds * 1000;
    sessionStorage.setItem("seller_reset_timer", String(expiry));
    setTimer(seconds);
  }, []);

  // LIVE TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // STEP 1 - REQUEST CODE
  // =========================
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/api/seller/forgot-password", {
        email
      });

      if (res.data.success) {
        setStep(2);
        startTimer(60); // 🔥 START RESEND TIMER
        setCode("");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // STEP 2 - VERIFY CODE
  // =========================
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;

    setLoading(true);
    try {
      const res = await api.post(
        "/api/seller/verify-reset-code",
        { email, code }
      );

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

  // =========================
  // STEP 3 - RESET PASSWORD
  // =========================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(
        "/api/seller/reset-password",
        { email, code, newPassword }
      );

      if (res.data.success) {
        alert("Seller password updated!");
        sessionStorage.removeItem("seller_reset_timer");
        navigate("/login");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RESEND CODE
  // =========================
  const handleResend = async () => {
    try {
      setLoading(true);

      const res = await api.post(
        "/api/seller/forgot-password",
        { email }
      );

      if (res.data.success) {
        startTimer(60);
        setCode("");
        alert("Code resent to email");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Network error. Please try again.";

      alert(msg);

      if (err.response?.status === 429) {
        startTimer(30);
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="verify-page-wrapper">
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>

      <div className="verify-container">
        <div className="brand-logo">
          <span className="brand-isonga">ISONGA</span>
          <span className="brand-market">MARKET</span>
          <div className="seller-tag">SELLER PORTAL</div>
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
              {step === 2 && "Verify Code"}
              {step === 3 && "Reset Password"}
            </h2>

            <p>
              {step === 1 && "Enter your seller email"}
              {step === 2 && `Code sent to ${email}`}
              {step === 3 && "Set a new password"}
            </p>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="verify-form">
              <input
                type="email"
                placeholder="Seller email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="otp-input"
                required
              />

              <button className="submit-btn active" disabled={loading}>
                {loading ? <Loader2 className="spinner" /> : "Send Code"}
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <form onSubmit={handleVerifyCode} className="verify-form">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="otp-input"
                />

                <button
                  disabled={loading || code.length < 6}
                  className="submit-btn active"
                >
                  {loading ? <Loader2 className="spinner" /> : "Verify"}
                </button>
              </form>

              <div className="resend-section">
                {timer > 0 ? (
                  <p>Resend in {timer}s</p>
                ) : (
                  <button onClick={handleResend} className="resend-link">
                    Resend Code
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="verify-form">
              <div className="buyer_reg_input_wrapper">
              <input
                type={showPass ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="otp-input"
              />
              <span className="eye-icon" onClick={togglePassword}>
    <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
  </span>
         </div>

              <button className="submit-btn active" disabled={loading}>
                {loading ? <Loader2 className="spinner" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <button onClick={() => navigate("/login")} className="back-btn">
          <ArrowLeft size={18} /> Back
        </button>
      </div>
    </div>
  );
}

export default SellerForgotPassword;