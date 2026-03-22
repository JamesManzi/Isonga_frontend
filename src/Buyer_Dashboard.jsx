import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faCartShopping,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";

import ChatNotification from "./ChatNotification";
import "./Buyer_Dashboard.css";

function Buyer_Dashboard() {
  const navigate = useNavigate();

  // ORIGINAL STATES
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

  // ORIGINAL CATEGORY CLASSIFICATION
  const productCategories = ["Fashion", "Electronics", "Furniture", "Construction"];
  const serviceCategories = ["services", "Hospitality"];
  const assetCategories = ["RealEstate", "Vehicles", "Agriculture"];

  const getSellerRoute = (category, id) => {
    if (productCategories.includes(category)) return `/view_products/${id}`;
    if (serviceCategories.includes(category)) return `/Service_Products/${id}`;
    if (assetCategories.includes(category)) return `/Asset_products/${id}`;
    return `/view_products/${id}`;
  };

  // ORIGINAL FETCH CART COUNT
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

  useEffect(() => {
    fetchCartCount();
  }, []);

  // ORIGINAL LOGOUT
  const handleLogout = async () => {
    try {
      const res = await axios.post("https://isonga-backend.onrender.com/api/logout", {}, { withCredentials: true });
      if (res.data.success) {
        navigate("/buyer_login");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ORIGINAL STAR RENDER
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

  // ORIGINAL FETCH DASHBOARD DATA
  useEffect(() => {
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

        const sellersWithRatings = res.data.sellers.map((s) => ({
          ...s,
          averageRating: s.averageRating || 0,
          numReviews: s.numReviews || 0,
        }));

        setSellers(sellersWithRatings);
        setFilteredSellers(sellersWithRatings);

        const indexes = {};
        sellersWithRatings.forEach((s) => {
          indexes[s._id] = 0;
        });
        setCurrentImageIndex(indexes);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [navigate]);

  // ORIGINAL SEARCH FILTER
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredSellers(
      sellers.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q)) ||
          (s.location && s.location.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, sellers]);

  // ORIGINAL SLIDER LOGIC
  const handleNext = (sellerId, total) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [sellerId]: (prev[sellerId] + 1) % total,
    }));
  };

  const handlePrev = (sellerId, total) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [sellerId]: (prev[sellerId] - 1 + total) % total,
    }));
  };

  // ORIGINAL FILE HELPERS
  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("http")) return path;
    return `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  return (
    <div className="Buyer_Dashboard">
      {/* MODERNIZED NAVBAR */}
      <nav className="App_Navbar">
        <div className="Nav_Brand">
          <img src="/logo.png" alt="Logo" />
          <div className="Brand_Text">
            <h1>Isonga</h1>
            <h2>Market</h2>
          </div>
        </div>

        <div className="Nav_Search">
          <FontAwesomeIcon icon={faSearch} className="Search_Icon" />
          <input
            type="text"
            placeholder="Search shops, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="Nav_Actions">
          <Link to="/cart" className="Cart_Wrapper">
            <FontAwesomeIcon icon={faCartShopping} />
            {cartCount > 0 && <span className="Cart_Badge">{cartCount}</span>}
          </Link>
          <ChatNotification />
          <Link to="/buyer_profile" className="User_Avatar">
            <img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="profile" />
          </Link>
          <button className="Logout_Icon" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </div>
      </nav>

      <div className="App_Header">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <div className="Quick_Links">
          <Link to="/fashion">Products</Link>
          <Link to="/services">Services</Link>
          <Link to="/RealEstate">Assets</Link>
        </div>
      </div>

      {/* SELLERS GRID */}
      <div className="App_Content">
        <div className="Shop_Grid">
          {filteredSellers.length > 0 ? (
            filteredSellers.map((seller) => (
              <div key={seller._id} className="Shop_Card">
                <div className="Card_Media">
                  {seller.files && seller.files.length > 0 ? (
                    <div className="Image_Slider">
                      {isVideoFile(seller.files[currentImageIndex[seller._id] || 0]) ? (
                        <video
                          src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
                          className="Slider_Content"
                          onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
                        />
                      ) : (
                        <img
                          src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
                          alt={seller.name}
                          className="Slider_Content"
                          onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
                        />
                      )}
                      <div className="Slider_Nav">
                        <button onClick={() => handlePrev(seller._id, seller.files.length)}>
                          <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button onClick={() => handleNext(seller._id, seller.files.length)}>
                          <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img src="/placeholder.png" alt="no image" className="Slider_Content" />
                  )}
                  <Link to={`/view_profile/${seller._id}`} className="Seller_Avatar">
                    <img src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"} alt={seller.name} />
                  </Link>
                </div>

                <div className="Card_Details">
                  <div className="Card_Main">
                    <h3>{seller.name} Shop</h3>
                    <div className="Card_Rating">
                      {renderStars(seller.averageRating)}
                      <span>({seller.numReviews})</span>
                    </div>
                  </div>
                  <p className="Card_Meta">{seller.location} • {seller.category}</p>
                  <p className="Card_Desc">{seller.description}</p>
                  <div className="Card_Buttons">
                    <Link to={getSellerRoute(seller.category, seller._id)} className="Visit_Btn">Visit Shop</Link>
                    <Link to={`/buyer_chat/${seller._id}`} className="Chat_Btn">Chat</Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="Empty_Msg">No sellers found</p>
          )}
        </div>
      </div>

      {/* MEDIA MODAL */}
      {selectedMedia && (
        <div className="App_Modal" onClick={() => setSelectedMedia(null)}>
          <div className="Modal_Content">
            {isVideoFile(selectedMedia) ? (
              <video src={getFileUrl(selectedMedia)} controls autoPlay />
            ) : (
              <img src={getFileUrl(selectedMedia)} alt="preview" />
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="App_Footer">
        <div className="Footer_Grid">
          <div className="Footer_Col">
            <div className="Footer_Brand">
              <img src="/logo.png" alt="Logo" />
              <h3>Isonga Market</h3>
            </div>
            <p>Connecting local sellers with happy buyers across Rwanda.</p>
          </div>
          <div className="Footer_Col">
            <h4>Quick Links</h4>
            <Link to="/fashion">All Products</Link>
            <Link to="/services">Services</Link>
            <Link to="/cart">My Cart</Link>
          </div>
          <div className="Footer_Col">
            <h4>Secure Payments</h4>
            <div className="Payment_Tags">
              <span className="Tag_Momo">MTN MoMo</span>
              <span className="Tag_Airtel">Airtel Money</span>
            </div>
            <p className="Secure_Text">🔒 SSL Secure Transactions</p>
          </div>
        </div>
        <div className="Footer_Bottom">
          <p>&copy; {new Date().getFullYear()} Isonga Market. Designed for Rwanda 🇷🇼</p>
        </div>
      </footer>
    </div>
  );
}

export default Buyer_Dashboard;