import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faSearch, faChevronLeft, faChevronRight,faCartShopping } from "@fortawesome/free-solid-svg-icons";
import ChatNotification from "./ChatNotification";
import "./Buyer_Dashboard.css";

function Buyer_Dashboard() {
  const navigate = useNavigate();
  const [buyerName, setBuyerName] = useState("");
  const [profile, setProfile] = useState("");
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [buyerId, setBuyerId] = useState("");
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

  const addToCart = async (productId, quantity) => {
  try {
    const res = await axios.post(
      "https://isonga-backend.onrender.com/api/cart/add",
      { productId, quantity },
      { withCredentials: true }
    );
    if (res.data.success) {
      setCartCount(res.data.cartCount); // update badge instantly
    }
  } catch (err) {
    console.error(err);
  }
};

  const handleLogout = async () => {
  try {

    const res = await axios.post(
      "https://isonga-backend.onrender.com/api/logout",
      {},
      { withCredentials: true }
    );

    if (res.data.success) {


      navigate("/buyer_login");
    }

  } catch (error) {
    console.log("Logout error", error);
  }
};
  // Helper: Render stars including half-stars
  const renderStars = (avg = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (avg >= i - 0.5)
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ clipPath: "inset(0 50% 0 0)" }} />);
      else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
  };

  // 1. Fetch initial data and identify User to Socket
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://isonga-backend.onrender.com/api/buyer_dashboard", { withCredentials: true });
        if (!res.data.success){
           navigate("/buyer_login");
           return;
        }

        const buyer = res.data.buyer;
        setBuyerName(buyer.name);
        setProfile(buyer.profile);
        setBuyerId(buyer._id);

        // Sellers Setup
        const sellersWithRatings = res.data.sellers.map(s => ({
          ...s,
          averageRating: s.averageRating || 0,
          numReviews: s.numReviews || 0
        }));
        setSellers(sellersWithRatings);
        setFilteredSellers(sellersWithRatings);

        // Image indexes
        const indexes = {};
        sellersWithRatings.forEach(s => indexes[s._id] = 0);
        setCurrentImageIndex(indexes);
    } catch(error){
      console.log(error);
    }
  }
    fetchData();
  }, [navigate]);


  // Search filter logic
  useEffect(() => {
    if (!searchQuery.trim()) return setFilteredSellers(sellers);
    const q = searchQuery.toLowerCase();
    setFilteredSellers(
      sellers.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, sellers]);

  // Image slider handlers
  const handleNext = (sellerId, total) => {
    setCurrentImageIndex(prev => ({ ...prev, [sellerId]: (prev[sellerId] + 1) % total }));
  };
  const handlePrev = (sellerId, total) => {
    setCurrentImageIndex(prev => ({ ...prev, [sellerId]: (prev[sellerId] - 1 + total) % total }));
  };
  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);


  return (
    <div className="Buyer_Dashboard">
      {/* Navbar */}
      <div className="Buyer_Dashboard_navbar">
        <div className="Buyer_Dashboard_logos"><img src="/logo.png" alt="Logo" /></div>
        <div className="Buyer_Dashboard_heads"><h1>Isonga</h1><h2>Market</h2></div>
        <div className="Buyer_Dashboard_user">
          <Link to="/buyer_profile">
            <img src={profile?.startsWith("http") ? profile : `https://isonga-backend.onrender.com/uploads/${profile}`} alt="Profile" />
          </Link>
          <ChatNotification />
        </div>
        <div className="Buyer_Dashboard_nav">
          <nav>
            <ul>
              <li><Link to="/fashion">Fashion</Link></li>
              <li><Link to="/RealEstate">Real Estate</Link></li>
              <li><Link to="/Vehicles">Vehicles</Link></li>
              <li><Link to="/Agriculture">Agriculture</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/Hospitality">Hospitality</Link></li>
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
        <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Browse shops and enjoy secure, fast shopping.</p>
      </div>

      {/* Search Bar */}
      <div className="Buyer_Dashboard_search">
        <input 
            type="text" 
            placeholder="Search sellers by name, category, location..." 
            className="Buyer_Dashboard search"
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
        />
        <button><FontAwesomeIcon icon={faSearch} /> Search</button>
      </div>

      {/* Sellers Grid */}
      <div className="shop-grid">
        {filteredSellers.length > 0 ? filteredSellers.map(seller => (
          <div key={seller._id} className="shop-card">
            <div className="card-image-section">
              {seller.files && seller.files.length > 0 ? (
                <div className="image-slider">
                  {isVideoFile(seller.files[currentImageIndex[seller._id] || 0]) ? (
                    <video
  src={seller.files[currentImageIndex[seller._id] || 0]?.startsWith("http") 
    ? seller.files[currentImageIndex[seller._id] || 0] 
    : `https://isonga-backend.onrender.com/uploads/${seller.files[currentImageIndex[seller._id] || 0]}`}
  // ... rest of props
                      controls
                      className="slider-image"
                      onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
                    />
                  ) : (
                    <img 
                      src={seller.files[currentImageIndex[seller._id] || 0]?.startsWith("http") 
    ? seller.files[currentImageIndex[seller._id] || 0] 
    : `https://isonga-backend.onrender.com/uploads/${seller.files[currentImageIndex[seller._id] || 0]}`} 
  alt={seller.name} 
                      className="slider-image" 
                      onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])} 
                    />
                  )}
                  <div className="slider-controls">
                    <FontAwesomeIcon icon={faChevronLeft} className="slider-icon" onClick={() => handlePrev(seller._id, seller.files.length)} />
                    <FontAwesomeIcon icon={faChevronRight} className="slider-icon" onClick={() => handleNext(seller._id, seller.files.length)} />
                  </div>
                </div>
              ) : (
                <img src="/placeholder.png" alt="No Images" className="slider-image" />
              )}
              <Link to={`/view_profile/${seller._id}`} className="profile-avatar">
                <img src={seller.profile?.startsWith("http") ? seller.profile : `https://isonga-backend.onrender.com/uploads/${seller.profile}`}/>
              </Link>
            </div>
            <div className="shop-card-info">
              <h3 className="seller-name">{seller.name} Shop</h3>
              <p className="seller-location">{seller.location}</p>
              <p className="seller-category">{seller.category} Shop</p>
              <div className="rating">{renderStars(seller.averageRating)} <span>({seller.numReviews})</span></div>
              <p className="seller-description">{seller.description}</p>
              <div className="card-actions">
                <Link to={`/view_products/${seller._id}`}><button className="visit-btn">Visit Shop</button></Link>
                <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat</button></Link>
              </div>
            </div>
          </div>
        )) : <p>No sellers found</p>}
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div className="media-modal" onClick={() => setSelectedMedia(null)}>
          <span className="close-btn">&times;</span>
         {isVideoFile(selectedMedia) ? (
  <video src={selectedMedia.startsWith("http") ? selectedMedia : `https://isonga-backend.onrender.com/uploads/${selectedMedia}`} controls autoPlay />
) : (
  <img src={selectedMedia.startsWith("http") ? selectedMedia : `https://isonga-backend.onrender.com/uploads/${selectedMedia}`} alt="Full view" />
)}
        </div>
      )}
    </div>
  );
}

export default Buyer_Dashboard;