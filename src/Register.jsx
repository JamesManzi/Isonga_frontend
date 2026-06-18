import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudUploadAlt,
  faEye,
  faEyeSlash,
  faStore,
  faPhone,
  faEnvelope,
  faLock,
  faMapPin,
  faTrash,
  faChevronRight,
  faImages,
} from "@fortawesome/free-solid-svg-icons";

import "./Register.css";

function Register() {
  const profileInputRef = useRef(null);
  const locationImagesRef = useRef(null);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const [sellerType, setSellerType] = useState("");
  const [category, setCategory] = useState("");

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
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const categoryOptions = {
    Product: ["Fashion", "Electronics", "Furniture"],
    Asset: ["RealEstate", "Vehicles"],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rule = /^(?=.*\d).{6,}$/;

    if (!rule.test(password)) {
      return setMessage({
        text: "Password must be 10+ chars with 3 types (Upper, Lower, Number, Special)",
        type: "error",
      });
    }

    if (
      !name ||
      !location ||
      !phone ||
      !email ||
      !password ||
      !repeat_pass ||
      !description ||
      !category ||
      !sellerType
    ) {
      return setMessage({
        text: "All Fields Are Required",
        type: "error",
      });
    }

    if (!profile) {
      return setMessage({
        text: "Profile photo is required",
        type: "error",
      });
    }

    if (!agreed) {
      return setMessage({
        text: "Please accept Privacy Policy & Marketplace Rules",
        type: "error",
      });
    }

    if (files.length < 2) {
      return setMessage({
        text: "Upload at least 2 store photos",
        type: "error",
      });
    }

    if (password !== repeat_pass) {
      return setMessage({
        text: "Passwords don't match",
        type: "error",
      });
    }

    if (password.length < 10) {
      return setMessage({
        text: "Minimum Password 10 Characters",
        type: "error",
      });
    }

    const regex = /^(07(8|9|2|3)\d{7})$/;
    if (!regex.test(phone)) {
      return setMessage({
        text: "Invalid Phone Number",
        type: "error",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setMessage({
        text: "Invalid Email Try Again",
        type: "error",
      });
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("location", location.trim());
    formData.append("phone", phone.trim());
    formData.append("email", email.trim());
    formData.append("password", password.trim());
    formData.append("repeat_pass", repeat_pass.trim());
    formData.append("description", description.trim());
    formData.append("category", category.trim());
    formData.append("sellerType", sellerType.trim());
    formData.append("acceptedPolicies", String(agreed));

    const profileExt = profile.name ? profile.name.split('.').pop() : 'jpg';
    formData.append("profile", profile, `profile_${Date.now()}.${profileExt}`);

    files.forEach((file, index) => {
      if (file.size > 0) {
        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        formData.append("files", file, `gallery_${index}_${Date.now()}.${fileExt}`);
      }
    });

    setLoading(true);

    try {
      const res = await api.post("/api/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage({
        text: res.data.message,
        type: res.data.success ? "success" : "error",
      });

      if (res.data.success) {
        setTimeout(() => {
          navigate("/VerifySellerEmail", {
            state: {
              email: email,
              role: "seller",
            },
          });
        }, 2000);
      }
    } catch (error) {
      console.log("ERROR:", error);
      setMessage({
        text: error.response?.data?.message || error.message || "Server error",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="isonga-reg-wrapper">
      {loading && <div className="isonga-reg-progress-bar"></div>}

      <div className="isonga-reg-container">
        {/* SIDEBAR */}
        <div className="isonga-reg-sidebar">
          <div className="isonga-reg-sidebar-branding">
            <img 
              src="/isonga_logo.png" 
              alt="Isonga Market Logo" 
              style={{ width: "200px", height: "auto", borderRadius: "50%" }} 
            />
          </div>

          <div className="isonga-reg-step-list">
            <div className="isonga-reg-step-item isonga-reg-step-active">
              <span className="isonga-reg-step-num">1</span> Shop Identity
            </div>
            <div className="isonga-reg-step-item isonga-reg-step-active">
              <span className="isonga-reg-step-num">2</span> Visuals & Location
            </div>
            <div className="isonga-reg-step-item isonga-reg-step-active">
              <span className="isonga-reg-step-num">3</span> Account Security
            </div>
          </div>

          <div className="isonga-reg-sidebar-footer">
            <p>
              &copy; {new Date().getFullYear()} Isonga Market Hub
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="isonga-reg-main">
          <div className="isonga-reg-content-wrap">
            <div className="isonga-reg-form-header">
              <h1>Become a Seller</h1>
              <p>Set up your professional store in minutes.</p>
              <p style={{ color: '#2563eb', fontWeight: '500' }}>Sell online 24 hours with Isonga Market</p>
            </div>

            <form onSubmit={handleSubmit} className="isonga-reg-form">
              {/* PROFILE */}
              <div className="isonga-reg-upload-section">
                <div
                  className={`isonga-reg-circle-upload ${previewProfile ? "isonga-reg-has-image" : ""}`}
                  onClick={() => profileInputRef.current.click()}
                >
                  {previewProfile ? (
                    <img src={previewProfile} alt="Profile" />
                  ) : (
                    <div className="isonga-reg-upload-placeholder">
                      <FontAwesomeIcon icon={faCloudUploadAlt} />
                      <span>Logo</span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={profileInputRef}
                  hidden
                  accept="image/jpeg, image/png, image/webp"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                      return alert("Please upload an image file for your profile.");
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      return alert("Profile image must not exceed 5MB");
                    }

                    setProfile(file);
                    setPreviewProfile(URL.createObjectURL(file));
                    e.target.value = "";
                  }}
                />

                <div className="isonga-reg-upload-text">
                  <h3>Shop Profile</h3>
                  <p>Upload your brand logo or a clear photo.</p>
                </div>
              </div>

              {/* SHOP INFO */}
              <div className="isonga-reg-grid">
                <div className="isonga-reg-input-group">
                  <label>Shop Name</label>
                  <div className="isonga-reg-input-with-icon">
                    <FontAwesomeIcon icon={faStore} />
                    <input
                      type="text"
                      placeholder="Enter Shop Name"
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="isonga-reg-input-group">
                  <label>Seller Type</label>
                  <select
                    value={sellerType}
                    onChange={(e) => {
                      setSellerType(e.target.value);
                      setCategory("");
                    }}
                    required
                  >
                    <option value="">-- Select Seller Type --</option>
                    <option value="Product">Product</option>
                    <option value="Asset">Asset</option>
                  </select>
                </div>

                <div className="isonga-reg-input-group">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    disabled={!sellerType}
                  >
                    <option value="">
                      {sellerType ? "-- Select Category --" : "Select Seller Type First"}
                    </option>
                    {sellerType &&
                      categoryOptions[sellerType].map((cat, index) => (
                        <option key={index} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* GALLERY */}
              <div className="isonga-reg-multi-upload">
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Store Photos (Min 2 photos)</label>
                <div
                  className="isonga-reg-multi-upload-trigger"
                  onClick={() => locationImagesRef.current.click()}
                >
                  <FontAwesomeIcon icon={faImages} />
                  <span> Upload Store Photos</span>
                </div>

                <input
                  type="file"
                  ref={locationImagesRef}
                  hidden
                  multiple
                  accept="image/jpeg, image/png, image/webp"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files);
                    const validImages = selectedFiles.filter((file) =>
                      file.type.startsWith("image/")
                    );

                    if (validImages.length !== selectedFiles.length) {
                      alert("Some files were skipped because they were not images.");
                    }

                    if (files.length + validImages.length > 6) {
                      return alert("Max 6 photos allowed total");
                    }

                    setFiles([...files, ...validImages]);
                    setPreviewFiles([
                      ...previewFiles,
                      ...validImages.map((f) => URL.createObjectURL(f)),
                    ]);
                    e.target.value = "";
                  }}
                />

                <div className="isonga-reg-gallery-grid">
                  {previewFiles.map((img, i) => (
                    <div key={i} className="isonga-reg-gallery-item">
                      <img src={img} alt="Preview" />
                      <button
                        type="button"
                        onClick={() => {
                          setFiles(files.filter((_, idx) => idx !== i));
                          setPreviewFiles(previewFiles.filter((_, idx) => idx !== i));
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOCATION & PHONE */}
              <div className="isonga-reg-grid">
                <div className="isonga-reg-input-group">
                  <label>Location</label>
                  <div className="isonga-reg-input-with-icon">
                    <FontAwesomeIcon icon={faMapPin} />
                    <input
                      type="text"
                      placeholder="Enter Location"
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="isonga-reg-input-group">
                  <label>Phone Number</label>
                  <div className="isonga-reg-input-with-icon">
                    <FontAwesomeIcon icon={faPhone} />
                    <input
                      type="tel"
                      placeholder="07XXXXXXXX"
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="isonga-reg-input-group">
                <label>Business Description</label>
                <textarea
                  placeholder="Tell customers what makes your shop special..."
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* EMAIL */}
              <div className="isonga-reg-input-group">
                <label>Email Address</label>
                <div className="isonga-reg-input-with-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <input
                    type="email"
                    placeholder="Enter Email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* PASSWORDS */}
              <div className="isonga-reg-grid">
                <div className="isonga-reg-input-group">
                  <label>Password</label>
                  <div className="isonga-reg-input-with-icon isonga-reg-password-field-wrap">
                    <FontAwesomeIcon icon={faLock} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span className="isonga-reg-eye-icon" onClick={togglePassword}>
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </span>
                  </div>
                </div>

                <div className="isonga-reg-input-group">
                  <label>Confirm Password</label>
                  <div className="isonga-reg-input-with-icon isonga-reg-password-field-wrap">
                    <FontAwesomeIcon icon={faLock} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat Password"
                      onChange={(e) => setRepeat_Pass(e.target.value)}
                      required
                    />
                    <span className="isonga-reg-eye-icon" onClick={togglePassword}>
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </span>
                  </div>
                </div>
              </div>

              {/* TERMS & CONDITIONS */}
              <div className="isonga-reg-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="sellerAgree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                />
                <label htmlFor="sellerAgree">
                  I agree to the{" "}
                  <Link to="/PrivacyRules">Privacy Policy & Marketplace Rules</Link>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button type="submit" className="isonga-reg-submit-btn" disabled={loading}>
                {loading ? (
                  "Creating Store..."
                ) : (
                  <>
                    Get Started <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: '8px', color: '#fff' }} />
                  </>
                )}
              </button>

              {/* RESPONSE ALERT MESSAGE */}
              {message && (
                <div className={`isonga-reg-alert-box isonga-reg-alert-${message.type}`}>
                  {message.text}
                </div>
              )}
            </form>

            <div className="isonga-reg-footer-link">
              Already a seller? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;