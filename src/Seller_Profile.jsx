import { Link,useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { io } from "socket.io-client";
import "./Seller_Profile.css";

function Seller_Profile() {
  const [seller, setSeller] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
    description: "",
  });

  const navigate=useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const [locationImages, setLocationImages] = useState([]);
  const [locationPreview, setLocationPreview] = useState([]);

  // Ratings & Reviews
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);

  // ================= FETCH SELLER =================
  const fetchSeller = async () => {
    try {
      const res = await axios.get("https://isonga-backend.onrender.com/api/seller_profile", {
        withCredentials: true,
      });
      if(!res.data.success){
            navigate("/login");
            return;
          }
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
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchSeller();
  }, []);

  // ================= SOCKET FOR LIVE RATING UPDATES =================
  useEffect(() => {
    if (!seller?._id) return;

    const socket = io("https://isonga-backend.onrender.com", { withCredentials: true });
    socket.emit("joinSellerRoom", seller._id);

    socket.on("sellerRatingUpdated", (data) => {
      if (data.sellerId === seller._id) {
        setAverageRating(data.averageRating);
        setNumReviews(data.numReviews);
        fetchSeller(); // refresh reviews
      }
    });

    return () => socket.disconnect();
  }, [seller?._id]);

  // ================= RENDER STARS =================
  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <FontAwesomeIcon
        key={i}
        icon={faStar}
        color={i < Math.round(rating) ? "gold" : "lightgray"}
      />
    ));

  if (!seller) return <p>Loading seller profile...</p>;

  // ================= UPDATE PROFILE =================
  const handleUpdate = async (e) => {
    e.preventDefault();
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
        alert("Profile updated successfully");
      }
    } catch (err) {
      console.log(err);
      alert("Update failed");
    }
  };

  // ================= DELETE LOCATION IMAGE =================
  const deleteImage = async (filename) => {
    try {
      await axios.delete(
        `https://isonga-backend.onrender.com/api/delete_location_image/${filename}`,
        { withCredentials: true }
      );
      setSeller((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f !== filename),
      }));
    } catch (err) {
      console.log(err);
      alert("Delete failed");
    }
  };

  const getFileUrl = (path) => {
  if (!path) return "/placeholder.png"; // Fallback if no image exists
  return path.startsWith("http") 
    ? path 
    : `https://isonga-backend.onrender.com/uploads/${path}`;
};

  return (
    <div className="Seller_Profile">
      {/* PROFILE HEADER */}
      <div className="profile">
        {seller.profile && (
          <img
            src={getFileUrl(seller.profile)}
            alt="Seller"
            className="seller-image"
            onClick={() => setSelectedImage(seller.profile)}
            style={{cursor:"pointer"}}
          />
        )}
        <h2>{seller.name} Shop</h2>
        <div className="sell">
          <button onClick={() => setShowEdit(true)}>Edit Profile</button>
<Link to="/dashboard" style={{ marginLeft: "15px" }}>
  <button className="back-btn">Back</button>
</Link>

        </div>
      </div>

      {/* SELLER INFO */}
      <div className="Seller_Profile_info">
        <p>
          <strong>Location:</strong> {seller.location}
        </p>
        <p>
          <strong>Email: </strong> {seller.email}
        </p>
        <p>
          <strong>Phone:</strong> {seller.phone}
        </p>
        <p>{seller.description}</p>
      </div>

      {/* LOCATION IMAGES */}
      <h3>Our Location</h3>
      <div className="seller-files">
        {seller.files?.map((file) => (
          <div key={file} className="image-wrapper">
            <img
              src={getFileUrl(file)}
              alt="Location"
              onClick={() => setSelectedImage(file)}
            />
            <button onClick={() => deleteImage(file)}>Delete</button>
          </div>
        ))}
        {locationPreview.map((src, i) => (
          <div key={i} className="image-wrapper">
            <img src={src} alt={`New ${i}`} />
            <button
              onClick={() => {
                setLocationImages((prev) => prev.filter((_, idx) => idx !== i));
                setLocationPreview((prev) => prev.filter((_, idx) => idx !== i));
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <img
            src={getFileUrl(selectedImage)}
            alt="Full"
            className="full-image"
          />
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="edit-modal">
          <form onSubmit={handleUpdate} className="edit-form">
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Shop Name"
            />
            <input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Location"
            />
            <input
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Phone"
            />
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description"
            />
            <input
              type="file"
              onChange={(e) => {
                setProfileImage(e.target.files[0]);
                setProfilePreview(URL.createObjectURL(e.target.files[0]));
              }}
            />
            {profilePreview && (
              <img src={profilePreview} className="preview-img" alt="Preview" />
            )}
            <input
              type="file"
              multiple
              onChange={(e) => {
                const filesArray = Array.from(e.target.files);
                setLocationImages(filesArray);
                setLocationPreview(filesArray.map((f) => URL.createObjectURL(f)));
              }}
            />
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={() => setShowEdit(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RATINGS & REVIEWS */}
      <div className="seller-rating">
        <h3>Ratings & Reviews</h3>
        <div className="rating-summary">
          <span className="rating-number">{averageRating.toFixed(1)}</span>
          <div className="stars">{renderStars(averageRating)}</div>
          <span>
            ({numReviews} review{numReviews !== 1 ? "s" : ""})
          </span>
        </div>

        {reviews.length === 0 && <p>No reviews yet.</p>}

        {reviews.map((r) => (
          <div key={r._id} className="review-item">
            <h4>{r.buyer?.name || "Anonymous"}</h4>
            {r.buyer?.profile ? (
              <img
                src={getFileUrl(r.buyer.profile)}
                alt="Profile"
                onClick={() => setSelectedImage(r.buyer.profile)}
      style={{ cursor: "pointer" }}
              />
            ) : (
              <img src="/placeholder.png" alt="Profile" />
            )}
            <div className="review-stars">{renderStars(r.rating)}</div>
            {r.comment && <p>{r.comment}</p>}
            {r.createdAt && (
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Seller_Profile;