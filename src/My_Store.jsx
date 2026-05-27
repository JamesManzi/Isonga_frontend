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
      : `https://api.isongamarket.com/uploads/${path}`;
  };
// 1. Add these validation constants right above your handleFileChange function
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ACCEPTED_FORMATS = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg"
  ];

  // 2. Replace your old handleFileChange with this protected version
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];

    newFiles.forEach((file) => {
      // Check file size (20MB)
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large. Max size is 20MB.`);
        return;
      }

      // Check file format
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        alert(`${file.name} format is not supported.`);
        return;
      }

      validFiles.push(file);
      newPreviews.push({
        url: URL.createObjectURL(file),
        type: file.type,
      });
    });

    // Append valid selections to state
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewFiles((prev) => [...prev, ...newPreviews]);

    // Reset value so the user can re-add the same file if they delete it by mistake
    e.target.value = null;
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
  if (editingProduct.price) {
  formData.append("price", Number(editingProduct.price));
}
  formData.append("location", editingProduct.location);
  formData.append("category", editingProduct.category);
  formData.append("description", editingProduct.description);
  
  if (editingProduct.type === "Product") {
    formData.append("quantity", Number(editingProduct.quantity));
  }

  selectedFiles.forEach((file) => formData.append("files", file));

  try {
    const res = await api.put(`/api/products/update/${editingProduct._id}`, formData);
    
    if (res.data.success && res.data.product) {
      const updatedItem = res.data.product;

      // 1. Update the products array in state
      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? updatedItem : p))
      );

      // 2. Sync the slider index
      setCurrentIndex((prev) => ({
        ...prev,
        [updatedItem._id]: prev[updatedItem._id] || 0
      }));

      // 🎉 3. FIX: Instantly close the modal and clear file states 
      setEditingProduct(null); // 👈 This closes the update window right away!
      setSelectedFiles([]);
      setPreviewFiles([]);
      
      // Optional: replace standard alert with a minor notification or omit it for seamless return
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
          <img 
  src="/my_logo1.png" 
  alt="Isonga Market Logo" 
  style={{ width: "100px", height: "auto" }} 
/>
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
                 {product.price !== undefined &&
 product.price !== null &&
 product.price !== "" &&
 Number(product.price) > 0 && (
  <p>
    <strong>Price: {product.price} Rwf</strong>
  </p>
)}
                  {product.type === "Product" &&
 product.quantity !== undefined &&
 product.quantity !== null &&
 product.quantity !== "" &&
 Number(product.quantity) > 0 && (
  <p>
    <strong>Quantity:</strong> {product.quantity}
  </p>
)}
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
        <label>Name</label>
        <div className="input-with-icon">
            <FontAwesomeIcon icon={faStore} />
            <input
              type="text"
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  name: e.target.value,
                })
              }
              required
            />
        </div>
    </div>

    <div className="modern-input-group">
        <label>Price (Rwf)</label>
        <div className="input-with-icon">
            <FontAwesomeIcon icon={faTag} />
            <input
              type="number"
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  price: e.target.value,
                })
              }
            />
        </div>
    </div>

    {/* CONDITIONAL QUANTITY FIELD */}
    {editingProduct.type === "Product" && (
      <div className="modern-input-group">
          <label>Quantity Available</label>
          <div className="input-with-icon">
              <FontAwesomeIcon icon={faInfoCircle} />
              <input
                type="number"
                value={editingProduct.quantity}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    quantity: e.target.value,
                  })
                }
              />
          </div>
      </div>
    )}
</div>

                            <div className="modern-input-group">
                                <label>Description</label>
                                <textarea value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}></textarea>
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