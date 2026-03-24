import { useState, useEffect } from "react";
import axios from "axios";
import "./My_Store.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import {
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faStore,
  faMapPin,
  faInfoCircle,
  faCheckCircle,
  faImages,
  faTrash,
  faEdit
} from "@fortawesome/free-solid-svg-icons";

function My_Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [currentIndex, setCurrentIndex] = useState({}); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [modalMedia, setModalMedia] = useState({ productId: null, index: 0 });
  const [productToDelete, setProductToDelete] = useState(null); 

  // 1. Fetch Store Data
  useEffect(() => {
    const fetchProducts = async () => {
      setPageLoading(true);
      try {
        const res = await axios.get("https://isonga-backend.onrender.com/api/my_store", {
          withCredentials: true,
        });
        if (res.data.success) {
          setProducts(res.data.products);
          setFilteredProducts(res.data.products);
          setSellerName(res.data.seller.name);

          const initIndex = {};
          res.data.products.forEach((p) => {
            initIndex[p._id] = 0;
          });
          setCurrentIndex(initIndex);
        } else {
          setMessage(res.data.message);
        }
      } catch (error) {
        console.error("Store Fetch Error:", error);
        setMessage("Could not load your store.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Search Filter Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // 3. Auto-Slider Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const newIndexes = { ...prev };
        filteredProducts.forEach((product) => {
          if (product.files && product.files.length > 1) {
            const currentIdx = prev[product._id] || 0;
            newIndexes[product._id] = (currentIdx + 1) % product.files.length;
          }
        });
        return newIndexes;
      });
    }, 5000); 
    return () => clearInterval(interval);
  }, [filteredProducts]);

  // --- Helpers ---
  const isVideoFile = (filename) => {
    if (!filename) return false;
    return /\.(mp4|webm|ogg|mov)$/i.test(filename);
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") 
      ? path 
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // --- Actions ---
  const confirmDelete = (productId) => {
    setProductToDelete(productId);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    setLoading(true);
    try {
      const res = await axios.delete(
        `https://isonga-backend.onrender.com/api/products/delete/${productToDelete}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productToDelete));
        setProductToDelete(null); 
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("price", Number(editingProduct.price));
    formData.append("location", editingProduct.location);
    formData.append("category", editingProduct.category);
    formData.append("description", editingProduct.description);
    formData.append("quantity", Number(editingProduct.quantity));

    if (editingProduct.newFiles) {
      for (let i = 0; i < editingProduct.newFiles.length; i++) {
        formData.append("files", editingProduct.newFiles[i]);
      }
    }

    try {
      const res = await axios.put(
        `https://isonga-backend.onrender.com/api/products/update/${editingProduct._id}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? res.data.UpdatedProduct : p))
        );
        setEditingProduct(null);
        alert("Product updated successfully!");
      }
    } catch (error) {
      setMessage("Updating Product Error");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="store-loading">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>Loading your store...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="My_Store">
      {/* Navbar */}
      <div className="My_Store_navbar">
        <div className="My_Store_logo">
          <img src="/logo.png" alt="logo" />
          <div className="My_Store_heads">
            <h1>Isonga</h1>
            <h2>Market</h2>
          </div>
        </div>
        <div className="My_Store_back">
          <Link to="/dashboard">
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </div>

      <div className="My_Store_body">
        <h1>Welcome Back {sellerName}</h1>
        <p>Manage Your Inventory Here</p>
      </div>

      <div className="Buyer_Dashboard_search">
        <div className="search-input-wrapper">
          <input
            type="search"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button><FontAwesomeIcon icon={faSearch} /> Search</button>
        </div>
      </div>

      <div className="store_container">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const activeIdx = currentIndex[product._id] || 0;
            const currentFile = product.files[activeIdx];

            return (
              <div key={product._id} className="productcard">
                <div className="image-slider">
                  {product.files?.length > 0 ? (
                    isVideoFile(currentFile) ? (
                      <video
                        src={getFileUrl(currentFile)}
                        muted autoPlay loop
                        className="product-media"
                        onClick={() => setModalMedia({ productId: product._id, index: activeIdx })}
                      />
                    ) : (
                      <img
                        src={getFileUrl(currentFile)}
                        alt={product.name}
                        className="product-media"
                        onClick={() => setModalMedia({ productId: product._id, index: activeIdx })}
                      />
                    )
                  ) : (
                    <img src="/placeholder.png" alt="No media" className="product-media" />
                  )}

                  {product.files?.length > 1 && (
                    <div className="slider-dots">
                      {product.files.map((_, idx) => (
                        <span 
                          key={idx} 
                          className={`dot ${idx === activeIdx ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(prev => ({...prev, [product._id]: idx}));
                          }}
                        ></span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="product-details">
                  <h1>{product.name}</h1>
                  <p className="price-tag">Price: <strong>{product.price} Rwf</strong></p>
                  <p><FontAwesomeIcon icon={faMapPin} /> {product.location}</p>
                  <p><FontAwesomeIcon icon={faInfoCircle} /> Quantity: {product.quantity}</p>
                  <p className="desc">{product.description}</p>
                  <div className="My_Store_btns">
                    <button className="delete" onClick={() => confirmDelete(product._id)}>
                       <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                    <button className="update" onClick={() => setEditingProduct(product)}>
                       <FontAwesomeIcon icon={faEdit} /> Update
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-products">No products found in your inventory.</p>
        )}
      </div>

      {/* MODERN UPDATE MODAL */}
      {editingProduct && (
        <div className="modern-reg-wrapper" style={{position: 'fixed', top: 0, left: 0, zIndex: 1000, width: '100%', height: '100vh', overflowY: 'auto', background: 'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center'}}>
            <div className="modern-reg-container" style={{maxWidth: '800px', width: '95%', margin: '40px auto'}}>
                <div className="modern-reg-main">
                    <div className="form-content-wrap">
                        <div className="form-header">
                            <h1>Update Product</h1>
                            <p>Refine your product details for better visibility.</p>
                        </div>

                        <form onSubmit={handleUpdate} className="modern-form">
                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Product Name</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faStore} />
                                        <input 
                                          type="text" 
                                          value={editingProduct.name} 
                                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} 
                                          required 
                                        />
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <label>Price (Rwf)</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        <input 
                                          type="number" 
                                          value={editingProduct.price} 
                                          onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} 
                                          required 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Location</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faMapPin} />
                                        <input 
                                          type="text" 
                                          value={editingProduct.location} 
                                          onChange={(e) => setEditingProduct({ ...editingProduct, location: e.target.value })} 
                                          required 
                                        />
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <label>Category</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faSearch} />
                                        <input 
                                          type="text" 
                                          value={editingProduct.category} 
                                          onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} 
                                          required 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <label>Quantity</label>
                                <div className="input-with-icon">
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                    <input 
                                      type="number" 
                                      value={editingProduct.quantity} 
                                      onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })} 
                                      required 
                                    />
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <label>Description</label>
                                <textarea 
                                  value={editingProduct.description} 
                                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} 
                                  required
                                ></textarea>
                            </div>

                            <div className="modern-multi-upload">
                                <label>Replace Media (Images/Videos)</label>
                                <div className="multi-upload-trigger" onClick={() => document.getElementById('prodMedia').click()}>
                                    <FontAwesomeIcon icon={faImages} />
                                    <span>{editingProduct.newFiles ? `${editingProduct.newFiles.length} files selected` : "Browse to Upload"}</span>
                                </div>
                                <input 
                                  id="prodMedia"
                                  type="file" 
                                  hidden 
                                  multiple 
                                  accept="image/*,video/*" 
                                  onChange={(e) => setEditingProduct({ ...editingProduct, newFiles: e.target.files })} 
                                />
                            </div>

                            <div className="form-actions" style={{display: 'flex', gap: '15px', marginTop: '25px'}}>
                                <button type="submit" className="modern-submit-btn" disabled={loading} style={{flex: 2}}>
                                    {loading ? "Saving Changes..." : <>Save Changes <FontAwesomeIcon icon={faCheckCircle} /></>}
                                </button>
                                <button type="button" className="modern-submit-btn" onClick={() => setEditingProduct(null)} style={{flex: 1, background: '#e74c3c'}}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-icon">⚠️</div>
            <h2>Are you sure?</h2>
            <p>This product will be removed from your store permanently.</p>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setProductToDelete(null)} disabled={loading}>No, Keep it</button>
              <button className="confirm-btn" onClick={executeDelete} disabled={loading}>{loading ? "Deleting..." : "Yes, Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Media Zoom Modal */}
      {modalMedia.productId && (() => {
        const product = products.find((p) => p._id === modalMedia.productId);
        if (!product) return null; 
        const file = product.files[modalMedia.index];
        return (
          <div className="media-modal" onClick={() => setModalMedia({ productId: null, index: 0 })}>
            <span className="close-btn">&times;</span>
            {isVideoFile(file) ? (
              <video src={getFileUrl(file)} controls autoPlay className="full-media" />
            ) : (
              <img src={getFileUrl(file)} alt="Full view" className="full-media" />
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

      {message && <div className="error-message">{message}</div>}
    </div>
  );
}

export default My_Store;