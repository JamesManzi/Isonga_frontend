import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faLock } from "@fortawesome/free-solid-svg-icons";
import "./Buyer_Login.css";
import api from "./api";

function Buyer_Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [lockTime,setLockTime]=useState(null);
  const navigate = useNavigate();

  useEffect(()=>{
    if(lockTime===null||lockTime<=0) return;
    const timer=setInterval(()=>{
      setLockTime(prev=>{
        if(prev<=1){
          clearInterval(timer);
          return 0;
        }
        return prev-1;
      })
    },1000);
    return ()=>clearInterval(timer);
  },[lockTime]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockTime > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/api/buyer_login", { email, password });

      if (res.data.success) {
        const user = res.data.buyer;

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(user));

        setMessage({ text: "Success! Welcome back.", type: "success" });
        
        // Navigate to buyer dashboard after a short delay
        setTimeout(() => navigate("/buyer_dashboard"), 1200);

      } else {
  const msg = res.data.message || "Invalid credentials";
  const lowerMsg = msg.toLowerCase();
 if (res.data.remaining) {
    setLockTime(res.data.remaining);
  }
  console.log("LOGIN MESSAGE:", msg);

  if (lowerMsg.includes("not verified") || lowerMsg.includes("email not verified")) {
    navigate("/VerifyBuyerEmail", {
      state: { email, role: "buyer" }
    });
    return;
  }
   setMessage({
    text: msg,
    type: "error"
  });
}
    } catch (error) {

  const errMsg =
    error.response?.data?.message ||
    "Login failed. Please try again.";

  console.log("CATCH MESSAGE:", errMsg);

  if (error.response?.status === 429) {
    setLockTime(error.response.data.remaining);
  }

  const lowerMsg = errMsg.toLowerCase();

  if (lowerMsg.includes("not verified")) {
    navigate("/VerifyBuyerEmail", {
      state: { email, role: "buyer" }
    });
    return;
  }

  setMessage({
    text: errMsg,
    type: "error"
  });

} finally {
  setLoading(false);
}
};

  return (
    <div className="buyer-page">
      {loading && <div className="buyer-top-loading-bar"></div>}

      <div className="buyer-card-container">
        <div className="buyer-hero-side">
          <div className="buyer-hero-overlay"></div>
          <div className="buyer-hero-content">
            <img src="/logo.png" alt="Logo" className="buyer-hero-logo" />
            <h1>Isonga Market</h1>
            <p>Discover Shops of All Kind Across Country
              With Verified Sellers and be Able to Access Products Services and Assets
              at Suitable Prices
            </p>
          </div>
        </div>

        <div className="buyer-form-side">
          <div className="buyer-form-header">
            <h2>Buyer Login</h2>
            <p>Sign in to continue your shopping journey</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="buyer-input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter Email"
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={lockTime > 0}
              />
            </div>

            <div className="buyer-input-group">
              <label>Password</label>
              <div className="buyer-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={lockTime > 0}
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="buyer-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            <div className="buyer-form-options">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              className="buyer-main-btn" 
              disabled={loading || lockTime > 0}
            >
              {lockTime > 0 ? (
                <>Locked ({lockTime}s) <FontAwesomeIcon icon={faLock} /></>
              ) : loading ? (
                "Verifying..."
              ) : (
                <>
                  Sign In <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>

            {message && (
              <div className={`buyer-modern-alert ${message.type}`}>
                {message.text}
              </div>
            )}

            
{lockTime > 0 && (
  <div className="modern-alert error">
    Try Again in {lockTime}s
  </div>
)}

            <div className="buyer-register-redirect">
              New to Isonga? <Link to="/buyer_register">Create Account</Link>
            </div>
          </form>

          <div className="buyer-form-footer">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Buyer_Login;