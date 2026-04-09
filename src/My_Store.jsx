import { useState, useEffect, useRef } from "react";
import api from "./api";
import "./My_Store.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useNavigate } from "react-router-dom";
import {
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faStore,
  faMapPin,
  faTag,
  faInfoCircle,
  faTrash,
  faCloudUploadAlt,
  faLayerGroup,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

// Consistent category options mapping
const categoryOptions = {
  Product: ["Agriculture", "Fashion", "Electronics", "Furniture", "Food", "Construction Materials"],
  Service: ["Repair", "Cleaning", "Transport", "Construction", "IT Services", "Consulting"],
  Asset: ["House", "Land", "Vehicle", "Apartment", "Office Space", "Farm"]
};

function My_Store() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);

  // 1. Fetch Store Data
  useEffect(() => {
    const fetchProducts = async () => {
      setPageLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await api.get("/api/my_store");
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
  }, [navigate]);

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
          (p.category && p.category.toLowerCase().includes(query)) ||
          (p.type && p.type.toLowerCase().includes(query))
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
  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(filename);

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("blob:") || path.startsWith("http")
      ? path
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((f) => ({
      url: URL.createObjectURL(f),
      type: f.type,
    }));
    setPreviewFiles((prev) => [...prev, ...newPreviews]);
  };

  const removePreview = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmDelete = (productId) => setProductToDelete(productId);

  const executeDelete = async () => {
    if (!productToDelete) return;
    setLoading(true);
    try {
      const res = await api.delete(`/api/products/delete/${productToDelete}`);
      if (res.data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productToDelete));
        setProductToDelete(null);
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
  formData.append("type", editingProduct.type);
  formData.append("name", editingProduct.name);
  formData.append("price", Number(editingProduct.price));
  formData.append("location", editingProduct.location);
  formData.append("category", editingProduct.category);
  formData.append("description", editingProduct.description);
  
  if (editingProduct.type === "Product") {
    formData.append("quantity", Number(editingProduct.quantity));
  }

  selectedFiles.forEach((file) => formData.append("files", file));

  try {
    const res = await api.put(`/api/products/update/${editingProduct._id}`, formData);
    
    // Check for res.data.product to match your backend response
    if (res.data.success && res.data.product) {
      const updatedItem = res.data.product; // Use the 'product' key from your backend

      // 1. Update the products array
      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? updatedItem : p))
      );

      // 2. Sync the slider index for the updated product ID
      setCurrentIndex((prev) => ({
        ...prev,
        [updatedItem._id]: prev[updatedItem._id] || 0
      }));

      // 3. Reset UI states
      setEditingProduct(null);
      setSelectedFiles([]);
      setPreviewFiles([]);
      alert("Updated successfully!");
    } else {
      console.error("Data mismatch: res.data.product is undefined");
      setMessage("Update error: Missing product data from server.");
    }
  } catch (error) {
    console.error("Update Error:", error);
    setMessage("Update Failed. Please check your connection.");
  } finally {
    setLoading(false);
  }
};
  if (pageLoading) {
    return (
      <div className="store-loading">
        <div className="spinner"></div>
        <h2>Loading your store...</h2>
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
        <input
          type="search"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button><FontAwesomeIcon icon={faSearch} /> Search</button>
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
                        muted autoPlay loop playsInline
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
                  {/* Badge for Type */}
                  <div className="type-tag">{product.type}</div>
                </div>

                <div className="product-details">
                  <h1>{product.name}</h1>
                  <p>Price: {product.price} Rwf</p>
                  <p>Location: {product.location}</p>
                  {product.type === "Product" && <p>Quantity: {product.quantity}</p>}
                  <p className="desc-text">{product.description}</p>
                  <div className="My_Store_btns">
                    <button className="delete" onClick={() => confirmDelete(product._id)}>Delete</button>
                    <button className="update" onClick={() => {
                        setEditingProduct(product);
                        setSelectedFiles([]);
                        setPreviewFiles([]);
                    }}>Update</button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-products">No items found in your inventory.</p>
        )}
      </div>

      {/* Modern Update Modal */}
      {editingProduct && (
        <div className="modern-reg-wrapper" style={{position: 'fixed', top: 0, left: 0, zIndex: 1000, width: '100%', height: '100vh', overflowY: 'auto', background: 'rgba(0,0,0,0.85)'}}>
            <div className="modern-reg-container" style={{maxWidth: '800px', margin: '40px auto'}}>
                <div className="modern-reg-main">
                    <div className="form-content-wrap">
                        <div className="form-header">
                            <h1>Update {editingProduct.type}</h1>
                            <p>Edit your listing details below.</p>
                        </div>

                        <form onSubmit={handleUpdate} className="modern-form">
                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Type</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faLayerGroup} />
                                        <select 
                                          value={editingProduct.type} 
                                          onChange={(e) => setEditingProduct({...editingProduct, type: e.target.value, category: ""})} 
                                          required
                                        >
                                            <option value="Product">Product</option>
                                            <option value="Service">Service</option>
                                            <option value="Asset">Asset</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <label>Category</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faLayerGroup} />
                                        <select 
                                          value={editingProduct.category} 
                                          onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} 
                                          required
                                        >
                                            <option value="">-- Select Category --</option>
                                            {categoryOptions[editingProduct.type].map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Name</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faStore} />
                                        <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="modern-input-group">
                                    <label>Price (Rwf)</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faTag} />
                                        <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} required />
                                    </div>
                                </div>
                            </div>

                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Location</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faMapPin} />
                                        <input type="text" value={editingProduct.location} onChange={(e) => setEditingProduct({...editingProduct, location: e.target.value})} required />
                                    </div>
                                </div>
                                {/* CONDITIONAL QUANTITY FIELD */}
                                {editingProduct.type === "Product" && (
                                  <div className="modern-input-group">
                                      <label>Quantity Available</label>
                                      <div className="input-with-icon">
                                          <FontAwesomeIcon icon={faInfoCircle} />
                                          <input type="number" value={editingProduct.quantity} onChange={(e) => setEditingProduct({...editingProduct, quantity: e.target.value})} required />
                                      </div>
                                  </div>
                                )}
                            </div>

                            <div className="modern-input-group">
                                <label>Description</label>
                                <textarea value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} required></textarea>
                            </div>

                            <div className="modern-multi-upload">
                                <label>New Media (Optional)</label>
                                <div className="multi-upload-trigger" onClick={() => fileInputRef.current.click()}>
                                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                                    <span>Browse Photos/Videos</span>
                                </div>
                                <input type="file" ref={fileInputRef} hidden multiple accept="image/*,video/*" onChange={handleFileChange} />
                                
                                <div className="modern-gallery-grid">
                                    {previewFiles.map((file, i) => (
                                        <div key={i} className="gallery-item">
                                            {file.type.startsWith('video') ? (
                                                <video src={file.url} muted />
                                            ) : (
                                                <img src={file.url} alt="Preview" />
                                            )}
                                            <button type="button" onClick={() => removePreview(i)} className="remove-preview-btn">
                                                <FontAwesomeIcon icon={faTimes} size="xs" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="modern-submit-btn" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                                <button type="button" className="modern-cancel-btn" onClick={() => setEditingProduct(null)}>Cancel</button>
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
            <p>Delete this item permanently?</p>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setProductToDelete(null)}>No</button>
              <button className="confirm-btn" onClick={executeDelete} disabled={loading}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="error-message">{message}</div>}
    </div>
  );
}

export default My_Store;