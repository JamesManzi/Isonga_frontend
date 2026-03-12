import "./View_Profile.css";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faStar } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
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

  // Socket for live rating updates
  useEffect(() => {
    const socket = io("https://isonga-backend.onrender.com", { withCredentials: true });
    socket.on("sellerRatingUpdated", (data) => {
      if (data.sellerId === id) {
        setAverageRating(data.averageRating);
        setNumReviews(data.numReviews);
        fetchReviews();
      }
    });
    return () => socket.disconnect();
  }, [id]);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const res = await axios.get(`https://isonga-backend.onrender.com/api/view_profile/${id}`, { withCredentials: true });
        if(!res.data.success){
            navigate("/buyer_login");
            return;
          }
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
      const res = await axios.get(`https://isonga-backend.onrender.com/api/view_profile/${id}`, { withCredentials: true });
      if (res.data.success) setReviews(res.data.seller.ratings || []);
    } catch (err) { console.log(err); }
  };

  const submitRating = async () => {
    if (!rating) { setMessage("Select a rating!"); return; }
    try {
      const res = await axios.post(`https://isonga-backend.onrender.com/api/rate_seller/${id}`, { rating, comment }, { withCredentials: true });
      if (res.data.success) {
        setMessage("Rating submitted!");
        setRating(0);
        setComment("");
        setAverageRating(res.data.averageRating);
        setNumReviews(res.data.numReviews);
        fetchReviews();
      }
    } catch (err) { console.log(err); setMessage("Error submitting rating"); }
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

  if (!seller) return <p>Loading seller profile...</p>;

  return (
    <div className="View_Profile">
      <div className="Seller_Profile_navbar">
        <div className="Seller_profile_logos"><img src="/logo.png" alt="Logo" /></div>
        <div className="seller_profile_heads"><h1>Isonga</h1><h2>Market</h2></div>
        <div className="seller_profile_logout"><Link to="/buyer_dashboard"><FontAwesomeIcon icon={faArrowRight} /></Link></div>
      </div>

      <div className="profile">
        {seller.profile && <img src={`https://isonga-backend.onrender.com/uploads/${seller.profile}`} alt="Seller" className="seller-image" onClick={() => setSelectedImage(seller.profile)} />}
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
      src={`https://isonga-backend.onrender.com/uploads/${file}`}
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
          <button onClick={submitRating}>Submit Rating</button>
          {message && <p>{message}</p>}
        </div>

        {/* Reviews list */}
         {reviews.map((r) => (
          <div key={r._id} className="review-item">
            <h4>{r.buyer?.name || "Anonymous"}</h4>
            {r.buyer?.profile&& (
              <img
                src={`https://isonga-backend.onrender.com/uploads/${r.buyer.profile}`}
                alt="Profile"
                onClick={() => setSelectedImage(r.buyer.profile)}
      style={{ cursor: "pointer" }}
              />
            )}
            <div className="review-stars">{renderStars(r.rating)}</div>
            {r.comment && <p>{r.comment}</p>}
            {r.createdAt && (
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            )}
          </div>
        ))}
      </div>
      {selectedImage && (
  <div className="image-modal" onClick={() => setSelectedImage(null)}>
    <span className="close-btn">&times;</span>
    <img src={`https://isonga-backend.onrender.com/uploads/${selectedImage}`} alt="Full view" />
  </div>
)}

    </div>
  );
}

export default View_Profile;