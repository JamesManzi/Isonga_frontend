import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faCartShopping,
  faBell
} from "@fortawesome/free-solid-svg-icons";

import ChatNotification from "./ChatNotification";
import "./Buyer_Dashboard.css";
import { createPortal } from "react-dom";

function Buyer_Dashboard() {
  const navigate = useNavigate();

  // --- State Management ---
  const [buyerName, setBuyerName] = useState("");
  const [profile, setProfile] = useState("");
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0); // Bell (Orders)
  const [unreadChatCount, setUnreadChatCount] = useState(0);   // Envelope (Messages)
  const [orderNotifications, setOrderNotifications] = useState([]);
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });

  const socketRef = useRef(null);

  const productCategories = ["Fashion", "Electronics", "Furniture", "Construction", "Food"];
  const serviceCategories = ["services", "Hospitality"];
  const assetCategories = ["RealEstate", "Vehicles", "Livestock"];

  // --- Helpers ---
  const getSellerRoute = (category, id) => {
    if (productCategories.includes(category)) return `/view_products/${id}`;
    if (serviceCategories.includes(category)) return `/Service_Products/${id}`;
    if (assetCategories.includes(category)) return `/Asset_products/${id}`;
    return `/view_products/${id}`;
  };

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);
  
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("http")) return path;
    return `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  const renderStars = (avg = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" />);
      else if (avg >= i - 0.5) stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold" style={{ clipPath: "inset(0 50% 0 0)" }} />);
      else stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray" />);
    }
    return stars;
  };

  // --- Individual Fetchers ---
  const fetchOrderNotifications = async (id) => {
    const activeId = id || buyerId;
    if (!activeId) return;
    try {
      const res = await api.get(`/api/notifications?t=${Date.now()}`);
      if (res.data.success) {
        setOrderNotifications(res.data.notifications);
        const unreadCount = res.data.notifications.filter(n => !n.read).length;
        setUnreadNotifCount(unreadCount);
      }
    } catch (err) {
      console.error("Notif Error:", err);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await api.get("/api/cart/count");
      if (res.data.success) setCartCount(res.data.count);
    } catch (err) {
      console.error("Cart count error:", err);
    }
  };

  // --- THE CORE FIX: Main Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/buyer_login");
          return;
        }

        // 1. Get Dashboard (Sellers & Buyer Info)
        const res = await api.get("/api/buyer_dashboard");
        if (res.data.success) {
          const { buyer, sellers: fetchedSellers } = res.data;
          setBuyerName(buyer.name);
          setProfile(buyer.profile);
          setBuyerId(buyer._id);

          const sellersWithRatings = fetchedSellers.map(s => ({
            ...s,
            averageRating: s.averageRating || 0,
            numReviews: s.numReviews || 0
          }));
          setSellers(sellersWithRatings);
          setFilteredSellers(sellersWithRatings);

          const indexes = {};
          sellersWithRatings.forEach(s => { indexes[s._id] = 0; });
          setCurrentImageIndex(indexes);

          // 2. IMMEDIATE CHAT FETCH (The "No Refresh" Engine)
          const chatRes = await api.get("/api/buyer/conversations");
          if (chatRes.data.success && chatRes.data.conversations) {
            const count = chatRes.data.conversations.reduce(
              (sum, conv) => sum + (conv.unreadCount || 0), 0
            );
            setUnreadChatCount(count);
          }

          // 3. Chain remaining updates
          fetchOrderNotifications(buyer._id);
          fetchCartCount();
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- Real-time Logic (Socket) ---
  useEffect(() => {
    if (!buyerId) return;
    const token = localStorage.getItem("token");

    if (!socketRef.current) {
      socketRef.current = io("https://isonga-backend.onrender.com", {
        transports: ["polling", "websocket"],
        auth: { token },
      });
    }

    const socket = socketRef.current;
    socket.on("connect", () => {
      socket.emit("userOnline", { userId: buyerId, userModel: "Buyer" });
    });

    socket.off("newMessageNotification");
    socket.on("newMessageNotification", (data) => {
      setUnreadChatCount((prev) => prev + 1);
      if (document.hidden && Notification.permission === "granted") {
        new Notification("New Message", { body: data.message });
      }
    });

    return () => {
      socket.off("connect");
      socket.off("newMessageNotification");
    };
  }, [buyerId]);

  // --- Interaction Handlers ---
  const handleBellClick = async () => {
    setUnreadNotifCount(0);
    try {
      await api.put("/api/notifications/mark-read");
    } catch (err) {
      console.error("Notif update failed:", err);
    } finally {
      navigate("/notifications");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await api.post("/api/logout");
      if (res.data.success) {
        localStorage.removeItem("token");
        if (socketRef.current) socketRef.current.disconnect();
        navigate("/buyer_login");
      }
    } catch (err) {
      localStorage.removeItem("token");
      navigate("/buyer_login");
    }
  };

  // --- UX Effects (Search, Slider, Navbar) ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredSellers(
      sellers.filter(s =>
        (s.name?.toLowerCase().includes(q)) ||
        (s.category?.toLowerCase().includes(q)) ||
        (s.location?.toLowerCase().includes(q)) ||
        (s.description?.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, sellers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const newIndexes = { ...prev };
        filteredSellers.forEach((seller) => {
          if (seller.files && seller.files.length > 1) {
            newIndexes[seller._id] = ((prev[seller._id] || 0) + 1) % seller.files.length;
          }
        });
        return newIndexes;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [filteredSellers]);

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
      {/* Navigation */}
      <div className="Buyer_Dashboard_navbar">
        <div className="Buyer_Dashboard_logos"><img src="/logo.png" alt="Logo" /></div>
        <div className="Buyer_Dashboard_heads"><h1>Isonga</h1><h2>Market</h2></div>
        
        <div className="Buyer_Dashboard_user">
          <Link to="/buyer_profile"><img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="profile" /></Link>
          <ChatNotification unreadCount={unreadChatCount} />
        </div>

        <div className="Buyer_Dashboard_nav">
          <nav><ul><li><Link to="/fashion">Products</Link></li><li><Link to="/services">Services</Link></li><li><Link to="/RealEstate">Assets</Link></li></ul></nav>
        </div>

        <div className="notification-container nav-icon-link" style={{ position: "relative", cursor: "pointer" }} onClick={handleBellClick}>
          <FontAwesomeIcon icon={faBell} size="2x" />
          {unreadNotifCount > 0 && <span className="notification-badge">{unreadNotifCount}</span>}
        </div>

        <Link to="/cart" style={{ position: "relative" }}>
          <FontAwesomeIcon icon={faCartShopping} size="2x" />
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "12px", fontWeight: "bold" }}>{cartCount}</span>
          )}
        </Link>
        <div className="Buyer_Dashboard_Logout"><button onClick={handleLogout}>Logout</button></div>
      </div>

      {/* Hero */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Welcome back, {buyerName}! 🛍️</h1>
        <p>Browse shops and enjoy secure shopping.</p>
      </div>

      {/* Search */}
      <div className="Buyer_Dashboard_search">
        <input type="text" placeholder="Search sellers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button><FontAwesomeIcon icon={faSearch} /></button>
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
                        <video src={getFileUrl(seller.files[activeIdx])} muted autoPlay loop className="slider-image" onClick={() => setModalMedia({ sellerId: seller._id, index: activeIdx })} />
                      ) : (
                        <img src={getFileUrl(seller.files[activeIdx])} alt={seller.name} className="slider-image" onClick={() => setModalMedia({ sellerId: seller._id, index: activeIdx })} />
                      )}
                    </div>
                  ) : (
                    <img src="/placeholder.png" alt="no image" className="slider-image" />
                  )}
                </div>
                <div className="shop-card-info">
                  <h3>{seller.name} Shop</h3>
                  <div className="rating">{renderStars(seller.averageRating)}<span>({seller.numReviews})</span></div>
                  <div className="card-actions">
                    <Link to={getSellerRoute(seller.category, seller._id)}><button className="visit-btn">Visit</button></Link>
                    <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat</button></Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-sellers-msg">No sellers found</p>
        )}
      </div>

      {/* Modal Portal */}
      {modalMedia.sellerId && createPortal(
        (() => {
          const seller = sellers.find(s => s._id === modalMedia.sellerId);
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
            </div>
          );
        })(), document.body
      )}

      {/* Footer */}
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
            </div>
            <p className="Secure_Note">🔒 SSL Secure Transactions</p>
          </div>
        </div>
        <div className="Footer_Bottom"><p>&copy; {new Date().getFullYear()} Isonga Market. Rwanda 🇷🇼</p></div>
      </footer>
    </div>
  );
}

export default Buyer_Dashboard;