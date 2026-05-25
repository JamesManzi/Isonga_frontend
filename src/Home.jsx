
import { useState, useEffect } from "react";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faSearch, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import "./Home.css";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
function Home() {
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 }); // FIXED: Added missing state
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");

  // Show alert
  const showAlert = (msg) => {
    setAlertMessage(msg);
  };

  // Close alert
  const closeAlert = () => {
    setAlertMessage("");
  };

  // Check if file is video
  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  // Render stars including half-stars
  const renderStars = (avg = 0) => {
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

  // Fetch sellers
  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true); 
      try {
        const res = await api.get("/api/home_sellers");
        if (res.data.success) {
          const sellersWithRatings = (res.data.sellers || []).map((seller) => ({
            ...seller,
            averageRating: seller.averageRating || 0,
            numReviews: seller.numReviews || 0,
          }));
          setSellers(sellersWithRatings);
          setFilteredSellers(sellersWithRatings);

          const indexes = {};
          sellersWithRatings.forEach((seller) => {
            indexes[seller._id] = 0;
          });
          setCurrentImageIndex(indexes);
        } else {
          setMessage(res.data.message || "Unable to load data");
        }
      } catch (error) {
        console.error(error);
        setMessage("Error loading sellers");
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  // Handle search input
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSellers(sellers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sellers.filter(
        (seller) =>
          seller.name.toLowerCase().includes(query) ||
          seller.category.toLowerCase().includes(query)
      );
      setFilteredSellers(filtered);
    }
  }, [searchQuery, sellers]);

  // Auto-slide effect
  useEffect(() => {
    if (sellers.length === 0) return;
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

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http")
      ? path
      : `https://api.isongamarket.com/uploads/${path}`;
  };

if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>Loading marketplace...</h2>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Home">
      <Helmet>
  <title>Isonga Market Rwanda - Buy & Sell Online</title>

  <meta
    name="description"
    content="Buy and sell products, shops, phones, clothes and more in Rwanda using Isonga Market."
  />

  <link
    rel="canonical"
    href="https://www.isongamarket.com/"
  />

  <meta property="og:title" content="Isonga Market Rwanda - Buy & Sell Online" />
  <meta
    property="og:description"
    content="Buy and sell products, shops, phones, clothes and more in Rwanda using Isonga Market."
  />
  <meta
    property="og:url"
    content="https://www.isongamarket.com/"
  />
  <meta property="og:type" content="website" />
</Helmet>
      {/* Navbar */}
      <div className="Home_navbar">
        <div className="Home_brand">
          <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
          <div className="Home_heads">
            <h1>Isonga</h1>
            <h2>Market</h2>
          </div>
        </div>
        <nav>
          <ul>
            <li><Link to="/PrivacyRules">Privacy</Link></li>
            <li><Link to="/Steps">How It Works</Link></li>
            <li><Link to="/Help">Help</Link></li>
          </ul>
        </nav>
      </div>

      {/* Hero */}
      <div className="Home_body">
        <div className="Home_body_text">
          <h1>Connect Buyers And Sellers</h1>
          <p>Buy And Sell Everywhere, Fast and Secure</p>
        </div>
        <div className="home_body_btns">
          <Link to="/buyer_login">
            <button className="home_buyer_btn">I am Buyer</button>
          </Link>
          <Link to="/login">
            <button className="home_seller_btn">I am Seller</button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="Buyer_Dashboard_search">
        <input
          type="text"
          className="searching"
          placeholder="Search by shop name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button>
          <FontAwesomeIcon icon={faSearch} /> Search
        </button>
      </div>

      {/* Shop Grid */}
      <div className="shop-grid">
        {filteredSellers.length > 0 ? (
          filteredSellers.map((seller) => {
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
                    <img src="/placeholder.png" alt="Placeholder" className="slider-image" />
                  )}

                  <img
                    src={getFileUrl(seller.profile)}
                    alt={`${seller.name} Profile`}
                    className="profile_avatar"
                    onError={(e) => { e.target.src = "/default-avatar.png"; }}
                    onClick={() => showAlert("Please login first!")}
                  />
                </div>

                <div className="shop-card-info">
                  <h3 className="seller-name">{seller.name} Shop</h3>
                  <p className="seller-location">{seller.location}</p>
                  <p className="seller-category">{seller.category} Shop</p>
                  <div className="rating">
                    {renderStars(seller.averageRating)}
                    <span>({seller.numReviews})</span>
                  </div>
                  <p className="seller-description">{seller.description}</p>
                  <div className="card-actions">
                    <button className="visit-btn" onClick={() => showAlert("Please login first!")}>
                                            View Listings
                    </button>
                    <button className="chat-btn" onClick={() => showAlert("Please login first!")}>
                      Chat Seller
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>No sellers found</p>
        )}
      </div>

      {/* Media Zoom Modal */}
      {modalMedia.sellerId && (
        (() => {
          const seller = sellers.find(s => s._id === modalMedia.sellerId);
          if (!seller || !seller.files) return null;
          const file = seller.files[modalMedia.index];
          return (
            <div className="media-modal" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>
              <span className="close-btn" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>&times;</span>
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
        })()
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="alert-overlay">
          <div className="alert-box">
            <p>{alertMessage}</p>
            <button onClick={closeAlert}>OK</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="isonga-footer">
        <div className="footer-cta">
          <h2>Start Buying & Selling Today</h2>
          <p>Join Isonga Market and grow your business or find what you need fast.</p>
          <div className="footer-cta-buttons">
            <Link to="/buyer_login"><button className="cta-btn buyer">Join as Buyer</button></Link>
            <Link to="/login"><button className="cta-btn seller">Start Selling</button></Link>
          </div>
        </div>

        <div className="footer-main">
          <div className="footer-brand">
             <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
            <h3>Isonga Market</h3>
            <p>Connecting buyers and sellers across Rwanda easily and securely.</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Explore</h4>
              <Link to="#">Home</Link>
              <Link to="/Steps">How it Works</Link>
              <Link to="/Help">Help</Link>
            </div>
            <div>
              <h4>For Sellers</h4>
              <Link to="/login">Sell Products</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/PrivacyRules">Privacy Policy</Link>
            </div>
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            <p>Email: isongamarket@gmail.com</p>
            <div className="footer-socials">
              <i className="fab fa-facebook"></i>
              <i className="fab fa-twitter"></i>
              <i className="fab fa-instagram"></i>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} Isonga Market • Built for growth 🚀</p>
          <div className="scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Top</div>
        </div>
      </footer>
    </div>
  );
}

export default Home;