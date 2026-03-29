import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import { Mail, CheckCircle, ArrowRight, RefreshCw } from "lucide-react"; // Optional: npm install lucide-react
import "/VerifyEmail";
function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email || "your email";

  // Countdown for Resend Button
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
        navigate("/buyer_login", { state: { message: "Account verified! Please login." } });
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4 shadow-lg">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Check your email</h2>
          <p className="text-gray-500 mt-2">
            We sent a 6-digit code to <br />
            <span className="font-semibold text-blue-600">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              className="w-full py-4 bg-white/50 border-2 border-gray-100 rounded-2xl text-center text-3xl font-bold tracking-[0.5em] focus:border-blue-500 focus:bg-white transition-all outline-none shadow-inner"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all ${
              loading || code.length < 6 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}
          >
            {loading ? <RefreshCw className="animate-spin" /> : "Verify Account"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-500">
            Didn't receive the code?{" "}
            {timer > 0 ? (
              <span className="text-blue-600 font-medium">Wait {timer}s</span>
            ) : (
              <button 
                onClick={() => setTimer(59)}
                className="text-blue-600 font-bold hover:underline"
              >
                Resend Code
              </button>
            )}
          </p>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="mt-6 w-full text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          ← Back to registration
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;