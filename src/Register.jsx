import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUploadAlt, faStore, faPhone, faEnvelope, faLock, faMapPin, faTrash, faChevronRight, faImages, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import "./Register.css";

function Register() {
    const profileInputRef = useRef(null);
    const locationImagesRef = useRef(null);
    const [sellerType, setSellerType] = useState("");
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [profile, setProfile] = useState(null);
    const [previewProfile, setPreviewProfile] = useState(null);
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeat_pass, setRepeat_Pass] = useState("");
    const [files, setFiles] = useState([]);
    const [previewFiles, setPreviewFiles] = useState([]);
    const [message, setMessage] = useState(null);
    const [category, setCategory] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profile) return setMessage({ text: "Profile photo is required", type: "error" });
        if (files.length < 2) return setMessage({ text: "Upload at least 2 store photos", type: "error" });
        if (password !== repeat_pass) return setMessage({ text: "Passwords don't match", type: "error" });

        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("location", location.trim());
        formData.append("phone", phone);
        formData.append("email", email.trim());
        formData.append("password", password);
        formData.append("repeat_pass", repeat_pass);
        formData.append("description", description.trim());
        formData.append("category", category);
        formData.append("sellerType", sellerType);
        formData.append("profile", profile);
        files.forEach(file => formData.append("files", file));

        setLoading(true);
        try {
             const res = await api.post("/api/register",formData)    
            setMessage({ text: res.data.message, type: res.data.success ? "success" : "error" });
            if (res.data.success) setTimeout(() => navigate("/verify-email", { state: { email: email, role: "seller" } 
}), 2000);
        } catch (error) {
    console.log(" ERROR:", error);
    console.log(" RESPONSE:", error.response);

    setMessage({
        text: error.response?.data?.message || error.message || "Server error",
        type: "error"
    });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-reg-wrapper">
            {loading && <div className="modern-progress-bar"></div>}
            
            <div className="modern-reg-container">
                {/* Visual Sidebar */}
                <div className="modern-reg-sidebar">
                    <div className="sidebar-branding">
                        <img src="/logo.png" alt="Logo" />
                        <h2>Isonga <span>Market</span></h2>
                    </div>
                    <div className="step-list">
                        <div className="step-item active"><span className="step-num">1</span> Shop Identity</div>
                        <div className="step-item active"><span className="step-num">2</span> Visuals & Location</div>
                        <div className="step-item active"><span className="step-num">3</span> Account Security</div>
                    </div>
                    <div className="sidebar-footer">
                        <p>© 2026 Isonga Market. Proudly Rwandan 🇷🇼</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="modern-reg-main">
                    <div className="form-content-wrap">
                        <div className="form-header">
                            <h1>Become a Seller</h1>
                            <p>Set up your professional store in minutes.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="modern-form">
                            
                            {/* Profile Section */}
                            <div className="modern-upload-section">
                                <div 
                                    className={`profile-circle-upload ${previewProfile ? 'has-image' : ''}`}
                                    onClick={() => profileInputRef.current.click()}
                                >
                                    {previewProfile ? (
                                        <img src={previewProfile} alt="Profile" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <FontAwesomeIcon icon={faCloudUploadAlt} />
                                            <span>Logo</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) { setProfile(file); setPreviewProfile(URL.createObjectURL(file)); }
                                }} />
                                <div className="upload-text">
                                    <h3>Shop Profile</h3>
                                    <p>Upload your brand logo or a clear photo.</p>
                                </div>
                            </div>

                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Shop Name</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faStore} />
                                        <input type="text" placeholder="e.g.  Tech Hub" onChange={(e) => setName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <select
  value={sellerType}  // <- Actually create a separate state for sellerType
  onChange={(e) => setSellerType(e.target.value)}
  required
>
  <option value="">-- Select Seller Type --</option>
  <option value="Product">Product</option>
  <option value="Service">Service</option>
  <option value="Asset">Asset</option>
</select><br/>
                        
                                </div>
                                <div className="modern-input-group">
                                    <label>Category</label>
                                    <select onChange={e => setCategory(e.target.value)} required>
                                        
  <option value="">-- Select Category --</option>
  <option value="Fashion">Fashion</option>
  <option value="RealEstate">Real Estate</option>
  <option value="Vehicles">Vehicles</option>
  <option value="Livestock">Livestock</option>
  <option value="services">services</option>
  <option value="Hospitality">Hospitality</option>
  <option value="Electronics">Electronics</option>
  <option value="Furniture">Furniture</option>
  <option value="Construction">Construction</option>
  <option value="Food">Food</option>
                                    </select>
                                </div>
                            </div>

                            {/* Multiple Location Images Section */}
                            <div className="modern-multi-upload">
                                <label>Store Gallery (Min 2 photos)</label>
                                <div className="multi-upload-trigger" onClick={() => locationImagesRef.current.click()}>
                                    <FontAwesomeIcon icon={faImages} />
                                    <span>Add Store / Location Photos</span>
                                </div>
                                <input type="file" ref={locationImagesRef} hidden multiple accept="image/*" onChange={(e) => {
                                    const newFiles = Array.from(e.target.files);
                                    if (files.length + newFiles.length > 6) return alert("Max 6 photos");
                                    setFiles([...files, ...newFiles]);
                                    setPreviewFiles([...previewFiles, ...newFiles.map(f => URL.createObjectURL(f))]);
                                }} />
                                
                                <div className="modern-gallery-grid">
                                    {previewFiles.map((img, i) => (
                                        <div key={i} className="gallery-item">
                                            <img src={img} alt="Preview" />
                                            <button type="button" onClick={() => {
                                                setFiles(files.filter((_, idx) => idx !== i));
                                                setPreviewFiles(previewFiles.filter((_, idx) => idx !== i));
                                            }}><FontAwesomeIcon icon={faTrash} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Location</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faMapPin} />
                                        <input type="text" placeholder="Street, City" onChange={(e) => setLocation(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <label>Phone Number</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faPhone} />
                                        <input type="tel" placeholder="07XXXXXXXX" onChange={(e) => setPhone(e.target.value)} required />
                                    </div>
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <label>Business Description</label>
                                <textarea placeholder="Tell customers what makes your shop special..." onChange={(e) => setDescription(e.target.value)} required></textarea>
                            </div>

                            <div className="modern-input-group">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    <input type="email" placeholder="hello@shop.com" onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>

                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Password</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faLock} />
                                        <input type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <label>Confirm</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faLock} />
                                        <input type="password" placeholder="••••••••" onChange={(e) => setRepeat_Pass(e.target.value)} required />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="modern-submit-btn" disabled={loading}>
                                {loading ? "Creating Store..." : <>Get Started <FontAwesomeIcon icon={faChevronRight} /></>}
                            </button>

                            {message && <div className={`modern-alert-box ${message.type}`}>{message.text}</div>}
                        </form>

                        <div className="modern-footer-link">
                            Already a seller? <Link to="/login">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;