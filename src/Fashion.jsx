import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faSearch,faCartShopping,faStar } from "@fortawesome/free-solid-svg-icons";
function Fashion(){
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
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentImageIndex((prev) => {
      const newIndexes = { ...prev };
      // Change 'sellers' to your data array name
      sellers.forEach((item) => {
        if (item.files && item.files.length > 1) {
          const currentIndex = prev[item._id] || 0;
          newIndexes[item._id] = (currentIndex + 1) % item.files.length;
        }
      });
      return newIndexes;
    });
  }, 5000); 
  return () => clearInterval(interval);
}, [sellers]); // Update dependency to match your data

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await axios.get(
          "https://isonga-backend.onrender.com/api/sellers/Fashion",
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
const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);
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
                       <li><Link to="/fashion">Fashion</Link></li>
                      <li><Link to="/Electronics">Electronics</Link></li>
                      <li><Link to="/Furniture">Furniture</Link></li>
                      <li><Link to="/Construction">Construction</Link></li>
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
  {/* Logic to choose between Video or Image - CHANGED 'item' to 'seller' */}
  {isVideoFile(seller.files[currentImageIndex[seller._id] || 0]) ? (
    <video
      src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
      muted autoPlay loop
      className="slider-image"
      onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
    />
  ) : (
    <img
      src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
      className="slider-image"
      alt="media"
      onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
    />
  )}

  {/* The Instagram Dots - CHANGED 'item' to 'seller' */}
  {seller.files.length > 1 && (
    <div className="slider-dots">
      {seller.files.map((_, idx) => (
        <span 
          key={idx} 
          className={`dot ${idx === (currentImageIndex[seller._id] || 0) ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation(); 
            setCurrentImageIndex(prev => ({...prev, [seller._id]: idx}));
          }}
        ></span>
      ))}
    </div>
  )}
</div>
        ) : (
          <img src="/placeholder.png" alt="No Images" className="slider-image" />
        )}
        {/* Profile small avatar overlay */}
        {/* Profile small avatar overlay */}
<Link to={`/view_profile/${seller._id}`} className="profile-avatar">
  <img
    src={ getFileUrl(seller.profile)}
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
          <Link to={`/view_products/${seller._id}`}>
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

export default Fashion;