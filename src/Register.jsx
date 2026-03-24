import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUploadAlt, faShop, faPhone, faEnvelope, faLock, faMapMarkerAlt, faTrash, faArrowRight, faImages } from "@fortawesome/free-solid-svg-icons";
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
    const phoneRule = /^07\d{8}$/;
    const rule = /^(?=.{10,})(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!profile) return alert("Please Upload a Shop Profile Picture");
        if (files.length < 2) return alert("Please Upload at least 2 Location Images");
        if (password !== repeat_pass) return alert("Passwords do not match");

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
            setMessage({ text: "Server error. Please try again.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const removeLocationImage = (index) => {
        setFiles(files.filter((_, i) => i !== index));
        setPreviewFiles(previewFiles.filter((_, i) => i !== index));
    };

    return (
        <div className="sel_reg_viewport">
            {loading && <div className="sel_reg_top_loader"></div>}

            <div className="sel_reg_card">
                <div className="sel_reg_hero_panel">
                    <div className="sel_reg_hero_content">
                        <img src="/logo.png" alt="Logo" className="sel_reg_logo_img" />
                        <h1>Seller Portal</h1>
                        <p>Showcase your business to thousands of shoppers in Rwanda.</p>
                        <ul className="sel_reg_hero_list">
                            <li>✓ Instant Store Creation</li>
                            <li>✓ Secure Payments</li>
                            <li>✓ Business Analytics</li>
                        </ul>
                    </div>
                </div>

                <div className="sel_reg_form_panel">
                    <header className="sel_reg_header">
                        <h2>Create Your Shop</h2>
                        <p>Complete your profile to start selling</p>
                    </header>

                    <form onSubmit={handleSubmit} className="sel_reg_form">
                        
                        {/* 1. Shop Profile Photo (Single like Buyer) */}
                        <div className="sel_reg_section">
                            <label className="sel_reg_label">Shop Profile (Logo)</label>
                            {!previewProfile ? (
                                <div className="sel_reg_upload_box" onClick={() => profileInputRef.current.click()}>
                                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                                    <span>Upload Shop Logo</span>
                                </div>
                            ) : (
                                <div className="sel_reg_profile_preview">
                                    <img src={previewProfile} alt="Logo" />
                                    <button type="button" onClick={() => {setProfile(null); setPreviewProfile(null);}}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            )}
                            <input type="file" ref={profileInputRef} hidden accept="image/*" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) { setProfile(file); setPreviewProfile(URL.createObjectURL(file)); }
                                }} 
                            />
                        </div>

                        {/* 2. Shop Details */}
                        <div className="sel_reg_row">
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Shop Name</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faShop} className="sel_reg_icon" />
                                    <input type="text" placeholder="Isonga Electronics" onChange={(e) => setName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Category</label>
                                <select onChange={e => setCategory(e.target.value)} required>
                                    <option value="">-- Choose Category --</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Agriculture">Agriculture</option>
                                    <option value="Services">Services</option>
                                </select>
                            </div>
                        </div>

                        {/* 3. Location Images (Select Many) */}
                        <div className="sel_reg_section">
                            <label className="sel_reg_label">Location/Store Photos (Select 2-6 images)</label>
                            <div className="sel_reg_multi_upload_box" onClick={() => locationImagesRef.current.click()}>
                                <FontAwesomeIcon icon={faImages} />
                                <span>Click to add multiple store photos</span>
                            </div>
                            <input type="file" ref={locationImagesRef} hidden multiple accept="image/*" 
                                onChange={(e) => {
                                    const newFiles = Array.from(e.target.files);
                                    if (files.length + newFiles.length > 6) return alert("Max 6 photos allowed");
                                    setFiles([...files, ...newFiles]);
                                    setPreviewFiles([...previewFiles, ...newFiles.map(f => URL.createObjectURL(f))]);
                                }} 
                            />
                            <div className="sel_reg_multi_grid">
                                {previewFiles.map((img, i) => (
                                    <div key={i} className="sel_reg_multi_item">
                                        <img src={img} alt="Preview" />
                                        <button type="button" onClick={() => removeLocationImage(i)}><FontAwesomeIcon icon={faTrash} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Contact & Security */}
                        <div className="sel_reg_row">
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Location</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="sel_reg_icon" />
                                    <input type="text" placeholder="Kigali, Rwanda" onChange={(e) => setLocation(e.target.value)} required />
                                </div>
                            </div>
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Phone</label>
                                <div className="sel_reg_input_wrap">
                                    <FontAwesomeIcon icon={faPhone} className="sel_reg_icon" />
                                    <input type="tel" placeholder="0780000000" onChange={(e) => setPhone(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className="sel_reg_group">
                            <label className="sel_reg_label">Email Address</label>
                            <div className="sel_reg_input_wrap">
                                <FontAwesomeIcon icon={faEnvelope} className="sel_reg_icon" />
                                <input type="email" placeholder="owner@shop.com" onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                        </div>

                        <div className="sel_reg_row">
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Password</label>
                                <input type="password" placeholder="••••••••" className="sel_reg_simple_input" onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className="sel_reg_group">
                                <label className="sel_reg_label">Confirm</label>
                                <input type="password" placeholder="••••••••" className="sel_reg_simple_input" onChange={(e) => setRepeat_Pass(e.target.value)} required />
                            </div>
                        </div>

                        <button type="submit" className="sel_reg_main_btn" disabled={loading}>
                            {loading ? "Registering..." : <>Register Shop <FontAwesomeIcon icon={faArrowRight} /></>}
                        </button>

                        {message && <div className={`sel_reg_alert ${message.type}`}>{message.text}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;