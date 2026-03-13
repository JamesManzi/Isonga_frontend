import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faSearch, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  // State for alert popup
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
      try {
        const res = await axios.get("https://isonga-backend.onrender.com/api/home_sellers");
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

  // Slider next
  const handleNext = (sellerId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [sellerId]: (prev[sellerId] + 1) % totalImages,
    }));
  };

  // Slider prev
  const handlePrev = (sellerId, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [sellerId]: (prev[sellerId] - 1 + totalImages) % totalImages,
    }));
  };

  return (
    <div className="Home">
      {/* Navbar */}
      <div className="Home_navbar">
        <div className="Home_brand">
          <img src="/logo.png" alt="logo" />
          <div className="Home_heads">
            <h1>Isonga</h1>
            <h2>Market</h2>
          </div>
        </div>
        <nav>
          <ul>
            <li><Link to="#">Home</Link></li>
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

      {/* Sellers Grid */}
      <div className="shop-grid">
        {filteredSellers.length > 0 ? (
          filteredSellers.map((seller) => (
            <div key={seller._id} className="shop-card">
              <div className="card-image-section">
  {seller.files && seller.files.length > 0 ? (
    <div className="image-slider">
      <img
        src={`https://isonga-backend.onrender.com/uploads/${seller.files[currentImageIndex[seller._id] || 0]}`}
        alt={seller.name}
        className="slider-image"
        onError={(e) => { e.target.src = "/placeholder.png"; }} // Add this to catch broken links
        onClick={() => showAlert("Please login first!")}
      />
      {/* ... slider controls ... */}
    </div>
  ) : (
    <img src="/placeholder.png" alt="Placeholder" className="slider-image" />
  )}

  {/* Profile Avatar */}
  <img
    src={`https://isonga-backend.onrender.com/uploads/${seller.profile}`}
    alt={`${seller.name} Profile`}
    className="avatar-image"
    onError={(e) => { e.target.src = "/default-avatar.png"; }}
    onClick={() => showAlert("Please login first!")}
  />
</div>
              {/* Info */}
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
                    Visit Shop
                  </button>
                  <button className="chat-btn" onClick={() => showAlert("Please login first!")}>
                    Chat
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No sellers found</p>
        )}
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div className="media-modal" onClick={() => setSelectedMedia(null)}>
          <span className="close-btn">&times;</span>
          {isVideoFile(selectedMedia) ? (
            <video src={`https://isonga-backend.onrender.com/uploads/${selectedMedia}`} controls autoPlay />
          ) : (
            <img src={`https://isonga-backend.onrender.com/uploads/${selectedMedia}`} alt="Full view" />
          )}
        </div>
      )}

      {message && <p>{message}</p>}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="alert-overlay">
          <div className="alert-box">
            <p>{alertMessage}</p>
            <button onClick={closeAlert}>OK</button>
          </div>
        </div>
      )}
      {/* ================= PREMIUM FOOTER ================= */}

<footer className="footer">

  {/* Back To Top */}
  <div 
    className="back-to-top"
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  >
    Back to Top
  </div>

  <div className="footer-container">

    {/* Column 1 */}
    <div className="footer-col">
      <h3>Get to Know Us</h3>
      <Link to="#">About Isonga</Link>
      <Link to="#">Careers</Link>
      <Link to="#">Press Releases</Link>
      <Link to="#">Our Mission</Link>
    </div>

    {/* Column 2 */}
    <div className="footer-col">
      <h3>Make Money with Us</h3>
      <Link to="/login">Sell on Isonga</Link>
      <Link to="#">Seller Guide</Link>
      <Link to="#">Advertise Products</Link>
      <Link to="#">Affiliate Program</Link>
    </div>

    {/* Column 3 */}
    <div className="footer-col">
      <h3>Buyer Support</h3>
      <Link to="/buyer_login">Your Account</Link>
      <Link to="/Help">Help Center</Link>
      <Link to="#">Shipping Info</Link>
      <Link to="#">Returns</Link>
    </div>

    {/* Column 4 */}
    <div className="footer-col">
      <h3>Connect With Us</h3>

      <div className="social-icons">
        <i className="fab fa-facebook"></i>
        <i className="fab fa-twitter"></i>
        <i className="fab fa-instagram"></i>
      </div>

      <div className="newsletter">
        <p>Subscribe for offers & updates</p>
        <input type="email" placeholder="Enter your email" />
        <button>Subscribe</button>
      </div>
    </div>

  </div>

  {/* Trust Section */}
  <div className="trust-section">
    <div>🔒 Secure Transactions</div>
    <div>✔ Verified Sellers</div>
    <div>⭐ Trusted by Buyers</div>
    <div>💬 24/7 Support</div>
  </div>

  {/* Payment Section */}

  <div className="footer-bottom">
    © {new Date().getFullYear()} Isonga Market. All rights reserved.
  </div>

</footer>
    </div>
  );
}

export default Home;