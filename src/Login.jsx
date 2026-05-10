import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./Login.css";

function Login() {
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

  setLoading(true);
  setMessage(null);

  try {
    const res = await api.post("/api/login", { email, password });

    if (res.data.success) {
      const user = res.data.user;

      // Save credentials
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage({ text: "Success! Welcome back.", type: "success" });
      
    setTimeout(() => {
  if (user.role === "admin") {
    navigate("/AdminDashboard"); // or /admin-dashboard (same UI if hidden)
  } else {
    navigate("/dashboard");
  }
}, 1000);

    } else {
  const msg = res.data.message || "Invalid credentials";
  if(res.data.remaining){
    setLockTime(res.data.remaining);
  }
  const lowerMsg = msg.toLowerCase();

  console.log("LOGIN MESSAGE:", msg);

  if (lowerMsg.includes("not verified") || lowerMsg.includes("email not verified")) {
    navigate("/VerifySellerEmail", {
      state: { email, role:"seller"}
    });
    return;
  }
 setMessage({
  text: msg,
  type: "error"
});
}
}catch (error) {

  const errMsg =
    error.response?.data?.message ||
    "Login failed. Please try again.";

  console.log("CATCH MESSAGE:", errMsg);

  if (error.response?.status === 429) {
    setLockTime(error.response.data.remaining);
  }

  const lowerMsg = errMsg.toLowerCase();

  if (lowerMsg.includes("not verified")) {
    navigate("/VerifySellerEmail", {
      state: { email, role:"seller" }
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
    <div className="login-page">
      {loading && <div className="top-loading-bar"></div>}

      <div className="login-card-container">
        {/* Left Side */}
        <div className="login-hero-side">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <img src="/logo.png" alt="Logo" className="hero-logo" />
            <h1>Isonga Market</h1>
            <p>Empowering Rwandan entrepreneurs to reach more customers, faster.</p>
            <p>Get Connected With Customers Nationwide Online.</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-form-side">
          <div className="form-header">
            <h2>Seller Login</h2>
            <p>Enter your credentials to manage your store</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email"
                required
                disabled={loading||lockTime>0}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                  disabled={loading||lockTime>0}
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="password-toggle"  
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>
             <div className="buyer-form-options">
              <Link to="/SellerForgotPassword">Forgot password?</Link>
            </div>
            <button
              type="submit"
              className="main-login-btn"
              disabled={loading||lockTime>0}
            >
            {loading?(
              "Loading......"
            ):(
              <>
               Sign In <FontAwesomeIcon icon={faArrowRight}/>
              </>
            )}
            </button>

          {message && (
  <div className={`modern-alert ${message.type}`}>
    {message.text}
  </div>
)}

{lockTime > 0 && (
  <div className="modern-alert error">
    Try Again in {lockTime}s
  </div>
)}

            <div className="register-redirect">
              Don't have a shop yet? <Link to="/register">Create Account</Link>
            </div>
          </form>
          <div className="form-footer">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;