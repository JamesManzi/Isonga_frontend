import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight, 
  faSearch, 
  faStar, 
  faCartShopping 
} from "@fortawesome/free-solid-svg-icons";

function Vehicles() {
  const [sellers, setSellers] = useState([]);
  const [buyerName, setBuyerName] = useState("");
  const [profile, setProfile] = useState("");
  const [message, setMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // --- Cart Count Logic ---
  const fetchCartCount = async () => {
    try {
      const res = await axios.get("https://isonga-backend.onrender.com/api/cart/count", {
        withCredentials: false
      });
      if (res.data.success) setCartCount(res.data.count);
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  // --- Star Rating Logic ---
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

  // --- Auto-sliding Logic ---
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

  // --- Fetch Sellers and Buyer Info ---
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await axios.get("https://isonga-backend.onrender.com/api/sellers/Vehicles", {
          withCredentials: false,
        });

        if (!res.data.success) {
          navigate("/buyer_login");
          return;
        }

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
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // --- Navbar Visibility Logic ---
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
      if (window.scrollY > lastScrollY) {
        navbar.style.transform = "translateY(-100%)";
      } else {
        navbar.style.transform = "translateY(0)";
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

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
              <img src={getFileUrl(profile)} alt="Profile" />
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
        <h1>Welcome back, {buyerName}! 🏎️</h1>
        <p>Find your next ride from verified vehicle dealers across Rwanda.</p>
      </div>

      {/* Search Bar */}
      <div className="Buyer_Dashboard_search">
        <input type="search" className="searching" placeholder="Search Vehicles..." />
        <button><FontAwesomeIcon icon={faSearch} /> Search</button>
      </div>

      {/* Sellers Grid */}
      <div className="shop-grid">
        {sellers.length > 0 ? (
          sellers.map((seller) => {
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
                          onClick={() => setModalMedia({ sellerId: seller._id, index: activeIdx })}
                        />
                      ) : (
                        <img
                          src={getFileUrl(seller.files[activeIdx])}
                          className="slider-image"
                          alt="vehicle"
                          onClick={() => setModalMedia({ sellerId: seller._id, index: activeIdx })}
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

                  <Link to={`/view_profile/${seller._id}`} className="profile-avatar">
                    <img
                      src={getFileUrl(seller.profile)}
                      alt={`${seller.name} Profile`}
                      className="avatar-image"
                    />
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
                    <Link to={`/Asset_products/${seller._id}`}>
                      <button className="visit-btn">Visit Shop</button>
                    </Link>
                    <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat</button></Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>{message || "No vehicle shops available"}</p>
        )}
      </div>

      {/* Reference Zoom Modal Model */}
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

      {/* Footer Section */}
      <footer className="Buyer_Footer">
        <div className="Footer_Container">
          <div className="Footer_Section">
            <div className="Footer_Logo">
              <img src="/logo.png" alt="Isonga Logo"/>
              <h3>Isonga Market</h3>
            </div>
            <p>The leading digital marketplace in Rwanda. Connecting local sellers with happy buyers.</p>
          </div>
          <div className="Footer_Section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/RealEstate">Real Estate</Link></li>
              <li><Link to="/Vehicles">Vehicles</Link></li>
              <li><Link to="/Agriculture">Agriculture</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
            </ul>
          </div>
          <div className="Footer_Section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/terms">Terms & Conditions</Link></li>
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
        <div className="Footer_Bottom">
          <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved.</p>
          <p>Designed for Rwanda 🇷🇼</p>
        </div>
      </footer>
    </div>
  );
}

export default Vehicles;