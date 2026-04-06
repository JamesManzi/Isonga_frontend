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
  faImages,
  faCheckCircle,
  faTrash,
  faCloudUploadAlt,
  faLayerGroup,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

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

  // ✅ CATEGORY OPTIONS
  const categoryOptions = {
    Product: ["Agriculture","Fashion","Electronics","Furniture","Food","Construction Materials"],
    Service: ["Repair","Cleaning","Transport","Construction","IT Services","Consulting"],
    Asset: ["House","Land","Vehicle","Apartment","Office Space","Farm"]
  };

  // FETCH
  useEffect(() => {
    const fetchProducts = async () => {
      setPageLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

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
      } catch {
        setMessage("Could not load your store.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // SEARCH
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, products]);

  // AUTO SLIDER
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const newIndexes = { ...prev };
        filteredProducts.forEach((product) => {
          if (product.files?.length > 1) {
            const currentIdx = prev[product._id] || 0;
            newIndexes[product._id] =
              (currentIdx + 1) % product.files.length;
          }
        });
        return newIndexes;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [filteredProducts]);

  const isVideoFile = (filename) =>
    /\.(mp4|webm|ogg|mov|m4v)$/i.test(filename || "");

  const getFileUrl = (path) =>
    path?.startsWith("blob:") || path?.startsWith("http")
      ? path
      : `https://isonga-backend.onrender.com/uploads/${path}`;

  // FILE HANDLING
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    setSelectedFiles((prev) => [...prev, ...files]);

    const previews = files.map((f) => ({
      url: URL.createObjectURL(f),
      type: f.type
    }));

    setPreviewFiles((prev) => [...prev, ...previews]);
  };

  const removePreview = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // DELETE
  const executeDelete = async () => {
    if (!productToDelete) return;
    setLoading(true);

    try {
      const res = await api.delete(`/api/products/delete/${productToDelete}`);
      if (res.data.success) {
        setProducts((prev) =>
          prev.filter((p) => p._id !== productToDelete)
        );
        setProductToDelete(null);
      }
    } catch {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // UPDATE
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("type", editingProduct.type);
    formData.append("name", editingProduct.name);
    formData.append("price", editingProduct.price);
    formData.append("location", editingProduct.location);
    formData.append("category", editingProduct.category);
    formData.append("description", editingProduct.description);

    if (editingProduct.type === "Product") {
      formData.append("quantity", editingProduct.quantity);
    }

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await api.put(
        `/api/products/update/${editingProduct._id}`,
        formData
      );

      if (res.data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === editingProduct._id
              ? res.data.UpdatedProduct
              : p
          )
        );
        setEditingProduct(null);
        setSelectedFiles([]);
        setPreviewFiles([]);
        alert("Product updated successfully!");
      }
    } catch {
      setMessage("Updating Product Error");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <h2>Loading...</h2>;

  return (
    <div className="My_Store">
      {/* NAVBAR */}
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

      {/* HEADER */}
      <div className="My_Store_body">
        <h1>Welcome Back {sellerName}</h1>
        <p>Manage Your Inventory Here</p>
      </div>

      {/* SEARCH */}
      <div className="Buyer_Dashboard_search">
        <input
          type="search"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button>
          <FontAwesomeIcon icon={faSearch} /> Search
        </button>
      </div>

      {/* PRODUCTS */}
      <div className="store_container">
        {filteredProducts.map((product) => {
          const activeIdx = currentIndex[product._id] || 0;
          const file = product.files?.[activeIdx];

          return (
            <div key={product._id} className="productcard">
              <div className="image-slider">
                {file &&
                  (isVideoFile(file) ? (
                    <video src={getFileUrl(file)} autoPlay loop muted />
                  ) : (
                    <img src={getFileUrl(file)} alt="" />
                  ))}
              </div>

              <div className="product-details">
                <h1>{product.name}</h1>
                <p>Type: {product.type}</p>
                <p>Price: {product.price} Rwf</p>
                <p>Location: {product.location}</p>

                {product.type === "Product" && (
                  <p>Quantity: {product.quantity}</p>
                )}

                <p>{product.description}</p>

                <div className="My_Store_btns">
                  <button onClick={() => setProductToDelete(product._id)}>
                    Delete
                  </button>

                  <button
                    onClick={() =>
                      setEditingProduct({
                        ...product,
                        type: product.type || "Product"
                      })
                    }
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* UPDATE MODAL */}
      {editingProduct && (
        <div className="modern-reg-wrapper">
          <form onSubmit={handleUpdate}>

            <select
              value={editingProduct.type}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  type: e.target.value,
                  category: ""
                })
              }
            >
              <option value="">Select Type</option>
              <option value="Product">Product</option>
              <option value="Service">Service</option>
              <option value="Asset">Asset</option>
            </select>

            <input
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  name: e.target.value
                })
              }
            />

            <select
              value={editingProduct.category}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  category: e.target.value
                })
              }
            >
              {editingProduct.type &&
                categoryOptions[editingProduct.type].map((cat, i) => (
                  <option key={i}>{cat}</option>
                ))}
            </select>

            {editingProduct.type === "Product" && (
              <input
                type="number"
                value={editingProduct.quantity}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    quantity: e.target.value
                  })
                }
              />
            )}

            <button type="submit">Save</button>
          </form>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default My_Store;