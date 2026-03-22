import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight, faSearch,faStar,faCartShopping } from "@fortawesome/free-solid-svg-icons";
function RealEstate(){
    const [sellers, setSellers] = useState([]);
  const [message, setMessage] = useState("");
  const [buyerName,setBuyerName]=useState("");
  const [profile,setProfile]=useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  const [currentImageIndex, setCurrentImageIndex] = useState({});

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


  const renderStars = (avg) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      } else if (avg >= i - 0.5) {
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStar}
            color="gold"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        );
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
      }
    }
    return stars;
  };

const handlePrev = (sellerId, totalImages) => {
  setCurrentImageIndex(prev => ({
    ...prev,
    [sellerId]:
      (prev[sellerId] || 0) === 0
        ? totalImages - 1
        : (prev[sellerId] || 0) - 1
  }));
};

const handleNext = (sellerId, totalImages) => {
  setCurrentImageIndex(prev => ({
    ...prev,
    [sellerId]:
      (prev[sellerId] || 0) === totalImages - 1
        ? 0
        : (prev[sellerId] || 0) + 1
  }));
};

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await axios.get(
          "https://isonga-backend.onrender.com/api/sellers/RealEstate",
          { withCredentials: true }
        );
        if(!res.data.success){
            navigate("/buyer_login");
            return;
          }
        if (res.data.success) {
          setSellers(res.data.sellers);
          setProfile(res.data.buyer.profile);
          setBuyerName(res.data.buyer.name);
        } else {
          setMessage("No shops found");
        }
      } catch (error) {
        console.log(error);
        setMessage("Error fetching shops");
      }
    };

    fetchSellers();
  }, []);
  const getFileUrl = (path) => {
  if (!path) return "/placeholder.png"; // Fallback if no image exists
  return path.startsWith("http") 
    ? path 
    : `https://isonga-backend.onrender.com/uploads/${path}`;
};
    return(
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
            {profile ? (
              <img
                src={getFileUrl(profile)}
                alt="Profile"
              />
            ) : (
              <img src="/placeholder.png" alt="Profile" />
            )}
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
                <div className="Buyer_Dashboard_logout">
                  <Link to="/buyer_dashboard">
                    <button>Dashboard</button>
                  </Link>
                </div>
              </div>
              {/* Welcome Message */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Browse thousands of better Shops and enjoy secure, fast shopping.</p>
      </div>
            <div className="Buyer_Dashboard_search">
        <input type="search" className="searching" placeholder="Search"/>
        <button><FontAwesomeIcon icon={faSearch} />Search</button>
      </div>
      {/* Sellers Grid */}
<div className="shop-grid">
  {sellers.map((seller) => (
    <div key={seller._id} className="shop-card">

      {/* Image Section */}
      <div className="card-image-section">
        {seller.files && seller.files.length > 0 ? (
          <div className="image-slider">
            <img
              src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
              alt={seller.name}
              className="slider-image"
              onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
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
        {/* Profile small avatar overlay */}
        {/* Profile small avatar overlay */}
<Link to={`/view_profile/${seller._id}`} className="profile-avatar">
  <img
    src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"}
    alt={`${seller.name} Profile`}
    className="avatar-image" // optional: add a class for styling
  />
</Link>
      </div>
      {/* Info Section */}
      <div className="shop-card-info">
        <h3 className="seller-name">{seller.name} Shop</h3>
        <p className="seller-location">{seller.location}</p>
        <p className="seller-category">{seller.category} Shop</p>
        <div className="rating">
  <p>
    {renderStars(seller.averageRating || 0)}
    ({seller.numReviews || 0})
  </p>
</div>
        <p className="seller-description">
          {seller.description}
        </p>

        {/* Buttons */}
        <div className="card-actions">
          <Link to={`/Asset_products/${seller._id}`}>
            <button className="visit-btn">Visit Shop</button>
          </Link>

           <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat</button></Link>
        </div>
      </div>
    </div>
  ))}
    </div>
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
{/* FOOTER SECTION */}
<footer className="Buyer_Footer">
  <div className="Footer_Container">
    
    {/* Brand Section */}
    <div className="Footer_Section">
      <div className="Footer_Logo">
        <img src="/logo.png" alt="Isonga Logo"/>
        <h3>Isonga Market</h3>
      </div>
      <p>The leading digital marketplace in Rwanda. Connecting local sellers with happy buyers.</p>
      <div className="Social_Icons">
        {/* Add your social links here */}
      </div>
    </div>

    {/* Quick Links */}
    <div className="Footer_Section">
      <h4>Quick Links</h4>
      <ul>
        <li><Link to="/fashion">All Products</Link></li>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/RealEstate">Assets</Link></li>
        <li><Link to="/cart">My Cart</Link></li>
      </ul>
    </div>

    {/* Support */}
    <div className="Footer_Section">
      <h4>Support</h4>
      <ul>
        <li><Link to="/help">Help Center</Link></li>
        <li><Link to="/terms">Terms & Conditions</Link></li>
        <li><Link to="/privacy">Privacy Policy</Link></li>
      </ul>
    </div>

    {/* Payment & Trust Section (CRUCIAL) */}
    <div className="Footer_Section">
      <h4>Secure Payments</h4>
      <p>We support local payment methods:</p>
      <div className="Payment_Methods">
        {/* Replace these with your MoMo/Airtel logos */}
        <span className="Payment_Badge momo">MTN MoMo</span>
        <span className="Payment_Badge airtel">Airtel Money</span>
      </div>
      <p className="Secure_Note">🔒 SSL Secure Transactions</p>
    </div>

  </div>

  <div className="Footer_Bottom">
    <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved.</p>
    <p>Designed for Rwanda 🇷🇼</p>
  </div>
</footer>
        </div>
    )
}

export default RealEstate;