import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faStar, faCloudUploadAlt, faStore, faPhone, faMapPin, 
  faTrash, faChevronRight, faImages, faCheckCircle, faInfoCircle,faEdit
} from "@fortawesome/free-solid-svg-icons";
import { io } from "socket.io-client";
import "./Seller_Profile.css"; // Ensure you merge your Register.css styles here

function Seller_Profile() {
  const profileInputRef = useRef(null);
  const locationImagesRef = useRef(null);
  const navigate = useNavigate();

  // Core Data States
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
const [replyingTo, setReplyingTo] = useState(null); // Stores the ID of the review being replied to
  // Form States (Matching Register Style)
  const [name, setName] = useState("");
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [profile, setProfile] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [files, setFiles] = useState([]); // New files being added
  const [previewFiles, setPreviewFiles] = useState([]);

  // Ratings
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);

  const fetchSeller = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
        if (!token) {
        navigate("/login");
        return;
      }
      const res = await api.get("/api/seller_profile");
      if (res.data.success) {
        const data = res.data.seller;
        setSeller(data);
        // Pre-fill form
        setName(data.name || "");
        setLocation(data.location || "");
        setPhone(data.phone || "");
        setDescription(data.description || "");
        setPreviewProfile(getFileUrl(data.profile));
        
        setReviews(data.ratings || []);
        setAverageRating(data.averageRating || 0);
        setNumReviews(data.numReviews || 0);
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeller(); }, []);
const socketRef = useRef(null);

useEffect(() => {
  socketRef.current = io("https://isonga-backend.onrender.com", {
    transports: ["websocket"],
  });

  socketRef.current.on("sellerRatingUpdated", (data) => {
  if (data.sellerId === seller?._id) {
    setAverageRating(data.averageRating);
    setNumReviews(data.numReviews);
    fetchSeller();
  }
});

  socketRef.current.on("sellerReplyAdded", (data) => {
    setReviews((prev) =>
      prev.map((rev) =>
        rev._id === data.ratingId
          ? { ...rev, sellerReply: data.sellerReply }
          : rev
      )
    );
  });

  return () => socketRef.current.disconnect();
}, []);

useEffect(() => {
  if (seller?._id) {
    sellerIdRef.current = seller._id;

    socketRef.current.emit("userOnline", {
      userId: seller._id,
      userModel: "Seller",
    });
  }
}, [seller]);

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <FontAwesomeIcon key={i} icon={faStar} color={i < Math.round(rating) ? "gold" : "lightgray"} />
    ));

  // ================= UPDATE LOGIC =================
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("location", location);
    formData.append("phone", phone);
    formData.append("description", description);

    if (profile) formData.append("profileImage", profile);
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await api.put("/api/seller_profile", formData);
      if (res.data.success) {
        setSeller(res.data.updatedSeller);
        setShowEdit(false);
        setFiles([]);
        setPreviewFiles([]);
        alert("Profile updated successfully");
      }
    } catch (err) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (filename) => {
    if(!window.confirm("Delete this photo?")) return;
    try {
      await api.delete(`/api/delete_location_image/${encodeURIComponent(filename)}`);
      setSeller(prev => ({ ...prev, files: prev.files.filter(f => f !== filename) }));
    } catch (err) { alert("Delete failed"); }
  };

  // Function to handle both NEW and UPDATED replies
const handleReplySubmit = async (ratingId) => {
  if (!replyText.trim()) return;
  try {
    setLoading(true);
    const res = await api.put(`/api/ratings/${ratingId}/reply`, { reply: replyText });
    
    if (res.data.success) {
      setReplyText("");
      setReplyingTo(null);
      setIsEditingReply(false);
      fetchSeller(); 
      alert(isEditingReply ? "Reply updated!" : "Reply posted!");
    }
  } catch (err) {
    alert("Operation failed");
  } finally {
    setLoading(false);
  }
};

// Function to delete a reply (usually by sending an empty string to the backend)
const handleDeleteReply = async (ratingId) => {
  if (!window.confirm("Delete your reply?")) return;
  try {
    const res = await api.put(`/api/ratings/${ratingId}/reply`, { reply: "" });
    if (res.data.success) fetchSeller();
  } catch (err) {
    alert("Delete failed");
  }
};

// Helper to open the edit box with existing text
const startEditing = (review) => {
  setReplyingTo(review._id);
  setReplyText(review.sellerReply);
  setIsEditingReply(true);
};
  if (!seller) {
  return (
    <div className="profile-beautiful-loading">
      <div className="loading-card">
        
        {/* Animated wave bars */}
        <div className="wave-loader">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Branding */}
        <h2>ISONGA MARKET</h2>
        <p>Loading seller profile...</p>

      </div>
    </div>
  );
}


  return (
    <div className="Seller_Profile">
      {/* HEADER SECTION */}
      <div className="profile">
        <img 
          src={getFileUrl(seller.profile)} 
          alt="Seller" 
          className="seller-image" 
          onClick={() => setSelectedImage(seller.profile)}
        />
        <h2>{seller.name} Shop</h2>
        <div className="sell">
          <button onClick={() => setShowEdit(true)} className="modern-submit-btn">Edit Profile</button>
          <Link to="/dashboard" style={{ marginLeft: "15px" }}>
            <button className="back-btn">Back</button>
          </Link>
        </div>
      </div>

      <div className="Seller_Profile_info">
        <p><FontAwesomeIcon icon={faMapPin} /> <strong>Location:</strong> {seller.location}</p>
        <p><FontAwesomeIcon icon={faStore} /> <strong>Email:</strong> {seller.email}</p>
        <p><FontAwesomeIcon icon={faPhone} /> <strong>Phone:</strong> {seller.phone}</p>
        <p className="description-text">{seller.description}</p>
      </div>

      {/* EXISTING GALLERY */}
      <h3>Store Gallery</h3>
      <div className="seller-files">
        {seller.files?.map((file) => (
          <div key={file} className="image-wrapper">
            <img src={getFileUrl(file)} alt="Location" onClick={() => setSelectedImage(file)} />
            <button onClick={() => deleteImage(file)} className="delete-overlay"><FontAwesomeIcon icon={faTrash} /></button>
          </div>
        ))}
      </div>

      {/* MODERN UPDATE MODAL */}
      {showEdit && (
        <div className="modern-reg-wrapper" style={{position: 'fixed', top: 0, left: 0, zIndex: 1000, width: '100%', height: '100vh', overflowY: 'auto', background: 'rgba(0,0,0,0.8)'}}>
            <div className="modern-reg-container" style={{maxWidth: '800px', margin: '20px auto'}}>
                <div className="modern-reg-main">
                    <div className="form-content-wrap">
                        <div className="form-header">
                            <h1>Update Shop</h1>
                            <p>Refine your business presence on Isonga.</p>
                        </div>

                        <form onSubmit={handleUpdate} className="modern-form">
                            {/* Profile Upload */}
                            <div className="modern-upload-section">
                                <div 
                                    className={`profile-circle-upload ${previewProfile ? 'has-image' : ''}`}
                                    onClick={() => profileInputRef.current.click()}
                                >
                                    {previewProfile ? <img src={previewProfile} alt="Profile" /> : <FontAwesomeIcon icon={faCloudUploadAlt} />}
                                </div>
                                <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) { setProfile(file); setPreviewProfile(URL.createObjectURL(file)); }
                                }} />
                                <div className="upload-text">
                                    <h3>Shop Logo</h3>
                                    <p>Click circle to change photo.</p>
                                </div>
                            </div>

                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Shop Name</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faStore} />
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <label>Phone Number</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faPhone} />
                                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                    </div>
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <label>Location</label>
                                <div className="input-with-icon">
                                    <FontAwesomeIcon icon={faMapPin} />
                                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <label>Description</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                            </div>

                            {/* Multi-Upload for Gallery */}
                            <div className="modern-multi-upload">
                                <label>Add New Store Photos</label>
                                <div className="multi-upload-trigger" onClick={() => locationImagesRef.current.click()}>
                                    <FontAwesomeIcon icon={faImages} />
                                    <span>Browse Photos</span>
                                </div>
                                <input type="file" ref={locationImagesRef} hidden multiple accept="image/*" onChange={(e) => {
                                    const newFiles = Array.from(e.target.files);
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

                            <div className="form-actions" style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
                                <button type="submit" className="modern-submit-btn" disabled={loading} style={{flex: 2}}>
                                    {loading ? "Updating..." : <>Save Changes <FontAwesomeIcon icon={faCheckCircle} /></>}
                                </button>
                                <button type="button" className="modern-submit-btn" onClick={() => setShowEdit(false)} style={{flex: 1, background: '#666'}}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      )}

    {/* Reviews list */}
{reviews.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No reviews yet.</p>}

{reviews.map((r) => (
  <div key={r._id} className="review-item" style={{ borderBottom: "1px solid #eee", padding: "20px 0" }}>
    
    {/* 1. BUYER INFO & RATING (The part that was missing) */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
      {r.buyer?.profile && (
        <img
          src={getFileUrl(r.buyer.profile)}
          alt="Profile"
          onClick={() => setSelectedImage(r.buyer.profile)}
          style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover",cursor:"pointer" }}
        />
      )}
      <div>
        <h4 style={{ margin: 0 }}>{r.buyer?.name || "Anonymous Customer"}</h4>
        <div className="review-stars">{renderStars(r.rating)}</div>
      </div>
    </div>

    {/* 2. CUSTOMER COMMENT */}
    <p style={{ margin: "10px 0", color: "#444", fontSize: "15px" }}>{r.comment}</p>
    {r.createdAt && <small style={{ color: "#888" }}>{new Date(r.createdAt).toLocaleDateString()}</small>}

    {/* 3. REPLY SECTION (With Edit/Update/Delete) */}
    <div style={{ marginLeft: "30px", marginTop: "15px" }}>
      {replyingTo === r._id ? (
        <div className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="reply-textarea"
            placeholder="Write your response..."
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="modern-submit-btn" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => handleReplySubmit(r._id)}>
              {isEditingReply ? "Update Reply" : "Post Reply"}
            </button>
            <button className="back-btn" style={{ padding: "6px 12px", fontSize: "13px", background: "#999" }} onClick={() => {setReplyingTo(null); setIsEditingReply(false); setReplyText("");}}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {r.sellerReply ? (
            <div className="seller-reply-box" style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #3498db" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <strong style={{ color: "#3498db" }}>Your Reply:</strong>
                <div style={{ display: "flex", gap: "15px" }}>
                  <button onClick={() => startEditing(r)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '13px' }}>
                    <FontAwesomeIcon icon={faEdit || faCheckCircle} /> Edit
                  </button>
                  <button onClick={() => handleDeleteReply(r._id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '13px' }}>
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, color: "#555" }}>{r.sellerReply}</p>
            </div>
          ) : (
            <button 
              className="modern-submit-btn" 
              style={{ padding: "6px 15px", fontSize: "12px", background: "#3498db" }} 
              onClick={() => {setReplyingTo(r._id); setIsEditingReply(false);}}
            >
              Reply to Customer
            </button>
          )}
        </>
      )}
    </div>
  </div>
))}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <img src={getFileUrl(selectedImage)} alt="Full" className="full-image" />
        </div>
      )}
    </div>
  );
}

export default Seller_Profile;