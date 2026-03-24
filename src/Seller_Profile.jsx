import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import "./Seller_Profile.css";

function Seller_Profile() {
  const [seller, setSeller] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

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

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);

  // ================= FETCH =================
  const fetchSeller = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://isonga-backend.onrender.com/api/seller_profile",
        { withCredentials: true }
      );

      if (!res.data.success) {
        navigate("/login");
        return;
      }

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

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeller();
  }, []);

  // ================= IMAGE URL =================
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";

    return path.startsWith("http")
      ? path
      : `https://isonga-backend.onrender.com/${path}`;
  };

  // ================= UPDATE =================
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const data = new FormData();

      data.append("name", formData.name);
      data.append("location", formData.location);
      data.append("phone", formData.phone);
      data.append("description", formData.description);

      if (profileImage) {
        data.append("profileImage", profileImage);
      }

      locationImages.forEach((file) => {
        data.append("files", file);
      });

      const res = await axios.put(
        "https://isonga-backend.onrender.com/api/seller_profile",
        data,
        { withCredentials: true }
      );

      if (res.data.success) {
        await fetchSeller(); // 🔥 refresh properly

        setShowEdit(false);
        setProfilePreview(null);
        setLocationPreview([]);
        setLocationImages([]);

      } else {
        alert("Update failed");
      }
    } catch (err) {
      console.log(err);
      alert("Error updating");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const deleteImage = async (filename) => {
    try {
      setLoading(true);

      await axios.delete(
        `https://isonga-backend.onrender.com/api/delete_location_image/${filename}`,
        { withCredentials: true }
      );

      // update UI instantly
      setSeller((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f !== filename),
      }));

    } catch (err) {
      console.log(err);
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= STARS =================
  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <FontAwesomeIcon
        key={i}
        icon={faStar}
        color={i < Math.round(rating) ? "gold" : "#ccc"}
      />
    ));

  // ================= LOADING UI =================
  if (loading && !seller) {
    return (
      <div className="loading-screen">
        <h2>Loading Profile...</h2>
      </div>
    );
  }

  return (
    <div className="Seller_Profile">

      {/* HEADER */}
      <div className="profile">
        <img
          src={getFileUrl(seller?.profile)}
          alt="Seller"
          onClick={() => setSelectedImage(seller.profile)}
        />
        <h2>{seller?.name}</h2>

        <div className="actions">
          <button onClick={() => setShowEdit(true)}>Edit</button>
          <Link to="/dashboard">
            <button>Back</button>
          </Link>
        </div>
      </div>

      {/* INFO */}
      <div className="info">
        <p><strong>Location:</strong> {seller?.location}</p>
        <p><strong>Email:</strong> {seller?.email}</p>
        <p><strong>Phone:</strong> {seller?.phone}</p>
        <p>{seller?.description}</p>
      </div>

      {/* IMAGES */}
      <h3>Store Images</h3>
      <div className="images">
        {seller?.files?.map((file) => (
          <div key={file} className="img-box">
            <img src={getFileUrl(file)} />
            <button onClick={() => deleteImage(file)}>Delete</button>
          </div>
        ))}

        {locationPreview.map((src, i) => (
          <div key={i} className="img-box">
            <img src={src} />
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img src={getFileUrl(selectedImage)} />
        </div>
      )}

      {/* EDIT FORM */}
      {showEdit && (
        <div className="edit-modal">
          <form onSubmit={handleUpdate}>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Name"
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

            {/* PROFILE IMAGE */}
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                setProfileImage(file);
                setProfilePreview(URL.createObjectURL(file));
              }}
            />

            {profilePreview && <img src={profilePreview} className="preview" />}

            {/* MULTIPLE IMAGES */}
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setLocationImages(files);
                setLocationPreview(files.map((f) => URL.createObjectURL(f)));
              }}
            />

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button type="button" onClick={() => setShowEdit(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* REVIEWS */}
      <div className="reviews">
        <h3>Reviews</h3>

        <div className="rating">
          <span>{averageRating.toFixed(1)}</span>
          {renderStars(averageRating)}
          <span>({numReviews})</span>
        </div>

        {reviews.map((r) => (
          <div key={r._id} className="review">
            <h4>{r.buyer?.name}</h4>
            <div>{renderStars(r.rating)}</div>
            <p>{r.comment}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Seller_Profile;