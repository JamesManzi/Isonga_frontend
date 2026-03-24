import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUploadAlt, faShop, faPhone, faEnvelope, faLock, faMapMarkerAlt, faTrash, faArrowRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import "./Register.css";

function Register() {
    const fileInputRef = useRef(null);
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
    const phoneRule = /^07\d{8}$/;
    const rule = /^(?=.{10,})(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Validations
        if (!profile) return alert("Please Upload Profile Picture");
        if (files.length < 2) return alert("Please Upload Atleast Two Location Images");
        if (!rule.test(password)) return alert("Password does not meet security requirements.");
        if (password !== repeat_pass) return alert("Passwords do not match");
        if (!phoneRule.test(phone)) return alert("Enter a valid Rwandan phone number (07...)");

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
            const res = await axios.post("https://isonga-backend.onrender.com/api/register", formData, { withCredentials: true });
            setMessage({ text: res.data.message, type: res.data.success ? "success" : "error" });
            if (res.data.success) setTimeout(() => navigate("/login"), 1500);
        } catch (error) {
            setMessage({ text: "Registration failed. Please check your connection.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (index) => {
        setFiles(files.filter((_, i) => i !== index));
        setPreviewFiles(previewFiles.filter((_, i) => i !== index));
    };

    return (
        <div className="sel_reg_viewport">
            {loading && <div className="sel_reg_top_loader"></div>}

            <div className="sel_reg_card">
                {/* Left Side: Hero */}
                <div className="sel_reg_hero_panel">
                    <div className="sel_reg_hero_content">
                        <img src="/logo.png" alt="Logo" className="sel_reg_logo_img" />
                        <h1>Grow Your Business</h1>
                        <p>Join the largest marketplace in Rwanda and start selling to thousands of customers today.</p>
                        <div className="sel_reg_badge">Trusted by 500+ Local Shops 🇷🇼</div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="sel_reg_form_panel">
                    <header className="sel_reg_header">
                        <h2>Seller Registration</h2>
                        <p>Create your store profile below</p>
                    </header>

                    <form onSubmit={handleSubmit} className="sel_reg_form">
                        {/* Profile Section */}
                        <div className="sel_reg_section">
                            <label className="sel_reg_label">Shop Profile Photo</label>
                            <div className="sel_reg_profile_row">
                                <div className="sel_reg_avatar_box" onClick={() => fileInputRef.current.click()}>
                                    {previewProfile ? <img src={previewProfile} alt="Profile" /> : <FontAwesomeIcon icon={faCloudUploadAlt} />}
                                </div>
                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) { setProfile(file); setPreviewProfile(URL.createObjectURL(file)); }
                                }} />
                                <div className="sel_reg_help_text">Click to upload shop logo or owner photo. (Max 5MB)</div>
                            </div>
                        </div>

                        {/* Store Info Row */}
                        <div className="sel_reg_row">
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Shop Name</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faShop} className="sel_reg_icon" />
                                    <input type="text" placeholder="My Awesome Shop" onChange={(e) => setName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} required>
                                    <option value="">-- Select Category --</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Vehicles">Vehicles</option>
                                    <option value="Agriculture">Agriculture</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Furniture">Furniture</option>
                                </select>
                            </div>
                        </div>

                        {/* Contact Row */}
                        <div className="sel_reg_row">
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Location</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="sel_reg_icon" />
                                    <input type="text" placeholder="Kigali, Nyarugenge" onChange={(e) => setLocation(e.target.value)} required />
                                </div>
                            </div>
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Phone</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faPhone} className="sel_reg_icon" />
                                    <input type="tel" placeholder="07XXXXXXXX" onChange={(e) => setPhone(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        {/* Email/Password */}
                        <div className="sel_reg_group">
                            <label className="sel_reg_label">Email Address</label>
                            <div className="sel_reg_input_wrap">
                                <FontAwesomeIcon icon={faEnvelope} className="sel_reg_icon" />
                                <input type="email" placeholder="shop@email.com" onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                        </div>

                        <div className="sel_reg_row">
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Password</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faLock} className="sel_reg_icon" />
                                    <input type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            </div>
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Repeat Password</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faLock} className="sel_reg_icon" />
                                    <input type="password" placeholder="••••••••" onChange={(e) => setRepeat_Pass(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className="sel_reg_group">
                            <label className="sel_reg_label">Seller Type</label>
                            <select value={sellerType} onChange={(e) => setSellerType(e.target.value)} required>
                                <option value="">-- Select Type --</option>
                                <option value="Product">Product</option>
                                <option value="Service">Service</option>
                                <option value="Asset">Asset</option>
                            </select>
                        </div>

                        <div className="sel_reg_group">
                            <label className="sel_reg_label">Business Description</label>
                            <textarea placeholder="Tell us about what you sell..." onChange={(e) => setDescription(e.target.value)} required></textarea>
                        </div>

                        {/* Multi-Image Upload */}
                        <div className="sel_reg_group">
                            <label className="sel_reg_label">Store/Location Photos (Min 2, Max 6)</label>
                            <input type="file" multiple accept="image/*" className="sel_reg_file_input" onChange={(e) => {
                                const newFiles = Array.from(e.target.files);
                                if (files.length + newFiles.length > 6) return alert("Max 6 images");
                                setFiles([...files, ...newFiles]);
                                setPreviewFiles([...previewFiles, ...newFiles.map(f => URL.createObjectURL(f))]);
                            }} />
                            <div className="sel_reg_grid">
                                {previewFiles.map((img, i) => (
                                    <div key={i} className="sel_reg_img_card">
                                        <img src={img} alt="Preview" />
                                        <button type="button" onClick={() => removeImage(i)}><FontAwesomeIcon icon={faTrash} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="sel_reg_btn" disabled={loading}>
                            {loading ? "Creating Account..." : <>Register Shop <FontAwesomeIcon icon={faArrowRight} /></>}
                        </button>

                        {message && <div className={`sel_reg_alert ${message.type}`}>{message.text}</div>}
                    </form>

                    <div className="sel_reg_signin">
                        Already registered? <Link to="/login">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;