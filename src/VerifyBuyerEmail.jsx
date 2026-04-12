import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import "./VerifyBuyerEmail.css";

function VerifyBuyerEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [email] = useState(
    () => state?.email || sessionStorage.getItem("pending_buyer_email")
  );

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // TIMER LOGIC (FIXED)
  // =========================

  const calculateRemaining = () => {
    const expiry = sessionStorage.getItem("buyer_timer_expiry");
    if (!expiry) return 0;

    return Math.max(
      Math.floor((Number(expiry) - Date.now()) / 1000),
      0
    );
  };

  const [timer, setTimer] = useState(() => calculateRemaining());

  const startTimer = useCallback((seconds) => {
    const expiryTime = Date.now() + seconds * 1000;
    sessionStorage.setItem("buyer_timer_expiry", String(expiryTime));
    setTimer(seconds);
  }, []);

  // Save email once
  useEffect(() => {
    if (state?.email) {
      sessionStorage.setItem("pending_buyer_email", state.email);
    }
  }, [state]);

  // 🔥 INIT TIMER (CRITICAL FIX)
  useEffect(() => {
    let expiry = sessionStorage.getItem("buyer_timer_expiry");

    if (!expiry) {
      const newExpiry = Date.now() + 60 * 1000;
      sessionStorage.setItem("buyer_timer_expiry", String(newExpiry));
      expiry = newExpiry;
    }

    setTimer(calculateRemaining());
  }, []);

  // 🔥 LIVE COUNTDOWN (SINGLE SOURCE OF TRUTH)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // VERIFY EMAIL
  // =========================
  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;

    setLoading(true);
    try {
      const res = await api.post("/api/buyer-verify-email", {
        email,
        code,
        role: "buyer",
      });

      if (res.data.success) {
        sessionStorage.removeItem("pending_buyer_email");
        sessionStorage.removeItem("buyer_timer_expiry");

        navigate("/buyer_login", {
          state: { message: "Buyer account verified! Please login." },
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

  // =========================
  // RESEND CODE
  // =========================
  const handleManualResend = async () => {
    try {
      setLoading(true);

      const res = await api.post("/api/buyer-resend-verification", {
        email,
      });

      if (res.data.success) {
        startTimer(60);
        alert("Buyer verification code resent!");
        setCode("");
      } else {
        alert(res.data.message || "Failed to resend code");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Network error. Please try again.";

      alert(errorMsg);

      if (err.response?.status === 429) {
        startTimer(30);
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EMAIL CHECK
  // =========================
  if (!email) {
    return (
      <div className="verify-page-wrapper">
        <div
          className="verify-card"
          style={{ textAlign: "center", padding: "40px" }}
        >
          <p>Buyer session expired.</p>
          <button
            onClick={() => navigate("/buyer_login")}
            className="submit-btn active"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
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
            <p>
              Code sent to: <b>{email}</b>
            </p>
          </div>

          <form onSubmit={handleVerify} className="verify-form">
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
              type="submit"
              disabled={loading || code.length < 6}
              className={`submit-btn ${
                loading || code.length < 6 ? "disabled" : "active"
              }`}
            >
              {loading ? (
                <Loader2 className="spinner" />
              ) : (
                "Verify Buyer"
              )}
              {!loading && code.length === 6 && (
                <CheckCircle2 size={20} />
              )}
            </button>
          </form>

          <div className="resend-section">
            {timer > 0 ? (
              <p>Resend in {timer}s</p>
            ) : (
              <button
                onClick={handleManualResend}
                className="resend-link"
              >
                Resend Code
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="back-btn"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>
    </div>
  );
}

export default VerifyBuyerEmail;