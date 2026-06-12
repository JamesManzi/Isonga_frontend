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

function DeleteAssets() {
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
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Zoom Modal State
  const [modalMedia, setModalMedia] = useState({ productId: null, index: 0 });

  // --- UPDATE MODAL STATES ---
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState({
    _id: "",
    name: "",
    price: "",
    location: "",
    description: ""
  });

  const hasTracked = useRef(false);

  useEffect(() => {
    fetchProducts();
  }, [id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/buyer_login");
        return;
      }
      const res = await api.get(`/api/Asset_Products/${id}`);
      const fetchedProducts = res.data.products || [];
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
      setSeller(res.data.seller);

      if (!hasTracked.current && res.data.seller?._id) {
        api.post(`/api/seller/view/${res.data.seller._id}`, {}).catch(err => console.log("Silent seller view fail"));
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

  // --- DELETE HANDLER ---
  const handleDelete = async (productId, productName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${productName}?`);
    if (!confirmDelete) return;

    try {
      setDeleteLoading(productId);
      await api.delete(`/api/products/delete/${productId}`); 

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      
      setPopupMessage(`${productName} deleted successfully!`);
      setShowCartPopup(true);
      setTimeout(() => setShowCartPopup(false), 2000);
    } catch (error) {
      console.error("Delete Error:", error);
      alert(error.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleteLoading(null);
    }
  };

  // --- ACTIONS: PREPARE UPDATE CONFIGURATION ---
  const openUpdateModal = (product) => {
    setEditingProduct({
      _id: product._id,
      name: product.name || "",
      price: product.price || "",
      location: product.location || "",
      description: product.description || ""
    });
    setIsUpdateModalOpen(true);
  };

  // --- SUBMIT UPDATE ---
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      
      const res = await api.put(`/api/products/update/${editingProduct._id}`, {
        name: editingProduct.name,
        price: editingProduct.price,
        quantity: editingProduct.quantity,
        description: editingProduct.description
      });

      const updatedProduct = res.data.product || editingProduct;

      // Instantly update UI fields 
      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? { ...p, ...updatedProduct } : p))
      );

      setIsUpdateModalOpen(false);
      setPopupMessage("Product updated successfully! ✨");
      setShowCartPopup(true);
      setTimeout(() => setShowCartPopup(false), 2000);
    } catch (error) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || "Failed to save updates.");
    } finally {
      setUpdateLoading(false);
    }
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
            src="/isonga_logo.png"
            alt="logo"
            style={{
              width:"190px",
              height:"auto"
            }}
          />
          <div className="Asset_Products_heads">
          
          </div>
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
                    {currentFile ? (
                      isVideoFile(currentFile) ? (
                        <video src={getFileUrl(currentFile)} muted autoPlay loop className="Asset_Products-slider-media" />
                      ) : (
                        <img src={getFileUrl(currentFile)} alt={product.name} className="Asset_Products-slider-media" />
                      )
                    ) : <img src="/placeholder.png" className="Asset_Products-slider-media" alt="placeholder" />}
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
                    <Link to={`/view_profile/${seller._id}`} className="Asset_Products-profile-avatar">
                      <img src={getFileUrl(seller.profile)} alt="seller" />
                    </Link>
                  )}
                </div>

                <h1>{product.name}</h1>
                <p><strong>Price:</strong> {product.price} Rwf</p>
                {product.location && <p><strong>Location:</strong> {product.location}</p>}
                <p>{product.description}</p>

                {/* MODIFIED ACTION BLOCKS */}
                <div className="Asset_Products_btns" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    className="Asset_Products_chat_btn"
                    style={{ backgroundColor: "#dc3545", color: "white", flex: 1 }}
                    onClick={() => handleDelete(product._id, product.name)}
                    disabled={deleteLoading === product._id}
                  >
                    {deleteLoading === product._id ? "Deleting..." : "Delete"}
                  </button>
                  <button 
                    style={{ backgroundColor: "#007bff", color: "white", flex: 1, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                    onClick={() => openUpdateModal(product)}
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p>No Assets found</p>
        )}
      </div>

      {/* --- POPUP UPDATE MODAL --- */}
      {isUpdateModalOpen && (
        <div className="media-modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="modal-content" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '450px', color: '#333' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '15px', color: '#111', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Update Asset</h3>
            
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Asset Name</label>
                <input 
                  type="text" 
                  required 
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Price (Rwf)</label>
                <input 
                  type="number" 
                  required 
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Location</label>
                <input 
                  type="text" 
                  required 
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editingProduct.location}
                  onChange={(e) => setEditingProduct({...editingProduct, location: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Description</label>
                <textarea 
                  rows="3"
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'none' }}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  style={{ padding: '8px 16px', background: '#aaa', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => setIsUpdateModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateLoading}
                  style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {updateLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Zoom Modal - ARROWS ONLY HERE */}
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

      {/* Original Alerts */}
      {message && (
        <div className={`alert ${message.type}`}>
          <span className="alert-icon">{message.type === "success" ? "✓" : "⚠"}</span>
          <span>{message.text}</span>
        </div>
      )}

      <div className={`Asset_Products-cart-popup ${showCartPopup ? "show" : ""}`}>
        {popupMessage}
      </div>

      {/* Original Footer */}
      <footer className="Asset_Products-Buyer_Footer">
        <div className="Asset_Products-Footer_Container">
          <div className="Asset_Products-Footer_Section">
            <div className="Asset_Products-Footer_Logo">
              <img src="/logo.png" alt="Isonga Logo"/>
              <h3>Isonga Market</h3>
            </div>
            <p>The leading digital marketplace in Rwanda.</p>
          </div>
          <div className="Footer_Section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/fashion">All Products</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/RealEstate">Assets</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
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

export default DeleteAssets;