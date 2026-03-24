import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import "./Seller_Profile.css";

function Seller_Profile() {
  const navigate = useNavigate();

  // --- States ---
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For Zooming
  const [imageToDelete, setImageToDelete] = useState(null); // For Delete Confirmation

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
    description: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [locationImages, setLocationImages] = useState([]);
  const [locationPreview, setLocationPreview] = useState([]);

  // Ratings & Reviews States
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);

  // ================= 1. FETCH DATA =================
  const fetchSeller = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://isonga-backend.onrender.com/api/seller_profile", {
        withCredentials: true,
      });

      if (res.data.success) {
        const data = res.data.seller;
        setSeller(data);
        setFormData({
          name: data.name || "",
          location: data.location || "",
          phone: data.phone || "",
          description: data.description || "",
        });
        setReviews(data.ratings || []);
        setAverageRating(data.averageRating || 0);
        setNumReviews(data.numReviews || 0);
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeller();
  }, []);

  // ================= 2. SOCKET LOGIC =================
  useEffect(() => {
    if (!seller?._id) return;

    const socket = io("https://isonga-backend.onrender.com", { withCredentials: true });
    socket.emit("joinSellerRoom", seller._id);

    socket.on("sellerRatingUpdated", (data) => {
      if (data.sellerId === seller._id) {
        setAverageRating(data.averageRating);
        setNumReviews(data.numReviews);
        fetchSeller(); 
      }
    });

    return () => socket.disconnect();
  }, [seller?._id]);

  // ================= 3. HELPERS =================
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") 
      ? path 
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <FontAwesomeIcon
        key={i}
        icon={faStar}
        color={i < Math.round(rating) ? "gold" : "lightgray"}
      />
    ));

  // ================= 4. ACTIONS =================
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updatedForm = new FormData();
    updatedForm.append("name", formData.name);
    updatedForm.append("location", formData.location);
    updatedForm.append("phone", formData.phone);
    updatedForm.append("description", formData.description);

    if (profileImage) updatedForm.append("profileImage", profileImage);
    locationImages.forEach((file) => updatedForm.append("files", file));

    try {
      const res = await axios.put(
        "https://isonga-backend.onrender.com/api/seller_profile",
        updatedForm,
        { withCredentials: true }
      );
      if (res.data.success) {
        setSeller(res.data.updatedSeller);
        setShowEdit(false);
        setProfilePreview(null);
        setLocationPreview([]);
        setLocationImages([]);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteImage = async () => {
    if (!imageToDelete) return;
    setLoading(true);
    try {
      await axios.delete(
        `https://isonga-backend.onrender.com/api/delete_location_image/${encodeURIComponent(imageToDelete)}`,
        { withCredentials: true }
      );
      setSeller((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f !== imageToDelete),
      }));
      setImageToDelete(null);
    } catch (err) {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Conditional Loading View ---
  if (!seller && loading) {
    return (
      <div className="profile-beautiful-loading">
        <div className="loading-card">
          <div className="wave-loader">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <h2>ISONGA MARKET</h2>
          <p>Loading Your profile...</p>
        </div>
      </div>
    );
  }

  if (!seller) return null;

  return (
    <div className="Seller_Profile">
      {/* 1. Header Section */}
      <div className="profile-header-card">
        <div className="profile-main-info">
          {seller.profile && (
            <img
              src={getFileUrl(seller.profile)}
              alt="Seller"
              className="seller-avatar"
              onClick={() => setSelectedImage(seller.profile)}
            />
          )}
          <div className="seller-titles">
            <h2>{seller.name} Shop</h2>
            <div className="header-actions">
              <button className="edit-btn" onClick={() => setShowEdit(true)}>Edit Profile</button>
              <Link to="/dashboard" className="back-link">Back</Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Info Grid */}
      <div className="info-section">
        <div className="info-item"><strong>Location:</strong> {seller.location}</div>
        <div className="info-item"><strong>Email:</strong> {seller.email}</div>
        <div className="info-item"><strong>Phone:</strong> {seller.phone}</div>
        <p className="seller-desc">{seller.description}</p>
      </div>

      {/* 3. Location Images Gallery */}
      <div className="gallery-section">
        <h3>Our Location Photos</h3>
        <div className="images-grid">
          {seller.files?.map((file) => (
            <div key={file} className="gallery-card">
              <img src={getFileUrl(file)} alt="Location" onClick={() => setSelectedImage(file)} />
              <button className="img-delete-btn" onClick={() => setImageToDelete(file)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Ratings Section */}
      <div className="reviews-section">
        <h3>Ratings & Reviews</h3>
        <div className="rating-summary-box">
          <div className="big-rating">{averageRating.toFixed(1)}</div>
          <div className="star-row">{renderStars(averageRating)}</div>
          <p>{numReviews} total review{numReviews !== 1 ? "s" : ""}</p>
        </div>

        <div className="reviews-list">
          {reviews.length === 0 ? <p className="no-data">No reviews yet.</p> : 
            reviews.map((r) => (
              <div key={r._id} className="review-card">
                <div className="review-header">
                  <img src={getFileUrl(r.buyer?.profile)} alt="User" />
                  <div>
                    <h4>{r.buyer?.name || "Anonymous"}</h4>
                    <div className="review-stars">{renderStars(r.rating)}</div>
                  </div>
                </div>
                {r.comment && <p className="review-text">{r.comment}</p>}
                <small className="review-date">{r.createdAt && new Date(r.createdAt).toLocaleDateString()}</small>
              </div>
            ))
          }
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal-content profile-edit-form">
            <h2>Update Profile</h2>
            <form onSubmit={handleUpdate}>
              <div className="input-group">
                <label>Shop Name</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Location</label>
                <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Phone</label>
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              
              <div className="file-inputs">
                <label>Change Profile Image</label>
                <input type="file" onChange={(e) => {
                  setProfileImage(e.target.files[0]);
                  setProfilePreview(URL.createObjectURL(e.target.files[0]));
                }} />
                {profilePreview && <img src={profilePreview} className="form-preview" />}
                
                <label>Add Location Photos (Multiple)</label>
                <input type="file" multiple onChange={(e) => {
                  const filesArray = Array.from(e.target.files);
                  setLocationImages(filesArray);
                  setLocationPreview(filesArray.map((f) => URL.createObjectURL(f)));
                }} />
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
                <button type="button" className="cancel-btn" onClick={() => setShowEdit(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div className="zoom-modal" onClick={() => setSelectedImage(null)}>
          <img src={getFileUrl(selectedImage)} alt="Full View" />
          <span className="close-zoom">&times;</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {imageToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm">
            <h3>Delete this photo?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="confirm-delete" onClick={executeDeleteImage} disabled={loading}>{loading ? "Deleting..." : "Yes, Delete"}</button>
              <button className="cancel-btn" onClick={() => setImageToDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Seller_Profile;