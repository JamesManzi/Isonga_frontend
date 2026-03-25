import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faSearch, faCartShopping, faStar } from "@fortawesome/free-solid-svg-icons";

function RealEstate() {
  const [sellers, setSellers] = useState([]);
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [profile, setProfile] = useState("");
  const navigate = useNavigate(); 
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });
  const [cartCount, setCartCount] = useState(0);

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

  // Auto-sliding logic for the main grid images
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
      try {
        const res = await axios.get(
          "https://isonga-backend.onrender.com/api/sellers/RealEstate",
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
      }
    };
    fetchSellers();
  }, [navigate]);

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // Hide/Show navbar based on modal or scroll
  useEffect(() => {
    const navbar = document.querySelector(".Buyer_Dashboard_navbar");
    if (!navbar) return;
    if (modalMedia.sellerId) {
      navbar.style.transform = "translateY(-100%)";
    } else {
      navbar.style.transform = "translateY(0)";
    }
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
            <img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="Profile" />
          </Link>
          <ChatNotification />
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

      {/* Welcome Message */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Browse premium Real Estate listings and find your perfect property.</p>
      </div>

      <div className="Buyer_Dashboard_search">
        <input type="search" className="searching" placeholder="Search Property" />
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
                          <span key={idx} className={`dot ${idx === activeIdx ? "active" : ""}`}
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
                    src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"}
                    alt={seller.name}
                    className="avatar-image"
                  />
                </Link>
              </div>

              <div className="shop-card-info">
                <h3 className="seller-name">{seller.name} Shop</h3>
                <p className="seller-location">{seller.location}</p>
                <div className="rating">
                  <p>{renderStars(seller.averageRating || 0)} ({seller.numReviews || 0})</p>
                </div>
                <p className="seller-description">{seller.description}</p>
                <div className="card-actions">
                  <Link to={`/Asset_products/${seller._id}`}>
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

      {/* Media Zoom Modal Fix */}
      {modalMedia.sellerId && (() => {
        const seller = sellers.find((s) => s._id === modalMedia.sellerId);
        if (!seller) return null;
        const file = seller.files[modalMedia.index];
        return (
          <div className="media-modal" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>
            <span className="close-btn" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>&times;</span>
            
            <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
              {isVideoFile(file) ? (
                <video src={getFileUrl(file)} controls autoPlay className="full-media" />
              ) : (
                <img src={getFileUrl(file)} alt="Full view" className="full-media" />
              )}
              
              {/* Modal Navigation Arrows */}
              {seller.files.length > 1 && (
                <div className="modal-controls">
                  <FontAwesomeIcon icon={faChevronLeft} className="modal-arrow left" onClick={(e) => {
                    e.stopPropagation();
                    setModalMedia(p => ({ ...p, index: (p.index - 1 + seller.files.length) % seller.files.length }));
                  }} />
                  <FontAwesomeIcon icon={faChevronRight} className="modal-arrow right" onClick={(e) => {
                    e.stopPropagation();
                    setModalMedia(p => ({ ...p, index: (p.index + 1) % seller.files.length }));
                  }} />
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <footer className="Buyer_Footer">
        <div className="Footer_Container">
          <div className="Footer_Section">
            <div className="Footer_Logo">
              <img src="/logo.png" alt="Isonga Logo"/>
              <h3>Isonga Market</h3>
            </div>
            <p>The leading digital marketplace in Rwanda.</p>
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
            <h4>Secure Payments</h4>
            <div className="Payment_Methods">
              <span className="Payment_Badge momo">MTN MoMo</span>
              <span className="Payment_Badge airtel">Airtel Money</span>
            </div>
          </div>
        </div>
        <div className="Footer_Bottom">
          <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default RealEstate;