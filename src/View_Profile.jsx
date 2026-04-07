import "./View_Profile.css";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faStar } from "@fortawesome/free-solid-svg-icons";
import api from "./api";
import { io } from "socket.io-client";

function View_Profile() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);
  const [message, setMessage] = useState("");
  const [loading,setLoading]=useState(false)
  // Socket for live rating updates
  // Socket for live rating updates
  useEffect(() => {
    const socket = io("https://isonga-backend.onrender.com", { withCredentials: false });

    // Listener for new ratings
    socket.on("sellerRatingUpdated", (data) => {
      if (data.sellerId === id) {
        setAverageRating(data.averageRating);
        setNumReviews(data.numReviews);
        fetchReviews();
      }
    });

    // Listener for seller replies (Moved OUTSIDE the other listener)
    socket.on("sellerReplyAdded", (data) => {
      setReviews((prevReviews) =>
        prevReviews.map((rev) =>
          rev._id === data.ratingId ? { ...rev, sellerReply: data.sellerReply } : rev
        )
      );
    });

    return () => socket.disconnect();
  }, [id]);

  useEffect(() => {
    const fetchSeller = async () => {
      const token = localStorage.getItem("token");
        if (!token) {
        navigate("/buyer_login");
        return;
      }
      try {
      const res = await api.get(`/api/view_profile/${id}`);
        if (res.data.success) {
          setSeller(res.data.seller);
          setReviews(res.data.seller.ratings || []);
          setAverageRating(res.data.seller.averageRating || 0);
          setNumReviews(res.data.seller.numReviews || 0);
        }
      } catch (err) { console.log(err); }
    };
    fetchSeller();
  }, [id]);

  const fetchReviews = async () => {
    try {
     const res = await api.get(`/api/view_profile/${id}`);
      if (res.data.success) setReviews(res.data.seller.ratings || []);
    } catch (err) { console.log(err); }
  };

  const submitRating = async () => {
  if (!rating) { setMessage("Select a rating!"); return; }
  setLoading(true);
  try {
    // REMOVE ${id} from the URL and put it in the body object instead
    const res = await api.post(`/api/rate_seller`, { 
      sellerId: id, // Pass the id here
      rating, 
      comment 
    });

    if (res.data.success) {
      setMessage("Rating submitted!");
      setRating(0);
      setComment("");
      // Note: Ensure your backend actually returns these values in the response!
      if(res.data.averageRating) setAverageRating(res.data.averageRating);
      if(res.data.numReviews) setNumReviews(res.data.numReviews);
      fetchReviews();
    }
  } catch (err) {
    console.error(err);
    setMessage("Error submitting rating");
  } finally {
    setLoading(false);
  }
};

  const renderStars = (avg) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (avg >= i - 0.5) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ clipPath: "inset(0 50% 0 0)" }} />);
      else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
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

  const getFileUrl = (path) => {
  if (!path) return "/placeholder.png"; // Fallback if no image exists
  return path.startsWith("http") 
    ? path 
    : `https://isonga-backend.onrender.com/uploads/${path}`;
};

  return (
    <div className="View_Profile">
      <div className="Seller_Profile_navbar">
        <div className="Seller_profile_logos"><img src="/logo.png" alt="Logo" /></div>
        <div className="seller_profile_heads"><h1>Isonga</h1><h2>Market</h2></div>
        <div className="seller_profile_logout"><Link to="/buyer_dashboard"><FontAwesomeIcon icon={faArrowRight} /></Link></div>
      </div>

      <div className="profile">
        {seller.profile && <img src={getFileUrl(seller.profile)} alt="Seller" className="seller-image" onClick={() => setSelectedImage(seller.profile)} />}
        <p>{seller.name} Shop</p>
      </div>

      <div className="Seller_Profile_info">
        <p><strong>Location:</strong> {seller.location}</p>
        <p><strong>Phone:</strong> {seller.phone}</p>
        <p><strong>Email:</strong> {seller.email}</p>
        <p>{seller.description}</p>
        <div className="seller_profile_location">
                <h2>Our Location</h2><br/>
  {seller.files && seller.files.map((file, index) => (
    <img
      key={index}
      src={getFileUrl(file)}
      alt={`Seller File ${index}`}
      onClick={() => setSelectedImage(file)}
      style={{ cursor: "pointer" }}
    />
  ))}
        </div>
      </div>

      {/* Ratings */}
      <div className="seller-rating">
        <h3>Ratings & Reviews</h3>
        <p><strong>Average Rating:</strong> {averageRating.toFixed(1)} ({numReviews} reviews)</p>
        <div className="stars">{renderStars(averageRating)}</div>

        {/* Submit Rating */}
        <div className="rating-form">
          {[1,2,3,4,5].map((star) => (
            <FontAwesomeIcon key={star} icon={faStar} color={star <= rating ? "gold" : "gray"} onClick={() => setRating(star)} style={{ cursor: "pointer" }} />
          ))}
          <textarea placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button onClick={submitRating} disabled={loading}>
  {loading ? "Submiting..." : "submit Rating"}
</button>
          {message && <p>{message}</p>}
        </div>

        {/* Reviews list */}
{reviews.map((r) => (
  <div key={r._id} className="review-item" style={{ marginBottom: "20px" }}>
    <h4>{r.buyer?.name || "Anonymous"}</h4>
    {r.buyer?.profile && (
      <img
        src={getFileUrl(r.buyer.profile)}
        alt="Profile"
        onClick={() => setSelectedImage(r.buyer.profile)}
        style={{ cursor: "pointer", width: "40px", borderRadius: "50%" }}
      />
    )}
    <div className="review-stars">{renderStars(r.rating)}</div>
    {r.comment && <p>{r.comment}</p>}
    
    {/* --- UPDATED SECTION START --- */}
    {r.sellerReply && (
      <div className="seller-reply-box" style={{ 
        marginTop: "10px", 
        padding: "10px", 
        background: "#f9f9f9", 
        borderLeft: "4px solid #2563eb",
        borderRadius: "4px",
        marginLeft: "20px" 
      }}>
        <strong style={{ fontSize: "0.85rem", color: "#2563eb", textTransform: "capitalize" }}>
          {seller?.name || "Seller"}:
        </strong>
        <p style={{ margin: "5px 0 0 0", fontStyle: "italic" }}>{r.sellerReply}</p>
      </div>
    )}
    {/* --- UPDATED SECTION END --- */}

    {r.createdAt && (
      <small style={{ color: "#888" }}>
        {new Date(r.createdAt).toLocaleDateString()}
      </small>
    )}
  </div>
))}
      </div> {/* This closes seller-rating */}

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <span className="close-btn">&times;</span>
          <img src={getFileUrl(selectedImage)} alt="Full view" />
        </div>
      )}
    </div> // This closes View_Profile
  );
}

export default View_Profile;