import { useState, useEffect, useRef } from "react";
import api from "./api";
import "./View_Products.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faCartShopping
} from "@fortawesome/free-solid-svg-icons";

function View_Products() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState({}); 
  const [searchQuery, setSearchQuery] = useState("");
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [cartLoading, setCartLoading] = useState(null);
  
  const [modalMedia, setModalMedia] = useState({ productId: null, index: 0 });

  const hasTracked = useRef(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
        navigate("/buyer_login");
        return;
      }
        
        const res = await api.get(`/api/view_products/${id}`);

        const fetchedProducts = res.data.products;
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setSeller(res.data.seller);

        const indexes = {};
        fetchedProducts.forEach((p) => {
          indexes[p._id] = 0;
        });
        setCurrentIndex(indexes);

       if (!hasTracked.current) {
        api.post(`/api/seller/view/${id}`).catch(() => {});
        hasTracked.current = true;
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage("Error loading products");
      if (error.response?.status === 401) navigate("/buyer_login");
    } finally {
      setLoading(false);
    }
  };
  fetchProducts();
}, [id, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") 
      ? path 
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  const addToCart = async (productId, productName) => {
    try {
      setCartLoading(productId);
      const res = await api.post("/api/cart/add", { productId, quantity: 1 });
      setPopupMessage(res.data.success ? `${productName} added to cart!` : "Error");
      setShowCartPopup(true);
      setTimeout(() => setShowCartPopup(false), 2000);
    } catch (error) {
      setPopupMessage("Error adding to cart");
      setShowCartPopup(true);
      setTimeout(() => setShowCartPopup(false), 2000);
    } finally {
      setCartLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="products-loading">
        <div className="products-loader-card">
          <h2>ISONGA MARKET</h2>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="View_Products">
      {/* Navbar */}
      <div className="View_Products_navbar">
        <div className="View_Products_logo">
          <img src="/logo.png" alt="logo" />
          <div className="View_Products_heads"><h1>Isonga</h1><h2>Market</h2></div>
        </div>
        <div className="View_Products_back" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowRight} />
        </div>
      </div>
      {/* Header */}
      <div className="View_Products_body">
        <p>Find All Products You Desire</p>
      </div>
      <div className="View_Products_search">
        <input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button><FontAwesomeIcon icon={faSearch} /> Search</button>
      </div>

      <div className="store_container">
        {filteredProducts.map((product) => {
          const files = product.files || [];
          const activeIdx = currentIndex[product._id] || 0;
          const currentFile = files[activeIdx];

          return (
            <div key={product._id} className="productcard">
              <div className="image-slider">
                {currentFile ? (
                  isVideoFile(currentFile) ? (
                    <video
                      src={getFileUrl(currentFile)}
                      muted autoPlay loop
                      className="slider-media"
                      onClick={() => setModalMedia({ productId: product._id, index: activeIdx })}
                    />
                  ) : (
                    <img
                      src={getFileUrl(currentFile)}
                      alt={product.name}
                      className="slider-media"
                      onClick={() => setModalMedia({ productId: product._id, index: activeIdx })}
                    />
                  )
                ) : <img src="/placeholder.png" className="slider-media" />}

                {/* Slider Dots (No icons here) */}
                {files.length > 1 && (
                  <div className="slider-dots">
                    {files.map((_, idx) => (
                      <span key={idx} className={`dot ${idx === activeIdx ? "active" : ""}`}></span>
                    ))}
                  </div>
                )}

                {seller && (
                  <Link to={`/view_profile/${seller._id}`} className="profile-avatar">
                    <img src={getFileUrl(seller.profile)} alt="profile" />
                  </Link>
                )}
              </div>

              {/* PRODUCT INFO */}
              <div className="product-info">
                 <h1>{product.name}</h1>
                <p><strong>Price:</strong> {product.price} Rwf</p>
                <p><strong>Location:</strong> {product.location}</p>
                <p><strong>Quantity:</strong> {product.quantity}</p>
                <p>{product.description}</p>
</div>
<div className="View_Products_btns">
  <Link
    to={`/buyer_chat/${seller?._id}?productId=${product._id}&productName=${encodeURIComponent(product.name)}&productImage=${encodeURIComponent(product.files[0] || "")}&productPrice=${product.price}`}
  >
    <button className="chat-btn">Chat</button>
  </Link>
  <button onClick={() => addToCart(product._id, product.name)} disabled={cartLoading === product._id}>
    {cartLoading === product._id ? "Adding..." : "Add To Cart"} <FontAwesomeIcon icon={faCartShopping} />
  </button>
</div>

{/* ADD THESE TWO LINES BELOW TO CLOSE THE MAP PROPERLY */}
            </div> 
          );
        })} 
      </div>
{/* ... rest of the component */}

      {/* Media Zoom Modal - ICONS ONLY APPEAR HERE */}
      {modalMedia.productId && (() => {
        const product = products.find((p) => p._id === modalMedia.productId);
        if (!product) return null; 
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

    <div className={`cart-popup ${showCartPopup ? "show" : ""}`}>
  {popupMessage}
  </div>
  </div>
  );
}

export default View_Products;