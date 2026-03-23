import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight, 
  faSearch, 
  faCartShopping, 
  faStar 
} from "@fortawesome/free-solid-svg-icons";

import "./Buyer_Dashboard.css"; // Ensure this is imported for the styles

function Electronics() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [profile, setProfile] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  // Auto-slider for the images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const newIndexes = { ...prev };
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
  }, [sellers]);

  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "https://isonga-backend.onrender.com/api/sellers/Electronics",
          { withCredentials: true }
        );
        if (!res.data.success) {
          navigate("/buyer_login");
          return;
        }
        setSellers(res.data.sellers);
        setProfile(res.data.buyer.profile);
        setBuyerName(res.data.buyer.name);
      } catch (error) {
        console.log(error);
        setMessage("Error fetching shops");
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, [navigate]);

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  if (loading) {
    return (
      <div className="beautiful-loading">
        <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-3xl border border-white/30 shadow-2xl">
          <div className="loader-dots flex space-x-2 justify-center mb-4">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          </div>
          <h2 className="text-white font-bold text-xl tracking-widest">ISONGA MARKET</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="Buyer_Dashboard">
      {/* Navbar */}
      <div className="Buyer_Dashboard_navbar">
        <div className="Buyer_Dashboard_logos"><img src="/logo.png" alt="Logo" /></div>
        <div className="Buyer_Dashboard_heads"><h1>Isonga</h1><h2>Market</h2></div>
        <div className="Buyer_Dashboard_user">
          <Link to="/buyer_profile"><img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="Profile" /></Link>
          <ChatNotification />
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
          <FontAwesomeIcon icon={faCartShopping} size="2x" className="faCartShopping" />
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "12px", fontWeight: "bold" }}>
              {cartCount}
            </span>
          )}
        </Link>
        <div className="Buyer_Dashboard_logout">
          <Link to="/buyer_dashboard"><button>Dashboard</button></Link>
        </div>
      </div>

      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Browse the best Electronics Shops and enjoy secure shopping.</p>
      </div>

      <div className="Buyer_Dashboard_search">
        <input type="search" className="searching" placeholder="Search Electronics" />
        <button><FontAwesomeIcon icon={faSearch} />Search</button>
      </div>

      {/* Sellers Grid */}
      <div className="shop-grid">
        {sellers.map((seller) => {
          const activeIdx = currentImageIndex[seller._id] || 0;
          return (
            <div key={seller._id} className="shop-card">
              <div className="card-image-section">
                {seller.files && seller.files.length > 0 ? (
                  <div className="image-slider">
                    {isVideoFile(seller.files[activeIdx]) ? (
                      <video
                        src={getFileUrl(seller.files[activeIdx])}
                        muted autoPlay loop
                        className="slider-image"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalMedia({ sellerId: seller._id, index: activeIdx });
                        }}
                      />
                    ) : (
                      <img
                        src={getFileUrl(seller.files[activeIdx])}
                        className="slider-image"
                        alt="media"
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
                  <img src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"} alt="Avatar" className="avatar-image" />
                </Link>
              </div>

              <div className="shop-card-info">
                <h3 className="seller-name">{seller.name} Shop</h3>
                <p className="seller-location">{seller.location}</p>
                <div className="rating">
                  {renderStars(seller.averageRating || 0)} ({seller.numReviews || 0})
                </div>
                <p className="seller-description">{seller.description}</p>
                <div className="card-actions">
                  <Link to={`/view_products/${seller._id}`}><button className="visit-btn">Visit Shop</button></Link>
                  <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat</button></Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Zoom Modal with Arrows */}
      {modalMedia.sellerId && (() => {
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
      })()}

      <footer className="Buyer_Footer">
        <div className="Footer_Container">
          <div className="Footer_Section">
            <div className="Footer_Logo"><img src="/logo.png" alt="Logo" /><h3>Isonga Market</h3></div>
            <p>The leading digital marketplace in Rwanda.</p>
          </div>
          <div className="Footer_Section">
            <h4>Secure Payments</h4>
            <div className="Payment_Methods">
              <span className="Payment_Badge momo">MTN MoMo</span>
              <span className="Payment_Badge airtel">Airtel Money</span>
            </div>
          </div>
        </div>
        <div className="Footer_Bottom">
          <p>&copy; {new Date().getFullYear()} Isonga Market. Designed for Rwanda 🇷🇼</p>
        </div>
      </footer>
    </div>
  );
}

export default Electronics;