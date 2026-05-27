import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./api";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight, 
  faSearch, 
  faStar, 
  faCartShopping 
} from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom"; // Necessary for the modal to work correctly
import GlobalBell from "./GlobalBell";
function Furniture() {
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]); // Added for search functionality
  const [searchQuery, setSearchQuery] = useState(""); // Added to track search input
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerId,setBuyerId]=useState("");
  const [profile, setProfile] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // 1. Fetch Cart Count
  const fetchCartCount = async () => {
    try {
      const res=await api.get("/api/cart/count");
      if (res.data.success) setCartCount(res.data.count);
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  // 2. Fetch Sellers (Furniture Category)
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await api.get("/api/sellers/Furniture");
        if (!res.data.success) {
          navigate("/buyer_login");
          return;
        }
        setSellers(res.data.sellers);
        setFilteredSellers(res.data.sellers); // Set initial filtered list
        setProfile(res.data.buyer.profile);
        setBuyerName(res.data.buyer.name);
        setBuyerId(res.data.buyer._id);
        // Initialize image indexes for the slider
        const indexes = {};
        res.data.sellers.forEach((s) => {
          indexes[s._id] = 0;
        });
        setCurrentImageIndex(indexes);
        fetchCartCount();
      } catch (error) {
        console.log(error);
        setMessage("Error fetching shops");
      }
    };
    fetchSellers();
  }, [navigate]);

  // 3. Search Filter Logic (Missing in original)
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredSellers(
      sellers.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, sellers]);

  // 4. Auto-Slide Images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const newIndexes = { ...prev };
        filteredSellers.forEach((item) => {
          if (item.files && item.files.length > 1) {
            const currentIndex = prev[item._id] || 0;
            newIndexes[item._id] = (currentIndex + 1) % item.files.length;
          }
        });
        return newIndexes;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [filteredSellers]);

  // 5. Navbar Scroll/Modal Logic
  useEffect(() => {
    const navbar = document.querySelector(".Buyer_Dashboard_navbar");
    if (!navbar) return;
    navbar.style.transform = modalMedia.sellerId ? "translateY(-100%)" : "translateY(0)";
  }, [modalMedia]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const navbar = document.querySelector(".Buyer_Dashboard_navbar");
      if (!navbar) return;
      navbar.style.transform = window.scrollY > lastScrollY ? "translateY(-100%)" : "translateY(0)";
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helpers
  const renderStars = (avg = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (avg >= i - 0.5) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ clipPath: "inset(0 50% 0 0)" }} />);
      } else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `https://api.isongamarket.com/uploads/${path}`;
  };

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  return (
    <div>
      {/* Navbar */}
      <div className="Buyer_Dashboard_navbar">
        <div className="Buyer_Dashboard_logos">
          <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
        </div>
        <div className="Buyer_Dashboard_heads">
          <h1>Isonga</h1>
          <h2>Market</h2>
        </div>
        <div className="Buyer_Dashboard_user">
          <Link to="/buyer_profile">
            <img src={getFileUrl(profile)} alt="Profile" />
          </Link>
          <ChatNotification userId={buyerId} />
        </div>
        <GlobalBell buyerId={buyerId} />
        <div className="Buyer_Dashboard_nav">
          <nav>
            <ul>
              <li><Link to="/fashion">Fashion</Link></li>
              <li><Link to="/Electronics">Electronics</Link></li>
            </ul>
          </nav>
        </div>
        <Link to="/cart" className="cart-link" style={{ position: "relative" }}>
          <FontAwesomeIcon icon={faCartShopping} size="2x" className="faCartShopping" />
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "12px", fontWeight: "bold" }}>
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

      {/* Heading */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Browse thousands of better Shops and enjoy secure, fast shopping.</p>
      </div>

      {/* Search Section */}
      <div className="Buyer_Dashboard_search">
        <input 
          type="search" 
          className="searching" 
          placeholder="Search shops..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button><FontAwesomeIcon icon={faSearch} />Search</button>
      </div>

      {/* Sellers Grid */}
      <div className="shop-grid">
        {filteredSellers.map((seller) => {
          const activeIdx = currentImageIndex[seller._id] || 0;
          return (
            <div key={seller._id} className="shop-card">
              <div className="card-image-section">
                {seller.files && seller.files.length > 0 ? (
                  <div className="image-slider">
                    {isVideoFile(seller.files[activeIdx]) ? (
                      <video
                        src={getFileUrl(seller.files[activeIdx])}
                        muted autoPlay loop className="slider-image"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalMedia({ sellerId: seller._id, index: activeIdx });
                        }}
                      />
                    ) : (
                      <img
                        src={getFileUrl(seller.files[activeIdx])}
                        alt={seller.name} className="slider-image"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalMedia({ sellerId: seller._id, index: activeIdx });
                        }}
                      />
                    )}
                    {seller.files.length > 1 && (
                      <div className="slider-dots">
                        {seller.files.map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`dot ${idx === activeIdx ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(prev => ({ ...prev, [seller._id]: idx }));
                            }}
                          ></span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <img src="/placeholder.png" alt="No Images" className="slider-image" />
                )}
                <Link to={`/view_profile/${seller._id}`} className="profile-avatar">
                  <img src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"} alt="Profile" className="avatar-image" />
                </Link>
              </div>

              <div className="shop-card-info">
                <h3 className="seller-name">{seller.name} Business</h3>
                <p className="seller-location">{seller.location}</p>
                <p className="seller-category">{seller.category}</p>
                <div className="rating">
                  <p>{renderStars(seller.averageRating || 0)} ({seller.numReviews || 0})</p>
                </div>
                <div className="description-container">
  <p
    className={`seller-description ${
      expandedCards[seller._id] ? "expanded" : ""
    }`}
  >
    {seller.description}
  </p>

  {seller.description?.length > 120 && (
    <button
      className="show-more-btn"
      onClick={() =>
        setExpandedCards((prev) => ({
          ...prev,
          [seller._id]: !prev[seller._id],
        }))
      }
    >
      {expandedCards[seller._id] ? "Show Less" : "Show More"}
    </button>
  )}
</div>
                <div className="card-actions">
                  <Link to={`/view_products/${seller._id}`}>
                    <button className="visit-btn">Visit Shop</button>
                  </Link>
                  <Link to={`/buyer_chat/${seller._id}`}>
                    <button className="chat-btn">Chat</button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Zoom Modal using Portal */}
      {modalMedia.sellerId && createPortal(
        (() => {
          const seller = sellers.find((s) => s._id === modalMedia.sellerId);
          if (!seller) return null;
          const file = seller.files[modalMedia.index];
          return (
            <div className="media-modal" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>
              <span className="close-btn">&times;</span>
              {isVideoFile(file) ? (
                <video src={getFileUrl(file)} controls autoPlay className="full-media" onClick={(e) => e.stopPropagation()} />
              ) : (
                <img src={getFileUrl(file)} alt="Full view" className="full-media" onClick={(e) => e.stopPropagation()} />
              )}
              <div className="modal-controls">
                <FontAwesomeIcon icon={faChevronLeft} className="modal-arrow" onClick={(e) => {
                  e.stopPropagation();
                  setModalMedia(p => ({ ...p, index: (p.index - 1 + seller.files.length) % seller.files.length }));
                }} />
                <FontAwesomeIcon icon={faChevronRight} className="modal-arrow" onClick={(e) => {
                  e.stopPropagation();
                  setModalMedia(p => ({ ...p, index: (p.index + 1) % seller.files.length }));
                }} />
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* Footer */}
      <footer className="Buyer_Footer">
              <div className="Footer_Container">
                <div className="Footer_Section">
                  <div className="Footer_Logo">
                    <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
                    <h3>Isonga Market</h3></div>
                  <p>© {new Date().getFullYear()} Isonga Market • Built for growth 🚀</p>
                </div>
                {/* Footer content remains same */}
                <div className="Footer_Section">
                  <h4>Quick Links</h4>
                  <ul>
                    <li><Link to="/fashion">All Products</Link></li>
                    <li><Link to="/RealEstate">Assets</Link></li>
                    <li><Link to="/cart">My Cart</Link></li>
                  </ul>
                </div>
                <div className="Footer_Section">
                  <h4>Support</h4>
                  <ul>
                    <li><Link to="/help-center">Help Center</Link></li>
                    <li><Link to="/Steping">How It Works</Link></li>
                    <li><Link to="/PrivacyRules">Privacy Policy</Link></li>
                  </ul>
                </div>
                <div className="Footer_Section">
                  <h4>Secure Payments</h4>
                  <div className="Payment_Methods">
                    <span className="Payment_Badge momo">MTN MoMo</span>
                    <span className="Payment_Badge airtel">Airtel Money</span>
                  </div>
                  <p className="Secure_Note">🔒 SSL Secure Transactions</p>
                </div>
              </div>
              <div className="Footer_Bottom"><p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved. Designed for Rwanda 🇷🇼</p></div>
            </footer>
    </div>
  );
}

export default Furniture;