import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./api";
import ChatNotification from "./ChatNotification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faSearch, faCartShopping, faStar } from "@fortawesome/free-solid-svg-icons";
import GlobalBell from "./GlobalBell";

function Hospitality() {
  const [sellers, setSellers] = useState([]);
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [profile, setProfile] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });
  const [cartCount, setCartCount] = useState(0);

  const navigate = useNavigate();

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const res = await api.get("/api/cart/count");
      if (res.data.success) setCartCount(res.data.count);
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  // Render stars
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

  // Auto-slide images
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

  // Fetch sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await api.get("/api/sellers/Hospitality");

        if (!res.data.success) {
          navigate("/buyer_login");
          return;
        }

        setSellers(res.data.sellers);
        setProfile(res.data.buyer.profile);
        setBuyerName(res.data.buyer.name);
        setBuyerId(res.data.buyer._id);

      } catch (error) {
        console.log(error);
        setMessage("Error fetching shops");
      }
    };

    fetchSellers();
  }, [navigate]);

  // File URL helper
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http")
      ? path
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // Navbar hide/show
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
          <ChatNotification userId={buyerId} />
        </div>

        <GlobalBell buyerId={buyerId} />

        <div className="Buyer_Dashboard_nav">
          <nav>
            <ul>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/Hospitality">Hospitality</Link></li>
            </ul>
          </nav>
        </div>

        {/* Cart */}
        <Link to="/cart" className="cart-link" style={{ position: "relative" }}>
          <FontAwesomeIcon icon={faCartShopping} size="2x" />
          {cartCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
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
        <p>Browse Hospitality services and enjoy fast booking.</p>
      </div>

      {/* Search */}
      <div className="Buyer_Dashboard_search">
        <input type="search" className="searching" placeholder="Search" />
        <button><FontAwesomeIcon icon={faSearch} />Search</button>
      </div>

      {/* Sellers */}
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
                    <img
                      src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"}
                      alt="Profile"
                    />
                  </Link>
                </div>

                <div className="shop-card-info">
                  <h3>{seller.name} Shop</h3>
                  <p>{seller.location}</p>
                  <p>{seller.category} Shop</p>

                  <div className="rating">
                    {renderStars(seller.averageRating || 0)} ({seller.numReviews || 0})
                  </div>

                  <p>{seller.description}</p>

                  <div className="card-actions">
                    <Link to={`/Service_products/${seller._id}`}>
                      <button className="visit-btn">Visit Shop</button>
                    </Link>

                    <Link to={`/buyer_chat/${seller._id}`}>
                      <button className="chat-btn">Chat</button>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <p>{message || "Loading hospitality..."}</p>
        )}
      </div>

      {/* Modal */}
      {modalMedia.sellerId && (() => {
        const seller = sellers.find((s) => s._id === modalMedia.sellerId);
        if (!seller || !seller.files) return null;

        const file = seller.files[modalMedia.index];

        return (
          <div className="media-modal" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>
            <span className="close-btn">&times;</span>

            {isVideoFile(file) ? (
              <video src={getFileUrl(file)} controls autoPlay className="full-media" />
            ) : (
              <img src={getFileUrl(file)} alt="Full" className="full-media" />
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

export default Hospitality;