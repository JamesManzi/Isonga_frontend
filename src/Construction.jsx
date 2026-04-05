import { useEffect, useState } from "react";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSearch, 
  faCartShopping, 
  faStar,
  faChevronLeft,
  faChevronRight  
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import ChatNotification from "./ChatNotification";
import GlobalBell from "./GlobalBell";

function Construction() {
  const [sellers, setSellers] = useState([]);
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [profile, setProfile] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  // Helpers
  const isVideoFile = (filename) => {
    if (!filename) return false;
    return /\.(mp4|webm|ogg|mov)$/i.test(filename);
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") 
      ? path 
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // Hide navbar when modal opens
  useEffect(() => {
    const navbar = document.querySelector(".Buyer_Dashboard_navbar");
    if (!navbar) return;

    if (modalMedia.sellerId) {
      navbar.style.transform = "translateY(-100%)";
    } else {
      navbar.style.transform = "translateY(0)";
    }
  }, [modalMedia]);

  // Hide navbar on scroll
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

  // Stars
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

  // Auto slider
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/sellers/Construction");

        if (!res.data.success) {
          navigate("/buyer_login");
          return;
        }

        setSellers(res.data.sellers);
        setBuyerName(res.data.buyer.name);
        setProfile(res.data.buyer.profile);
        setBuyerId(res.data.buyer._id);

        const cartRes = await api.get("/api/cart/count");
        if (cartRes.data.success) setCartCount(cartRes.data.count);

      } catch (error) {
        console.error("Error fetching Construction data:", error);
        setMessage("Error loading shops. Please try again later.");
      }
    };

    fetchData();
  }, [navigate]);

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
          <ChatNotification />
        </div>

        <GlobalBell buyerId={buyerId} />

        <div className="Buyer_Dashboard_nav">
          <nav>
            <ul>
              <li><Link to="/fashion">Fashion</Link></li>
              <li><Link to="/Electronics">Electronics</Link></li>
              <li><Link to="/Furniture">Furniture</Link></li>
              <li><Link to="/Food">Food</Link></li>
            </ul>
          </nav>
        </div>

        <Link to="/cart" className="cart-link" style={{ position: "relative" }}>
          <FontAwesomeIcon icon={faCartShopping} size="2x" />
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount}</span>
          )}
        </Link>

        <div className="Buyer_Dashboard_logout">
          <Link to="/buyer_dashboard">
            <button>Dashboard</button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Explore high-quality Construction services and materials across Rwanda.</p>
      </div>

      {/* Search */}
      <div className="Buyer_Dashboard_search">
        <input type="search" placeholder="Search Construction Shops..." />
        <button><FontAwesomeIcon icon={faSearch} /> Search</button>
      </div>

      {/* Sellers */}
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
                        alt={seller.name}
                        className="slider-image"
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
                              setCurrentImageIndex(prev => ({
                                ...prev,
                                [seller._id]: idx
                              }));
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
                    alt="Shop Profile"
                  />
                </Link>
              </div>

              <div className="shop-card-info">
                <h3>{seller.name} Shop</h3>
                <p>{seller.location}</p>
                <p>{seller.category} Construction</p>

                <div className="rating">
                  {renderStars(seller.averageRating || 0)}
                  <span> ({seller.numReviews || 0})</span>
                </div>

                <p>{seller.description}</p>

                <div className="card-actions">
                  <Link to={`/view_products/${seller._id}`}>
                    <button>Visit Shop</button>
                  </Link>
                  <Link to={`/buyer_chat/${seller._id}`}>
                    <button>Chat</button>
                  </Link>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modalMedia.sellerId && (() => {
        const seller = sellers.find(s => s._id === modalMedia.sellerId);
        if (!seller) return null;

        const file = seller.files[modalMedia.index];

        return (
          <div className="media-modal" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>
            <span className="close-btn">&times;</span>

            {isVideoFile(file) ? (
              <video src={getFileUrl(file)} controls autoPlay className="full-media" />
            ) : (
              <img src={getFileUrl(file)} alt="Full view" className="full-media" />
            )}

            <div className="modal-controls">
              <FontAwesomeIcon
                icon={faChevronLeft}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalMedia(p => ({
                    ...p,
                    index: (p.index - 1 + seller.files.length) % seller.files.length
                  }));
                }}
              />

              <FontAwesomeIcon
                icon={faChevronRight}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalMedia(p => ({
                    ...p,
                    index: (p.index + 1) % seller.files.length
                  }));
                }}
              />
            </div>
          </div>
        );
      })()}

    </div>
  );
}

export default Construction;