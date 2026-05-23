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

  // CATEGORY BASED ON SELLER TYPE
  const categoryOptions = {
    Product: [
      "Fashion",
      "Electronics",
      "Furniture",
      "Food",
      "building supplies",
    ],

    Asset: [
      "RealEstate",
      "Vehicles",
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rule =
      /^(?=.{10,})(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;

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
    formData.append("acceptedPolicies", agreed);

    formData.append("profile", profile);

    files.forEach((file) => {
      formData.append("files", file);
    });

    setLoading(true);

    try {
      const res = await api.post("/api/register", formData);

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
      console.log("RESPONSE:", error.response);

      setMessage({
        text:
          error.response?.data?.message ||
          error.message ||
          "Server error",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-reg-wrapper">
      {loading && <div className="modern-progress-bar"></div>}

      <div className="modern-reg-container">

        {/* SIDEBAR */}
        <div className="modern-reg-sidebar">
          <div className="sidebar-branding">
            <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
            <h2>
              Isonga <span>Market</span>
            </h2>
          </div>

          <div className="step-list">
            <div className="step-item active">
              <span className="step-num">1</span> Shop Identity
            </div>

            <div className="step-item active">
              <span className="step-num">2</span> Visuals & Location
            </div>

            <div className="step-item active">
              <span className="step-num">3</span> Account Security
            </div>
          </div>

          <div className="sidebar-footer">
            <p>
              &copy; {new Date().getFullYear()} Isonga Market.
              Ecommerce Hub
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="modern-reg-main">
          <div className="form-content-wrap">

            <div className="form-header">
              <h1>Become a Seller</h1>
              <p>Set up your professional store in minutes.</p>
              <p>Sell whatever online 24 hours with Isonga Market</p>
            </div>

            <form onSubmit={handleSubmit} className="modern-form">

              {/* PROFILE */}
              <div className="modern-upload-section">
                <div
                  className={`profile-circle-upload ${
                    previewProfile ? "has-image" : ""
                  }`}
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

                <input
                  type="file"
                  ref={profileInputRef}
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                      return alert(
                        "Please upload an image file for your profile."
                      );
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      return alert(
                        "Profile image must not exceed 5MB"
                      );
                    }

                    setProfile(file);
                    setPreviewProfile(URL.createObjectURL(file));
                  }}
                />

                <div className="upload-text">
                  <h3>Shop Profile</h3>
                  <p>
                    Upload your brand logo or a clear photo.
                  </p>
                </div>
              </div>

              {/* SHOP INFO */}
              <div className="modern-grid">

                {/* SHOP NAME */}
                <div className="modern-input-group">
                  <label>Shop Name</label>

                  <div className="input-with-icon">
                    <FontAwesomeIcon icon={faStore} />

                    <input
                      type="text"
                      placeholder="Enter Shop Name"
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* SELLER TYPE */}
                <div className="modern-input-group">
                  <label>Seller Type</label>

                  <select
                    value={sellerType}
                    onChange={(e) => {
                      setSellerType(e.target.value);
                      setCategory("");
                    }}
                    required
                  >
                    <option value="">
                      -- Select Seller Type --
                    </option>

                    <option value="Product">Product</option>
                    <option value="Asset">Asset</option>
                  </select>
                </div>

                {/* CATEGORY */}
                <div className="modern-input-group">
                  <label>Category</label>

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value)
                    }
                    required
                    disabled={!sellerType}
                  >
                    <option value="">
                      {sellerType
                        ? "-- Select Category --"
                        : "Select Seller Type First"}
                    </option>

                    {sellerType &&
                      categoryOptions[sellerType].map(
                        (cat, index) => (
                          <option key={index} value={cat}>
                            {cat}
                          </option>
                        )
                      )}
                  </select>
                </div>
              </div>

              {/* GALLERY */}
              <div className="modern-multi-upload">
                <label>Location Photos (Min 2 photos)</label>

                <div
                  className="multi-upload-trigger"
                  onClick={() =>
                    locationImagesRef.current.click()
                  }
                >
                  <FontAwesomeIcon icon={faImages} />
                  <span> Location Photos</span>
                </div>

                <input
                  type="file"
                  ref={locationImagesRef}
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFiles = Array.from(
                      e.target.files
                    );

                    const validImages = selectedFiles.filter(
                      (file) =>
                        file.type.startsWith("image/")
                    );

                    if (
                      validImages.length !==
                      selectedFiles.length
                    ) {
                      alert(
                        "Some files were skipped because they were not images."
                      );
                    }

                    if (
                      files.length + validImages.length >
                      6
                    ) {
                      return alert(
                        "Max 6 photos allowed total"
                      );
                    }

                    setFiles([
                      ...files,
                      ...validImages,
                    ]);

                    setPreviewFiles([
                      ...previewFiles,
                      ...validImages.map((f) =>
                        URL.createObjectURL(f)
                      ),
                    ]);
                  }}
                />

                <div className="modern-gallery-grid">
                  {previewFiles.map((img, i) => (
                    <div key={i} className="gallery-item">
                      <img src={img} alt="Preview" />

                      <button
                        type="button"
                        onClick={() => {
                          setFiles(
                            files.filter(
                              (_, idx) => idx !== i
                            )
                          );

                          setPreviewFiles(
                            previewFiles.filter(
                              (_, idx) => idx !== i
                            )
                          );
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOCATION & PHONE */}
              <div className="modern-grid">

                <div className="modern-input-group">
                  <label>Location</label>

                  <div className="input-with-icon">
                    <FontAwesomeIcon icon={faMapPin} />

                    <input
                      type="text"
                      placeholder="Enter Location"
                      onChange={(e) =>
                        setLocation(e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="modern-input-group">
                  <label>Phone Number</label>

                  <div className="input-with-icon">
                    <FontAwesomeIcon icon={faPhone} />

                    <input
                      type="tel"
                      placeholder="07XXXXXXXX"
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="modern-input-group">
                <label>Business Description</label>

                <textarea
                  placeholder="Tell customers what makes your shop special..."
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  required
                ></textarea>
              </div>

              {/* EMAIL */}
              <div className="modern-input-group">
                <label>Email Address</label>

                <div className="input-with-icon">
                  <FontAwesomeIcon icon={faEnvelope} />

                  <input
                    type="email"
                    placeholder="Enter Email"
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* PASSWORDS */}
              <div className="modern-grid">

                {/* PASSWORD */}
                <div className="modern-input-group">
                  <label>Password</label>

                  <div className="input-with-icon">
                    <div className="buyer_reg_input_wrapper">

                      <FontAwesomeIcon icon={faLock} />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Enter Password"
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        required
                      />

                      <span
                        className="eye-icon"
                        onClick={togglePassword}
                      >
                        <FontAwesomeIcon
                          icon={
                            showPassword
                              ? faEyeSlash
                              : faEye
                          }
                        />
                      </span>
                    </div>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="modern-input-group">
                  <label>Confirm Password</label>

                  <div className="input-with-icon">
                    <div className="buyer_reg_input_wrapper">

                      <FontAwesomeIcon icon={faLock} />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Repeat Password"
                        onChange={(e) =>
                          setRepeat_Pass(
                            e.target.value
                          )
                        }
                        required
                      />

                      <span
                        className="eye-icon"
                        onClick={togglePassword}
                      >
                        <FontAwesomeIcon
                          icon={
                            showPassword
                              ? faEyeSlash
                              : faEye
                          }
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modern-checkbox-wrapper">

  <input
    type="checkbox"
    id="sellerAgree"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    required
  />

  <label htmlFor="sellerAgree">
    I agree to the{" "}
    <Link to="/PrivacyRules">
      Privacy Policy & Marketplace Rules
    </Link>
  </label>

</div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="modern-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  "Creating Store..."
                ) : (
                  <>
                    Get Started{" "}
                    <FontAwesomeIcon
                      icon={faChevronRight}
                    />
                  </>
                )}
              </button>

              {/* MESSAGE */}
              {message && (
                <div
                  className={`modern-alert-box ${message.type}`}
                >
                  {message.text}
                </div>
              )}
            </form>

            <div className="modern-footer-link">
              Already a seller?{" "}
              <Link to="/login">Sign In</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;