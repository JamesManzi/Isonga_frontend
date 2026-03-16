import { useState, useEffect, useRef } from "react"; // Added useRef
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

function Asset_Products() {
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

  //  1. Ref to track if we've already sent view requests for this session
  const hasTracked = useRef(false);

  useEffect(() => {
    fetchProducts();
  }, [id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `https://isonga-backend.onrender.com/api/Asset_Products/${id}`,
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

      // 2. Only fire the view tracking requests ONCE per component mount.
      // The Backend will then decide if this specific buyer counts for "today".
      if (!hasTracked.current && fetchedProducts.length > 0) {
        fetchedProducts.forEach((product) => {
          axios.post(
            `https://isonga-backend.onrender.com/api/product/view/${product._id}`,
            {},
            { withCredentials: true }
          ).catch(err => console.log("Silent view fail for:", product._id));
        });
        hasTracked.current = true; // Mark as done so re-renders don't trigger again
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

  // Live search filtering
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

  if (loading) {
    return (
      <div className="View_Products">
        <p>Loading Assets...</p>
      </div>
    );
  }

  const addToCart = async (productId, productName) => {
  try {
    const res = await axios.post(
      "https://isonga-backend.onrender.com/api/cart/add",
      { productId, quantity: 1 },
      { withCredentials: true }
    );

    if (res.data.success) {
      // show popup
      setPopupMessage(`${productName} added to cart!`);
      setShowCartPopup(true);

      // hide popup after 2s
      setTimeout(() => setShowCartPopup(false), 2000);
    } else {
      setPopupMessage(res.data.message || "Failed to add to cart");
      setShowCartPopup(true);
      setTimeout(() => setShowCartPopup(false), 2000);
    }
  } catch (error) {
    console.log(error);
    setPopupMessage("Error adding to cart");
    setShowCartPopup(true);
    setTimeout(() => setShowCartPopup(false), 2000);
  }
};
const getFileUrl = (path) => {
  if (!path) return "/placeholder.png"; // Fallback if no image exists
  return path.startsWith("http") 
    ? path 
    : `https://isonga-backend.onrender.com/uploads/${path}`;
};
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

        <div className="View_Products_back">
          <Link to="/buyer_dashboard">
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="View_Products_body">
        <p>Find All Assets You Desire</p>
      </div>

      {/* Search */}
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

      {/* Products */}
      <div className="store_container">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const files = product.files || [];
            const currentIndex = currentFileIndex[product._id] || 0;
            const currentFile = files[currentIndex];

            return (
              <div key={product._id} className="productcard">
                {/* MEDIA SLIDER */}
                {currentFile && (
                  <div className="image-slider">
                    {isVideoFile(currentFile) ? (
                      <video
                        src={getFileUrl(currentFile)}
                        controls
                        muted
                        className="slider-media"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedia(currentFile);
                        }}
                      />
                    ) : (
                      <img
                        src={getFileUrl(currentFile)}
                        alt={product.name}
                        className="slider-media"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedia(currentFile);
                        }}
                      />
                    )}

                    {/* Slider Buttons */}
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

                    {/* Seller Avatar */}
                    {seller && (
                      <Link
                        to={`/view_profile/${seller._id}`}
                        className="profile-avatar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={
                               getFileUrl(seller.profile)
                              
                          }
                          alt="seller profile"
                        />
                      </Link>
                    )}
                  </div>
                )}

                {/* PRODUCT INFO */}
                <h1>{product.name}</h1>
                <p><strong>Price:</strong> {product.price} Rwf</p>
                <p><strong>Location:</strong> {product.location}</p>
                <p>{product.description}</p>

                {/* Buttons */}
                <div className="View_Products_btns">
                  <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat Seller</button></Link>
                </div>
              </div>
            );
          })
        ) : (
          <p>No products found</p>
        )}
      </div>

      {message && <p style={{ color: "red" }}>{message}</p>}

      {/* MEDIA MODAL */}
      {selectedMedia && (
        <div className="media-modal" onClick={() => setSelectedMedia(null)}>
          <span className="close-btn">&times;</span>
          {isVideoFile(selectedMedia) ? (
            <video
              src={getFileUrl(selectedMedia)}
              controls
              autoPlay
            />
          ) : (
            <img
              src={getFileUrl(selectedMedia)}
              alt="preview"
            />
          )}
        </div>
      )}
      {showCartPopup && (
  <div className="cart-popup">
    {popupMessage}
  </div>
)}
    </div>
  );
}

export default Asset_Products;