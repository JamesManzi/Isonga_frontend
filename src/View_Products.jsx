import { useState, useEffect, useRef } from "react";
import axios from "axios";
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
  const [currentFileIndex, setCurrentFileIndex] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [cartLoading, setCartLoading] = useState(null);
  const [modalMedia, setModalMedia] = useState({ productId: null, index: 0 });

  const hasTracked = useRef(false);

  useEffect(() => {
    fetchProducts();
  }, [id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://isonga-backend.onrender.com/api/view_products/${id}`,
        { withCredentials: true }
      );

      if (!res.data.success) {
        navigate("/buyer_login");
        return;
      }

      const fetchedProducts = res.data.products;
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
      setSeller(res.data.seller);

      if (!hasTracked.current) {
        axios.post(
          `https://isonga-backend.onrender.com/api/seller/view/${id}`, 
          {}, 
          { withCredentials: true }
        ).catch(err => console.log("Visit not tracked"));

        hasTracked.current = true; 
      }
      
      const indexes = {};
      fetchedProducts.forEach((p) => {
        indexes[p._id] = 0;
      });
      setCurrentFileIndex(indexes);
    } catch (error) {
      console.log(error);
      setMessage("Error loading products");
    } finally {
      setLoading(false);
    }
  };

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

  const handleNext = (productId, totalFiles) => {
    setCurrentFileIndex((prev) => ({
      ...prev,
      [productId]: (prev[productId] + 1) % totalFiles,
    }));
  };

  const handlePrev = (productId, totalFiles) => {
    setCurrentFileIndex((prev) => ({
      ...prev,
      [productId]: (prev[productId] - 1 + totalFiles) % totalFiles,
    }));
  };

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  const addToCart = async (productId, productName) => {
    try {
      setCartLoading(productId);
      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/cart/add",
        { productId, quantity: 1 },
        { withCredentials: true }
      );

      if (res.data.success) {
        setPopupMessage(`${productName} added to cart!`);
      } else {
        setPopupMessage(res.data.message || "Failed to add to cart");
      }

      setShowCartPopup(true);
      setTimeout(() => setShowCartPopup(false), 2000);

    } catch (error) {
      console.log(error);
      setPopupMessage("Error adding to cart");
      setShowCartPopup(true);
      setTimeout(() => setShowCartPopup(false), 2000);
    } finally {
      setCartLoading(null);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png"; 
    return path.startsWith("http") 
      ? path 
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  if (loading) {
    return (
      <div className="products-loading">
        <div className="products-loader-card">
          <div className="cube-loader">
            <div></div><div></div><div></div><div></div>
          </div>
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
          <div className="View_Products_heads">
            <h1>Isonga</h1>
            <h2>Market</h2>
          </div>
        </div>
        <div className="View_Products_back" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowRight} />
        </div>
      </div>

      <div className="View_Products_body">
        <p>Find All Products You Desire</p>
      </div>

      <div className="View_Products_search">
        <input
          type="search"
          placeholder="Search by name, location, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button>
          <FontAwesomeIcon icon={faSearch} /> Search
        </button>
      </div>

      <div className="store_container">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const files = product.files || [];
            const currentIndex = currentFileIndex[product._id] || 0;
            const currentFile = files[currentIndex];

            return (
              <div key={product._id} className="productcard">
                {currentFile && (
                  <div className="image-slider">
                    {isVideoFile(currentFile) ? (
                      <video
                        src={getFileUrl(currentFile)}
                        muted
                        className="slider-media"
                        onClick={() => setModalMedia({ productId: product._id, index: currentIndex })}
                      />
                    ) : (
                      <img
                        src={getFileUrl(currentFile)}
                        alt={product.name}
                        className="slider-media"
                        onClick={() => setModalMedia({ productId: product._id, index: currentIndex })}
                      />
                    )}

                    {files.length > 1 && (
                      <div className="slider-controls">
                        <FontAwesomeIcon
                          icon={faChevronLeft}
                          className="slider-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrev(product._id, files.length);
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="slider-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNext(product._id, files.length);
                          }}
                        />
                      </div>
                    )}

                    {seller && (
                      <Link
                        to={`/view_profile/${seller._id}`}
                        className="profile-avatar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src={getFileUrl(seller.profile)} alt="seller profile" />
                      </Link>
                    )}
                  </div>
                )}

                <h1>{product.name}</h1>
                <p><strong>Price:</strong> {product.price} Rwf</p>
                <p><strong>Location:</strong> {product.location}</p>
                <p><strong>Quantity:</strong> {product.quantity}</p>
                <p>{product.description}</p>

                <div className="View_Products_btns">
                  <Link to={`/buyer_chat/${seller?._id}`}><button className="chat-btn">Chat</button></Link>
                  <button
                    onClick={() => addToCart(product._id, product.name)}
                    disabled={cartLoading === product._id}
                  >
                    {cartLoading === product._id ? "Adding..." : "Add To Cart"} 
                    <FontAwesomeIcon icon={faCartShopping} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p>No products found</p>
        )}
      </div>

      {showCartPopup && <div className="cart-popup">{popupMessage}</div>}

      {/* FOOTER SECTION */}
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
              <li><Link to="/fashion">All Products</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
            </ul>
          </div>

          <div className="Footer_Section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/terms">Terms</Link></li>
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
          <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved. 🇷🇼</p>
        </div>
      </footer>

      {/* Media Zoom Modal */}
      {modalMedia.productId && (() => {
        const product = products.find((p) => p._id === modalMedia.productId);
        if (!product) return null; 
        const file = product.files[modalMedia.index];
        return (
          <div className="media-modal" onClick={() => setModalMedia({ productId: null, index: 0 })}>
            <span className="close-btn" onClick={() => setModalMedia({ productId: null, index: 0 })}>&times;</span>
            {isVideoFile(file) ? (
              <video src={getFileUrl(file)} controls autoPlay className="full-media" onClick={(e) => e.stopPropagation()}/>
            ) : (
              <img src={getFileUrl(file)} alt="Full view" className="full-media" onClick={(e) => e.stopPropagation()}/>
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
      
      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  );
}

export default View_Products;