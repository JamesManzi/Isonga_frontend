import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./My_Store.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import {
  faArrowRight,
  faSearch,
  faStore,
  faMapPin,
  faTag,
  faInfoCircle,
  faImages,
  faCheckCircle,
  faTrash,
  faCloudUploadAlt,
  faLayerGroup,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

function My_Store() {
  const fileInputRef = useRef(null);
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

  // Multi-upload states for the Update Form
  const [files, setFiles] = useState([]); 
  const [previewFiles, setPreviewFiles] = useState([]);

  // --- 1. ORIGINAL FETCH LOGIC ---
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
        setMessage("Could not load your store.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- 2. ORIGINAL SEARCH LOGIC ---
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

  // --- 3. ORIGINAL AUTO-SLIDER LOGIC ---
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

  // --- HELPERS ---
  const isVideoFile = (filename) => {
    if (!filename) return false;
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(filename);
  };

  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    return path.startsWith("blob:") || path.startsWith("http") 
      ? path 
      : `https://isonga-backend.onrender.com/uploads/${path}`;
  };

  // --- FILE HANDLING LOGIC ---
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    
    // Create preview objects with URLs and types for the UI
    const newPreviews = newFiles.map(f => ({
        url: URL.createObjectURL(f),
        type: f.type
    }));
    setPreviewFiles((prev) => [...prev, ...newPreviews]);
  };

  const removePreview = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ORIGINAL ACTIONS ---
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
      }
    } catch (error) {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("price", Number(editingProduct.price));
    formData.append("location", editingProduct.location);
    formData.append("category", editingProduct.category);
    formData.append("description", editingProduct.description);
    formData.append("quantity", Number(editingProduct.quantity));

    // Append all selected files to the form data
    files.forEach((file) => {
      formData.append("files", file);
    });

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
        setFiles([]);
        setPreviewFiles([]);
        alert("Product updated successfully!");
      }
    } catch (error) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="store-loading"><h2>Loading your store...</h2></div>;

  return (
    <div className="My_Store">
      {/* ORIGINAL NAVBAR */}
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

      {/* ORIGINAL PRODUCT CARDS */}
      <div className="store_container">
        {filteredProducts.map((product) => {
          const activeIdx = currentIndex[product._id] || 0;
          const currentFile = product.files[activeIdx];

          return (
            <div key={product._id} className="productcard">
              <div className="image-slider">
                {product.files?.length > 0 ? (
                  isVideoFile(currentFile) ? (
                    <video
                      key={currentFile}
                      src={getFileUrl(currentFile)}
                      muted autoPlay loop playsInline
                      className="product-media"
                    />
                  ) : (
                    <img
                      src={getFileUrl(currentFile)}
                      alt={product.name}
                      className="product-media"
                    />
                  )
                ) : (
                  <img src="/placeholder.png" alt="No media" className="product-media" />
                )}

                <div className="My_Store_btns">
                  <button className="delete" onClick={() => setProductToDelete(product._id)}>Delete</button>
                  <button className="update" onClick={() => {
                    setEditingProduct(product);
                    setFiles([]);
                    setPreviewFiles([]);
                  }}>Update</button>
                </div>
              </div>

              <div className="product-details">
                <h1>{product.name}</h1>
                <p>Price: {product.price} Rwf</p>
                <p>Quantity: {product.quantity}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODERN UPDATE MODAL */}
      {editingProduct && (
        <div className="modern-reg-wrapper" style={{position: 'fixed', top: 0, left: 0, zIndex: 1000, width: '100%', height: '100vh', overflowY: 'auto', background: 'rgba(0,0,0,0.85)'}}>
            <div className="modern-reg-container" style={{maxWidth: '800px', margin: '20px auto'}}>
                <div className="modern-reg-main">
                    <div className="form-content-wrap">
                        <div className="form-header">
                            <h1>Update Product</h1>
                            <p>Edit your product information and gallery.</p>
                        </div>

                        <form onSubmit={handleUpdate} className="modern-form">
                            <div className="modern-grid">
                                <div className="modern-input-group">
                                    <label>Product Name</label>
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
                                <div className="modern-input-group">
                                    <label>Category</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faLayerGroup} />
                                        <input type="text" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} required />
                                    </div>
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <label>Quantity Available</label>
                                <div className="input-with-icon">
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                    <input type="number" value={editingProduct.quantity} onChange={(e) => setEditingProduct({...editingProduct, quantity: e.target.value})} required />
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <label>Description</label>
                                <textarea value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} required></textarea>
                            </div>

                            {/* MULTI-FILE UPLOAD WITH DELETE PREVIEWS */}
                            <div className="modern-multi-upload">
                                <label>Replace Media Gallery</label>
                                <div className="multi-upload-trigger" onClick={() => fileInputRef.current.click()}>
                                    <FontAwesomeIcon icon={faImages} />
                                    <span>Click to select multiple files</span>
                                </div>
                                <input type="file" ref={fileInputRef} hidden multiple accept="image/*,video/*" onChange={handleFileChange} />
                                
                                <div className="modern-gallery-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', marginTop: '15px'}}>
                                    {previewFiles.map((file, i) => (
                                        <div key={i} className="gallery-item" style={{position: 'relative', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd'}}>
                                            {file.type.startsWith('video') ? (
                                                <video src={file.url} muted style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                            ) : (
                                                <img src={file.url} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                            )}
                                            <button type="button" onClick={() => removePreview(i)} style={{position: 'absolute', top: '5px', right: '5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer'}}>
                                                <FontAwesomeIcon icon={faTimes} size="xs" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions" style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
                                <button type="submit" className="modern-submit-btn" disabled={loading} style={{flex: 2}}>
                                    {loading ? "Updating..." : "Save Changes"}
                                </button>
                                <button type="button" className="modern-submit-btn" onClick={() => setEditingProduct(null)} style={{flex: 1, background: '#666'}}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ORIGINAL DELETE MODAL */}
      {productToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-icon">⚠️</div>
            <h2>Remove Product?</h2>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setProductToDelete(null)}>No</button>
              <button className="confirm-btn" onClick={executeDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="error-message">{message}</div>}
    </div>
  );
}

export default My_Store;