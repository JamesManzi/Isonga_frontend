import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faCartShopping
} from "@fortawesome/free-solid-svg-icons";

import ChatNotification from "./ChatNotification";
import "./Buyer_Dashboard.css";

function Buyer_Dashboard() {
  const navigate = useNavigate();

  // --- STATE ---
  const [buyerName, setBuyerName] = useState("");
  const [profile, setProfile] = useState("");
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [message, setMessage] = useState("");

  // --- CATEGORY CLASSIFICATION ---
  const productCategories = ["Fashion", "Electronics", "Furniture", "Construction"];
  const serviceCategories = ["services", "Hospitality"];
  const assetCategories = ["RealEstate", "Vehicles", "Agriculture"];

  const getSellerRoute = (category, id) => {
    if (productCategories.includes(category)) return `/view_products/${id}`;
    if (serviceCategories.includes(category)) return `/Service_Products/${id}`;
    if (assetCategories.includes(category)) return `/Asset_products/${id}`;
    return `/view_products/${id}`;
  };

  // --- FETCHING DATA ---
  const fetchCartCount = async () => {
    try {
      const res = await axios.get("https://isonga-backend.onrender.com/api/cart/count", { withCredentials: true });
      if (res.data.success) {
        setCartCount(res.data.count);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchData = async () => {
    try {
      const res = await axios.get("https://isonga-backend.onrender.com/api/buyer_dashboard", { withCredentials: true });
      if (!res.data.success) {
        navigate("/buyer_login");
        return;
      }
      const buyer = res.data.buyer;
      setBuyerName(buyer.name);
      setProfile(buyer.profile);
      setBuyerId(buyer._id);

      const sellersWithRatings = res.data.sellers.map(s => ({
        ...s,
        averageRating: s.averageRating || 0,
        numReviews: s.numReviews || 0
      }));

      setSellers(sellersWithRatings);
      setFilteredSellers(sellersWithRatings);

      const indexes = {};
      sellersWithRatings.forEach(s => { indexes[s._id] = 0; });
      setCurrentImageIndex(indexes);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCartCount();
    fetchData();
  }, [navigate]);

  // --- SEARCH FILTER ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
      return;
    }
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

  // --- HANDLERS ---
  const handleLogout = async () => {
    try {
      const res = await axios.post("https://isonga-backend.onrender.com/api/logout", {}, { withCredentials: true });
      if (res.data.success) navigate("/buyer_login");
    } catch (err) {
      console.log(err);
    }
  };

  const handleNext = (sellerId, total) => {
    setCurrentImageIndex(prev => ({ ...prev, [sellerId]: (prev[sellerId] + 1) % total }));
  };

  const handlePrev = (sellerId, total) => {
    setCurrentImageIndex(prev => ({ ...prev, [sellerId]: (prev[sellerId] - 1 + total) % total }));
  };

  const renderStars = (avg = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (avg >= i - 0.5) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ clipPath: "inset(0 50% 0 0)" }} />);
      else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
  };

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("http")) return path;
    return `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  return (
    <div className="Buyer_Dashboard">
      {/* NAVBAR */}
      <nav className="Buyer_Dashboard_navbar">
        <div className="Nav_Left">
          <div className="Buyer_Dashboard_logos">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div className="Buyer_Dashboard_heads">
            <h1>Isonga</h1>
            <h2>Market</h2>
          </div>
        </div>

        <div className="Buyer_Dashboard_nav">
          <Link to="/fashion">Products</Link>
          <Link to="/services">Services</Link>
          <Link to="/RealEstate">Assets</Link>
        </div>

        <div className="Nav_Right">
          <div className="Buyer_Dashboard_user">
            <Link to="/cart" className="cart-link">
              <FontAwesomeIcon icon={faCartShopping} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <ChatNotification />
            <Link to="/buyer_profile" className="profile-img-link">
              <img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="profile" />
            </Link>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* SEARCH & HERO */}
      <div className="Hero_Section">
        <div className="Buyer_Dashboard_Heading">
          <h1>Welcome back, {buyerName}! 🛍️</h1>
          <p>Browse shops and enjoy secure shopping.</p>
        </div>

        <div className="Buyer_Dashboard_search">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search sellers by name, category, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* SELLERS GRID */}
      <main className="shop-grid">
        {filteredSellers.length > 0 ? (
          filteredSellers.map(seller => (
            <div key={seller._id} className="shop-card">
              <div className="card-image-section">
                {seller.files && seller.files.length > 0 ? (
                  <div className="image-slider">
                    {isVideoFile(seller.files[currentImageIndex[seller._id] || 0]) ? (
                      <video
                        src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
                        className="slider-image"
                        onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
                      />
                    ) : (
                      <img
                        src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
                        alt={seller.name}
                        className="slider-image"
                        onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
                      />
                    )}
                    <div className="slider-controls">
                      <button onClick={() => handlePrev(seller._id, seller.files.length)}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                      <button onClick={() => handleNext(seller._id, seller.files.length)}>
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <img src="/placeholder.png" alt="no image" className="slider-image" />
                )}
                <Link to={`/view_profile/${seller._id}`} className="profile-avatar">
                  <img src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"} alt={seller.name} className="avatar-image" />
                </Link>
              </div>

              <div className="shop-card-info">
                <h3>{seller.name} Shop</h3>
                <p className="meta-text">{seller.location} • {seller.category}</p>
                <div className="rating">
                  {renderStars(seller.averageRating)}
                  <span>({seller.numReviews})</span>
                </div>
                <p className="description-text">{seller.description}</p>
                <div className="card-actions">
                  <Link to={getSellerRoute(seller.category, seller._id)} className="visit-btn">Visit Shop</Link>
                  <Link to={`/buyer_chat/${seller._id}`} className="chat-btn">Chat</Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No sellers found</p>
        )}
      </main>

      {/* MEDIA MODAL */}
      {selectedMedia && (
        <div className="media-modal" onClick={() => setSelectedMedia(null)}>
          <span className="close-btn">&times;</span>
          <div className="modal-content">
            {isVideoFile(selectedMedia) ? (
              <video src={getFileUrl(selectedMedia)} controls autoPlay />
            ) : (
              <img src={getFileUrl(selectedMedia)} alt="preview" />
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="Buyer_Footer">
        <div className="Footer_Container">
          <div className="Footer_Section">
            <div className="Footer_Logo">
              <img src="/logo.png" alt="Logo" />
              <h3>Isonga Market</h3>
            </div>
            <p>The leading digital marketplace in Rwanda.</p>
          </div>
          <div className="Footer_Section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/fashion">All Products</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/RealEstate">Assets</Link></li>
            </ul>
          </div>
          <div className="Footer_Section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
          <div className="Footer_Section">
            <h4>Secure Payments</h4>
            <div className="Payment_Methods">
              <span className="Payment_Badge momo">MTN MoMo</span>
              <span className="Payment_Badge airtel">Airtel</span>
            </div>
          </div>
        </div>
        <div className="Footer_Bottom">
          <p>&copy; {new Date().getFullYear()} Isonga Market. Designed for Rwanda 🇷🇼</p>
        </div>
      </footer>

      {message && <div className={`alert ${message.type}`}><span>{message.text}</span></div>}
    </div>
  );
}

export default Buyer_Dashboard;