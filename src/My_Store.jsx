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
} from "@fortawesome/free-solid-svg-icons";

function My_Store() {
  const [products, setProducts] = useState([]);
  const [loading,setLoading]=useState(false)
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [currentIndex, setCurrentIndex] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
   const [pageLoading, setPageLoading] = useState(true);

  const [modalMedia, setModalMedia] = useState({ productId: null, index: 0 });

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
        console.log(error);
        setMessage("My Store Error");
      } finally{
        setPageLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Live search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.location && p.location.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleNext = (productId, total) => {
    setCurrentIndex((prev) => ({
      ...prev,
      [productId]: (prev[productId] + 1) % total,
    }));
  };

  const handlePrev = (productId, total) => {
    setCurrentIndex((prev) => ({
      ...prev,
      [productId]: (prev[productId] - 1 + total) % total,
    }));
  };

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await axios.delete(
        `https://isonga-backend.onrender.com/api/products/delete/${productId}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        setFilteredProducts((prev) => prev.filter((p) => p._id !== productId));
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Delete failed");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

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
    setLoading(true)
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
        setFilteredProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? res.data.UpdatedProduct : p))
        );
        setEditingProduct(null);
        alert("Product updated successfully!");
      } else {
        setMessage(res.data.message || "Update failed");
      }
    } catch (error) {
      console.log(error);
      setMessage("Updating Product Error");
    } finally{
      setLoading(false);
    }
  };

  const getFileUrl = (path) => {
  if (!path) return "/placeholder.png"; // Fallback if no image exists
  return path.startsWith("http") 
    ? path 
    : `https://isonga-backend.onrender.com/uploads/${path}`;
};
if (pageLoading) {
  return (
    <div className="store-loading">
      <div className="loading-card">
        <div className="spinner"></div>
        <h2>Loading your store...</h2>
        <p>Please wait</p>
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

      {/* Welcome */}
      <div className="My_Store_body">
        <h1>Welcome Back {sellerName}</h1>
        <p>Manage Your Inventory Here</p>
      </div>

      {/* Search */}
      <div className="Buyer_Dashboard_search">
        <input
          type="search"
          placeholder="Search by name, location, category, description..."
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
          filteredProducts.map((product) => (
            <div key={product._id} className="productcard">
              {/* Slider */}
              {product.files?.length > 0 && (
                <div className="image-slider">
                  {(() => {
                    const index = currentIndex[product._id] ?? 0;
                    const file = product.files[index];
                    const url = getFileUrl(file);
                    return isVideoFile(file) ? (
                      <video
                        src={url}
                        controls
                        autoPlay
                        loop
                        muted
                        className="product-media"
                        onClick={() => setModalMedia({ productId: product._id, index })}
                      />
                    ) : (
                      <img
                        src={url}
                        alt={product.name}
                        className="product-media"
                        onClick={() => setModalMedia({ productId: product._id, index })}
                      />
                    );
                  })()}

                  <div className="slider-controls">
                    <FontAwesomeIcon
                      icon={faChevronLeft}
                      className="slider-icon"
                      onClick={() => handlePrev(product._id, product.files.length)}
                    />
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="slider-icon"
                      onClick={() => handleNext(product._id, product.files.length)}
                    />
                  </div>
                </div>
              )}

              <h1>{product.name}</h1>
              <p>Price: {product.price} Rwf</p>
              <p>Location: {product.location}</p>
              <p>Quantity: {product.quantity}</p>
              <p>{product.description}</p>

              <div className="My_Store_btns">
                <button className="delete" onClick={() => handleDelete(product._id)}>
                  Delete
                </button>
                <button className="update" onClick={() => setEditingProduct(product)}>
                  Update
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No products found</p>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h2>Edit Product</h2>
            <input
              type="text"
              value={editingProduct.name}
              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              placeholder="Name"
            />
            <input
              type="number"
              value={editingProduct.price}
              onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
              placeholder="Price"
            />
            <input
              type="text"
              value={editingProduct.location}
              onChange={(e) => setEditingProduct({ ...editingProduct, location: e.target.value })}
              placeholder="Location"
            />
            <input
              type="text"
              value={editingProduct.category}
              onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
              placeholder="Category"
            />
            <input
              type="number"
              value={editingProduct.quantity}
              onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
              placeholder="Quantity"
            />
            <textarea
              value={editingProduct.description}
              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
              placeholder="Description"
            />
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => setEditingProduct({ ...editingProduct, newFiles: e.target.files })}
            />
            <div className="edit-buttons">
              <button onClick={handleUpdate} disabled={loading}>
                {loading ?"Saving...":"Save"}
              </button>
              <button onClick={() => setEditingProduct(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen modal */}
      {modalMedia.productId && (() => {
        const product = products.find((p) => p._id === modalMedia.productId);
        const file = product.files[modalMedia.index];
        const url = getFileUrl(file);
        const video = isVideoFile(file);

        const handleNextModal = () => {
          setModalMedia((prev) => ({
            ...prev,
            index: (prev.index + 1) % product.files.length,
          }));
        };

        const handlePrevModal = () => {
          setModalMedia((prev) => ({
            ...prev,
            index: (prev.index - 1 + product.files.length) % product.files.length,
          }));
        };

        return (
          <div className="media-modal" onClick={() => setModalMedia({ productId: null, index: 0 })}>
            {video ? (
              <video src={url} controls autoPlay loop className="full-media" />
            ) : (
              <img src={url} alt="Full view" className="full-media" />
            )}
            <div className="modal-controls">
              <FontAwesomeIcon icon={faChevronLeft} onClick={(e) => { e.stopPropagation(); handlePrevModal(); }} className="modal-arrow" />
              <FontAwesomeIcon icon={faChevronRight} onClick={(e) => { e.stopPropagation(); handleNextModal(); }} className="modal-arrow" />
            </div>
          </div>
        );
      })()}

      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  );
}

export default My_Store;