import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faCloudUploadAlt, faUser, faEye,faEyeSlash,faEnvelope, faLock, faTrash, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./Buyer_Register.css";

function Buyer_Register() {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [profile, setProfile] = useState(null);
    const [previewProfile, setPreviewProfile] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeat_pass, setRepeat_Pass] = useState("");
    const [message, setMessage] = useState(null);
    const [showPassword,setShowPassword]=useState(false);
    const [agreed, setAgreed] = useState(false);
    const navigate = useNavigate();
    const rule = /^(?=.{10,})(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const togglePassword=()=>{
        setShowPassword(prev=>!prev)
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!agreed) {
    setMessage({
        text: "Privacy Policy & Rules Required",
        type: "error"
    });
    return;
}

        if (!profile) {
            setMessage({ text: "Please upload a profile picture", type: "error" });
            return;
        }

        if (!name || !email || !password || !repeat_pass) {
            setMessage({text:"All Fields Required",type:"error"});
  return;
}
        if (!rule.test(password)) {
            setMessage({ text: "Password must be 10+ chars with 3 types (Upper, Lower, Number, Special)", type: "error" });
            return;
        }
        if(!emailRegex.test(email)){
            setMessage({text:"Invalid Email Try Again",type:"error"});
            return;
        }
        if (password !== repeat_pass) {
            setMessage({ text: "Passwords do not match", type: "error" });
            return;
        }
        if(password.length<10){
            setMessage({text:"Minimum Password 10 Characters",type:"error"});
            return;
        }
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("email", email.trim());
        formData.append("password", password.trim());
        formData.append("repeat_pass", repeat_pass.trim());
        formData.append("profile", profile);
        formData.append("acceptedPolicies", agreed);

        setLoading(true);
        try {
           const res = await api.post("/api/buyer_register",formData)
            setMessage({
                text: res.data.message,
                type: res.data.success ? "success" : "error",
            });

            if (res.data.success) {
                setTimeout(() => navigate("/VerifyBuyerEmail", { state: { email: email, role: "buyer" } 
}), 2000);
            }
        } catch (error) {
            setMessage({
                text: error.response?.data?.message || "Registration failed. Try again.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="buyer_reg_viewport">
            {loading && <div className="buyer_reg_loader_bar"></div>}

            <div className="buyer_reg_card">
                {/* Left Side: Hero Info */}
                <div className="buyer_reg_info_side">
                    <div className="buyer_reg_info_content">
                         <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  className="buyer_reg_logo_img"
  style={{ width: "100px", height: "auto" }} 
/>
                        <div className="buyer_reg_info_content">
  <img
    src="/my_logo1.png"
    alt="Isonga Market"
    className="buyer_reg_logo_img"
  />

  improve this and give css  <h1>Isonga Market</h1>
                        <h1>Start buyer Journey</h1>
                        <p>Join Isonga Market and get access
                             to the best products services and assets from verified  sellers.</p>
                             <p>Also you get shipping services for purchased products 
                             </p>
                        
                        <ul className="buyer_reg_feature_list">
                            <li> Wide variety of categories</li>
                            <li> Verified & trusted sellers</li>
                            <li> Secure shopping experience</li>
                        </ul>
                    </div>
                </div>
                {/* Right Side: Form */}
                <div className="buyer_reg_form_side">
                    <header className="buyer_reg_header">
                        <h2>Create Buyer Account</h2>
                        <p>Fill in the details to get started</p>
                    </header>

                    <form onSubmit={handleSubmit} className="buyer_reg_form">
                        
                        {/* Profile Upload Area */}
                        <div className="buyer_reg_upload_section">
                            <label className="buyer_reg_label">Profile Photo</label>
                            {!previewProfile ? (
                                <div className="buyer_reg_upload_box" onClick={() => fileInputRef.current.click()}>
                                    <FontAwesomeIcon icon={faCloudUploadAlt} size="2x" />
                                    <span>Click to upload photo</span>
                                </div>
                            ) : (
                                <div className="buyer_reg_preview_box">
                                    <img src={previewProfile} alt="Preview" />
                                    <button type="button" onClick={() => {
                                        setProfile(null);
                                        setPreviewProfile(null);
                                        fileInputRef.current.value = "";
                                    }}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                hidden 
                                accept="image/*" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if(!file) return;
                                    if (!file.type.startsWith("image/")) {
        alert("Only image files (jpg, png, etc.) are allowed!");
        e.target.value = ""; 
        return;
    }
                                    if (file && file.size <= 5 * 1024 * 1024) {
                                        setProfile(file);
                                        setPreviewProfile(URL.createObjectURL(file));
                                    } else {
                                        alert("File too large (Max 5MB)");
                                    }
                                }}
                            />
                        </div>

                        <div className="buyer_reg_input_row">
                            <div className="buyer_reg_group">
                                <label className="buyer_reg_label"> Name</label>
                                <div className="buyer_reg_input_wrapper">
                                    <FontAwesomeIcon icon={faUser} className="buyer_reg_icon" />
                                    <input type="text" placeholder="Enter Name"
                                     onChange={(e) => setName(e.target.value)} required />
                                </div>
                            </div>

                            <div className="buyer_reg_group">
                                <label className="buyer_reg_label">Email Address</label>
                                <div className="buyer_reg_input_wrapper">
                                    <FontAwesomeIcon icon={faEnvelope} className="buyer_reg_icon" />
                                    <input type="email" placeholder="Enter Email" 
                                    onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className="buyer_reg_input_row">
                            <div className="buyer_reg_group">
                                <label className="buyer_reg_label">Password</label>
                                <div className="buyer_reg_input_wrapper">
                                    <FontAwesomeIcon icon={faLock} className="buyer_reg_icon" />
                                    <input type={showPassword ? "text":"password"} 
                                    placeholder="Enter Password" 
                                    onChange={(e) => setPassword(e.target.value)} required />
                                    <span className="eye-icon" onClick={togglePassword}>
    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
  </span>
                                </div>
                            </div>

                            <div className="buyer_reg_group">
                                <label className="buyer_reg_label">Repeat Password</label>
                                <div className="buyer_reg_input_wrapper">
                                    <FontAwesomeIcon icon={faLock} className="buyer_reg_icon" />
                                    <input type={showPassword ? "text":"password"} 
                                    placeholder="Repeat Password" 
                                    onChange={(e) => setRepeat_Pass(e.target.value)} required />
                                    <span className="eye-icon" onClick={togglePassword}>
    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
  </span>
                                </div>
                            </div>
                        </div>
                        <div className="buyer_reg_checkbox">
    <input
        type="checkbox"
        id="agree"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
        required
    />

    <label htmlFor="agree">
        I agree to the{" "}
        <Link to="/PrivacyRules">
            Privacy Policy & Marketplace Rules
        </Link>
    </label>
</div>

                        <button type="submit" className="buyer_reg_submit_btn" disabled={loading}>
                            {loading ? "Creating Account..." : (
                                <>Register <FontAwesomeIcon icon={faArrowRight} /></>
                            )}
                        </button>

                        {message && (
                            <div className={`buyer_reg_alert ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="buyer_reg_signin_link">
                            Already have an account? <Link to="/buyer_login">Sign In</Link>
                        </div>
                    </form>

                    <footer className="buyer_reg_footer">
                        <Link to="/">← Back to Home</Link>
                    </footer>
                </div>
            </div>
        </div>
        </div>
    );
}

export default Buyer_Register;