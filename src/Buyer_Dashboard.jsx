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

  // ------------------- STATES -------------------
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

  // ------------------- CATEGORIES -------------------
  const productCategories = ["Fashion", "Electronics", "Furniture", "Construction"];
  const serviceCategories = ["services", "Hospitality"];
  const assetCategories = ["RealEstate", "Vehicles", "Agriculture"];

  const getSellerRoute = (category, id) => {
    if (productCategories.includes(category)) return `/view_products/${id}`;
    if (serviceCategories.includes(category)) return `/Service_Products/${id}`;
    if (assetCategories.includes(category)) return `/Asset_products/${id}`;
    return `/view_products/${id}`;
  };

  // ------------------- FETCH CART COUNT -------------------
  const fetchCartCount = async () => {
    try {
      const res = await axios.get(
        "https://isonga-backend.onrender.com/api/cart/count",
        { withCredentials: true }
      );
      if (res.data.success) setCartCount(res.data.count);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  // ------------------- LOGOUT -------------------
  const handleLogout = async () => {
    try {
      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/logout",
        {},
        { withCredentials: true }
      );
      if (res.data.success) navigate("/buyer_login");
    } catch (err) {
      console.log(err);
    }
  };

  // ------------------- STAR RENDER -------------------
  const renderStars = (avg = 0) => {
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

  // ------------------- FETCH DASHBOARD DATA -------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "https://isonga-backend.onrender.com/api/buyer_dashboard",
          { withCredentials: true }
        );

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
    fetchData();
  }, [navigate]);

  // ------------------- SEARCH FILTER -------------------
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

  // ------------------- IMAGE SLIDER -------------------
  const handleNext = (sellerId, total) =>
    setCurrentImageIndex(prev => ({ ...prev, [sellerId]: (prev[sellerId] + 1) % total }));
  const handlePrev = (sellerId, total) =>
    setCurrentImageIndex(prev => ({ ...prev, [sellerId]: (prev[sellerId] - 1 + total) % total }));

  // ------------------- MEDIA HELPERS -------------------
  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("http")) return path;
    return `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // ------------------- RENDER -------------------
  return (
    <div className="Buyer_Dashboard">

      {/* NAVBAR */}
      <header className="navbar flex justify-between items-center p-4 bg-white shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold">Isonga</h1>
            <h2 className="text-sm text-gray-500">Market</h2>
          </div>
        </div>

        <nav className="flex gap-4">
          <Link to="/fashion" className="hover:text-blue-600">Products</Link>
          <Link to="/services" className="hover:text-blue-600">Services</Link>
          <Link to="/RealEstate" className="hover:text-blue-600">Assets</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/buyer_profile">
            <img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="profile" className="h-10 w-10 rounded-full" />
          </Link>
          <ChatNotification />

          <Link to="/cart" className="relative">
            <FontAwesomeIcon icon={faCartShopping} size="2x" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2">{cartCount}</span>
            )}
          </Link>

          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600">Logout</button>
        </div>
      </header>

      {/* HEADING */}
      <section className="text-center my-6">
        <h1 className="text-2xl font-bold">Welcome back, {buyerName}! 🛍️</h1>
        <p className="text-gray-600">Browse shops and enjoy secure shopping.</p>
      </section>

      {/* SEARCH */}
      <section className="flex justify-center mb-6 gap-2">
        <input
          type="text"
          placeholder="Search sellers by name, category, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 w-1/2 focus:outline-blue-500"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </section>

      {/* SELLERS */}
      <section className="shop-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
        {filteredSellers.length > 0 ? filteredSellers.map(seller => (
          <div key={seller._id} className="shop-card border rounded shadow hover:shadow-lg transition p-3 bg-white">
            {/* IMAGE SECTION */}
            <div className="relative">
              {seller.files && seller.files.length > 0 ? (
                <div className="image-slider relative">
                  {isVideoFile(seller.files[currentImageIndex[seller._id] || 0]) ? (
                    <video
                      src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
                      controls
                      className="w-full h-48 object-cover rounded cursor-pointer"
                      onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
                    />
                  ) : (
                    <img
                      src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
                      alt={seller.name}
                      className="w-full h-48 object-cover rounded cursor-pointer"
                      onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
                    />
                  )}

                  <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2">
                    <FontAwesomeIcon icon={faChevronLeft} className="cursor-pointer text-white" onClick={() => handlePrev(seller._id, seller.files.length)} />
                    <FontAwesomeIcon icon={faChevronRight} className="cursor-pointer text-white" onClick={() => handleNext(seller._id, seller.files.length)} />
                  </div>
                </div>
              ) : (
                <img src="/placeholder.png" alt="no image" className="w-full h-48 object-cover rounded" />
              )}

              <Link to={`/view_profile/${seller._id}`} className="absolute -bottom-4 left-4">
                <img src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"} alt={seller.name} className="h-10 w-10 rounded-full border-2 border-white" />
              </Link>
            </div>

            {/* INFO */}
            <div className="mt-6">
              <h3 className="font-bold text-lg">{seller.name} Shop</h3>
              <p className="text-gray-500">{seller.location}</p>
              <p className="text-gray-500">{seller.category} Shop</p>

              <div className="flex items-center gap-1 my-1">
                {renderStars(seller.averageRating)}
                <span className="text-gray-500 text-sm">({seller.numReviews})</span>
              </div>

              <p className="text-gray-700">{seller.description}</p>

              <div className="flex gap-2 mt-2">
                <Link to={getSellerRoute(seller.category, seller._id)}>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-full">Visit Shop</button>
                </Link>
                <Link to={`/buyer_chat/${seller._id}`}>
                  <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full">Chat</button>
                </Link>
              </div>
            </div>
          </div>
        )) : <p className="text-center col-span-full">No sellers found</p>}
      </section>

      {/* MEDIA MODAL */}
      {selectedMedia && (
        <div className="media-modal fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedMedia(null)}>
          <span className="absolute top-4 right-6 text-white text-2xl cursor-pointer">&times;</span>
          {isVideoFile(selectedMedia) ? (
            <video src={getFileUrl(selectedMedia)} controls autoPlay className="max-h-[80vh] max-w-[80vw]" />
          ) : (
            <img src={getFileUrl(selectedMedia)} alt="preview" className="max-h-[80vh] max-w-[80vw]" />
          )}
        </div>
      )}

      {/* ALERT MESSAGE */}
      {message && (
        <div className={`alert fixed top-20 left-1/2 transform -translate-x-1/2 p-4 rounded shadow ${message.type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
          <span className="mr-2">{message.type === "success" ? "✓" : "⚠"}</span>
          {message.text}
        </div>
      )}

      {/* FOOTER */}
      <footer className="Buyer_Footer bg-gray-100 mt-8 pt-8">
        <div className="Footer_Container max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div>
            <img src="/logo.png" alt="Isonga Logo" className="h-12 mb-2" />
            <h3 className="font-bold">Isonga Market</h3>
            <p className="text-gray-600">The leading digital marketplace in Rwanda. Connecting local sellers with happy buyers.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <ul className="text-gray-600">
              <li><Link to="/fashion" className="hover:text-blue-600">All Products</Link></li>
              <li><Link to="/services" className="hover:text-blue-600">Services</Link></li>
              <li><Link to="/RealEstate" className="hover:text-blue-600">Assets</Link></li>
              <li><Link to="/cart" className="hover:text-blue-600">My Cart</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-2">Support</h4>
            <ul className="text-gray-600">
              <li><Link to="/help" className="hover:text-blue-600">Help Center</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Payments */}
          <div>
            <h4 className="font-semibold mb-2">Secure Payments</h4>
            <p className="text-gray-600">We support local payment methods:</p>
            <div className="flex gap-2 mt-2">
              <span className="bg-yellow-300 px-2 py-1 rounded font-semibold">MTN MoMo</span>
              <span className="bg-blue-300 px-2 py-1 rounded font-semibold">Airtel Money</span>
            </div>
            <p className="mt-2 text-gray-500">🔒 SSL Secure Transactions</p>
          </div>
        </div>

        <div className="Footer_Bottom text-center mt-6 py-4 text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved.</p>
          <p>Designed for Rwanda 🇷🇼</p>
        </div>
      </footer>

    </div>
  );
}

export default Buyer_Dashboard;