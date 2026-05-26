import { useState, useEffect, useRef } from "react";
import api from "./api";
import "./Asset_Products.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  faArrowRight,
  faChevronLeft,
  faChevronRight, 
  faSearch,
  faCartShopping
} from "@fortawesome/free-solid-svg-icons";

function Home_Assets() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentFileIndex, setCurrentFileIndex] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");


   // Show alert
  const showAlert = (msg) => {
    setAlertMessage(msg);
  };

  // Close alert
  const closeAlert = () => {
    setAlertMessage("");
  };
  // Zoom Modal State
  const [modalMedia, setModalMedia] = useState({ productId: null, index: 0 });

  const hasTracked = useRef(false);

  useEffect(() => {
    fetchProducts();
  }, [id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
     const res = await api.get(`/api/Home_Assets/${id}`);
      const fetchedProducts = res.data.products;
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
      setSeller(res.data.seller);

      if (!hasTracked.current && res.data.seller?._id) {
        api.post(`/api/seller/view/${res.data.seller._id}`,{}
        ).catch(err => console.log("Silent seller view fail"));
        hasTracked.current = true;
      }

      const indexes = {};
      fetchedProducts.forEach((p) => {
        indexes[p._id] = 0;
      });
      setCurrentFileIndex(indexes);
    } catch (error) {
      setMessage({ text: "Error Loading Products", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Auto-Slider Logic (Matches My_Store)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFileIndex((prev) => {
        const newIndexes = { ...prev };
        products.forEach((product) => {
          if (product.files && product.files.length > 1) {
            const currentIdx = prev[product._id] || 0;
            newIndexes[product._id] = (currentIdx + 1) % product.files.length;
          }
        });
        return newIndexes;
      });
    }, 5000); 
    return () => clearInterval(interval);
  }, [products]);

  // Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.location && p.location.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `https://api.isongamarket.com/uploads/${path}`;
  };

  if (loading) {
    return (
      <div className="Asset_Products-products-loading">
        <div className="Asset_Products-products-loader-card">
          <div className="Asset_Products-cube-loader">
            <div></div><div></div><div></div><div></div>
          </div>
          <h2>ISONGA MARKET</h2>
          <p>Loading Assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Asset_Products">
      {/* Navbar */}
      <div className="Asset_Products_navbar">
        <div className="Asset_Products_logo">
           <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
          <div className="Asset_Products_heads"><h1>Isonga</h1><h2>Market</h2></div>
        </div>
        <div className="Asset_Products_back" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowRight} />
        </div>
      </div>

      <div className="Asset_Products_body"><p>Find All Assets You Desire</p></div>

      {/* Search */}
      <div className="Asset_Products_search">
        <input
          type="search"
          placeholder="Search by name, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button><FontAwesomeIcon icon={faSearch} /> Search</button>
      </div>

      {/* Assets Grid */}
      <div className="Asset_Products_store_container">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const files = product.files || [];
            const activeIdx = currentFileIndex[product._id] || 0;
            const currentFile = files[activeIdx];

            return (
              <div key={product._id} className="Asset_Products_productcard">
                <div className="Asset_Products_image-slider">
                  <div onClick={() => setModalMedia({ productId: product._id, index: activeIdx })}>
                    {currentFile && (
                      isVideoFile(currentFile) ? (
                        <video src={getFileUrl(currentFile)} muted autoPlay loop className="Asset_Products-slider-media" />
                      ) : (
                        <img src={getFileUrl(currentFile)} alt={product.name} className="Asset_Products-slider-media" />
                      )
                    )}
                  </div>

                  {/* Dots (No Arrow Icons) */}
                  {files.length > 1 && (
                    <div className="Asset_Products-slider-dots">
                      {files.map((_, idx) => (
                        <span key={idx} className={`dot ${idx === activeIdx ? "active" : ""}`}></span>
                      ))}
                    </div>
                  )}

                  {seller && (
                    <Link to={`/Home_profile/${seller._id}`} className="Asset_Products-profile-avatar">
                      <img src={getFileUrl(seller.profile)} alt="seller" />
                    </Link>
                  )}
                </div>

                <h1>{product.name}</h1>
                <p><strong>Price:</strong> {product.price} Rwf</p>
                <p><strong>{product.description}</strong></p>

                <div className="Asset_Products_btns">
                  
  <button className="Asset_Products_chat_btn" onClick={()=>showAlert("Please Login First")}>
    Chat
    </button>
                </div>
              </div>
            );
          })
        ) : (
          <p>No Assets found</p>
        )}
      </div>

      {/* Media Zoom Modal - ARROWS ONLY HERE */}
      {modalMedia.productId && (() => {
        const product = products.find((p) => p._id === modalMedia.productId);
        const file = product.files[modalMedia.index];
        return (
          <div className="media-modal" onClick={() => setModalMedia({ productId: null, index: 0 })}>
            <span className="close-btn">&times;</span>
            {isVideoFile(file) ? (
              <video src={getFileUrl(file)} controls autoPlay className="full-media" onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={getFileUrl(file)} alt="Full view" className="full-media" onClick={(e) => e.stopPropagation()} />
            )}
            <div className="modal-controls">
              <FontAwesomeIcon icon={faChevronLeft} className="modal-arrow" onClick={(e) => {
                e.stopPropagation();
                setModalMedia(p => ({ ...p, index: (p.index - 1 + product.files.length) % product.files.length }));
              }} />
              <FontAwesomeIcon icon={faChevronRight} className="modal-arrow" onClick={(e) => {
                e.stopPropagation();
                setModalMedia(p => ({ ...p, index: (p.index + 1) % product.files.length }));
              }} />
            </div>
          </div>
        );
      })()}

      {/* Original Alerts */}
      {message && (
        <div className={`alert ${message.type}`}>
          <span className="alert-icon">{message.type === "success" ? "✓" : "⚠"}</span>
          <span>{message.text}</span>
        </div>
      )}

    <div className={`cart-popup ${showCartPopup ? "show" : ""}`}>
  {popupMessage}
</div>

{/* Alert Modal */}
{alertMessage && (
  <div className="alert-overlay">
    <div className="alert-box">
      <p>{alertMessage}</p>
      <button onClick={closeAlert}>OK</button>
    </div>
  </div>
)}
      {/* Original Footer */}
      <footer className="Asset_Products-Buyer_Footer">
        <div className="Asset_Products-Footer_Container">
          <div className="Asset_Products-Footer_Section">
            <div className="Asset_Products-Footer_Logo">
               <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
              <h3>Isonga Market</h3>
            </div>
            <p>The leading digital marketplace in Rwanda.</p>
          </div>
          <div className="Footer_Section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="#">All Products</Link></li>
              <li><Link to="#">Services</Link></li>
              <li><Link to="#">Assets</Link></li>
              <li><Link to="#">My Cart</Link></li>
            </ul>
          </div>
          <div className="Footer_Section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/help-center">Help Center</Link></li>
                            <li><Link to="/Steping">How It Works</Link></li>
                            <li><Link to="/PrivacyRules">Privacy Policy</Link></li>
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
          <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved. Designed for Rwanda 🇷🇼</p>
        </div>
      </footer>
    </div>
  );
}

export default Home_Assets;