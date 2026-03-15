import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faSearch, faStar,faCartShopping } from "@fortawesome/free-solid-svg-icons";

function Vehicles() {
  const [sellers, setSellers] = useState([]);
  const [buyerName, setBuyerName] = useState("");
  const [profile, setProfile] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0); // rename from cartItems
const fetchCartCount = async () => {
    try {
      const res = await axios.get("https://isonga-backend.onrender.com/api/cart/count", {
        withCredentials: true
      });
      if (res.data.success) setCartCount(res.data.count);
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);


  // Render star ratings
  const renderStars = (avg) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (avg >= i - 0.5)
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStar}
            color="gold"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        );
      else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
  };

  // Image slider handlers
  const handlePrev = (sellerId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [sellerId]: (prev[sellerId] || 0) === 0 ? totalImages - 1 : (prev[sellerId] || 0) - 1,
    }));
  };

  const handleNext = (sellerId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [sellerId]: (prev[sellerId] || 0) === totalImages - 1 ? 0 : (prev[sellerId] || 0) + 1,
    }));
  };

  // Fetch sellers and buyer info
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await axios.get("https://isonga-backend.onrender.com/api/sellers/Vehicles", {
          withCredentials: true,
        });

        // Redirect if buyer not logged in
        if (!res.data.success) {
          navigate("/buyer_login");
          return; // stop execution
        }

        // Safely set buyer info
        if (res.data.buyer) {
          setBuyerName(res.data.buyer.name || "");
          setProfile(res.data.buyer.profile || "");
        }

        setSellers(res.data.sellers || []);
      } catch (error) {
        console.error(error);
        setMessage("Error fetching shops");
      }
    };

    fetchSellers();
  }, [navigate]);
const getFileUrl = (path) => {
  if (!path) return "/placeholder.png"; // Fallback if no image exists
  return path.startsWith("http") 
    ? path 
    : `https://isonga-backend.onrender.com/uploads/${path}`;
};
  return (
    <div>
      {/* Navbar */}
      <div className="Buyer_Dashboard_navbar">
        <div className="Buyer_Dashboard_logos">
          <img src="/logo.png" alt="Logo" />
        </div>
        <div className="Buyer_Dashboard_heads">
          <h1>Isonga</h1>
          <h2>Market</h2>
        </div>
        <div className="Buyer_Dashboard_user">
          <Link to="/buyer_profile">
              <img
                src={getFileUrl(profile)}
                alt="Profile"
              />
          </Link>
          <ChatNotification/>
        </div>
        <div className="Buyer_Dashboard_nav">
          <nav>
            <ul>
              <li><Link to="/RealEstate">Real Estate</Link></li>
              <li><Link to="/Vehicles">Vehicles</Link></li>
              <li><Link to="/Agriculture">Agriculture</Link></li>
            </ul>
          </nav>
        </div>
        <Link to="/cart" className="cart-link" style={{ position: "relative" }}>
      <FontAwesomeIcon icon={faCartShopping} size="2x" className="faCartShopping"/>
      {cartCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            background: "red",
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "12px",
            fontWeight: "bold"
          }}
        >
          {cartCount}
        </span>
      )}
    </Link>
        <div className="Buyer_Dashboard_logout">
          <Link to="/buyer_dashboard">
            <button>Dashboard</button>
          </Link>
        </div>
      </div>

      {/* Welcome */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Browse thousands of better Shops and enjoy secure, fast shopping.</p>
      </div>

      {/* Search */}
      <div className="Buyer_Dashboard_search">
        <input type="search" className="searching" placeholder="Search" />
        <button>
          <FontAwesomeIcon icon={faSearch} /> Search
        </button>
      </div>

      {/* Sellers Grid */}
      <div className="shop-grid">
        {sellers.length > 0 ? (
          sellers.map((seller) => (
            <div key={seller._id} className="shop-card">
              {/* Image Slider */}
              <div className="card-image-section">
                {seller.files && seller.files.length > 0 ? (
                  <div className="image-slider">
                    <img
                      src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
                      alt={seller.name}
                      className="slider-image"
                      onClick={() =>
                        setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])
                      }
                    />
                    <div className="slider-controls">
                      <FontAwesomeIcon
                        icon={faChevronLeft}
                        className="slider-icon"
                        onClick={() => handlePrev(seller._id, seller.files.length)}
                      />
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="slider-icon"
                        onClick={() => handleNext(seller._id, seller.files.length)}
                      />
                    </div>
                  </div>
                ) : (
                  <img src="/placeholder.png" alt="No Images" className="slider-image" />
                )}

                {/* Seller profile avatar */}
                <Link to={`/view_profile/${seller._id}`} className="profile-avatar">
                  <img
                    src={ getFileUrl(seller.profile)}
                    alt={`${seller.name} Profile`}
                    className="avatar-image"
                  />
                </Link>
              </div>

              {/* Info */}
              <div className="shop-card-info">
                <h3 className="seller-name">{seller.name} Shop</h3>
                <p className="seller-location">{seller.location}</p>
                <p className="seller-category">{seller.category} Shop</p>
                <div className="rating">
                  {renderStars(seller.averageRating || 0)} ({seller.numReviews || 0})
                </div>
                <p className="seller-description">{seller.description}</p>
                <div className="card-actions">
                  <Link to={`/view_products/${seller._id}`}>
                    <button className="visit-btn">Visit Shop</button>
                  </Link>
                  <Link to="#">
                    <button className="chat-btn">Chat</button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>{message || "No shops available"}</p>
        )}
      </div>

      {/* Media modal */}
      {selectedMedia && (
        <div className="media-modal" onClick={() => setSelectedMedia(null)}>
          <span className="close-btn">&times;</span>
          {selectedMedia.endsWith(".mp4") ? (
            <video src={getFileUrl(selectedMedia)} controls autoPlay />
          ) : (
            <img src={getFileUrl(selectedMedia)} alt="Full view" />
          )}
        </div>
      )}
    </div>
  );
}

export default Vehicles;