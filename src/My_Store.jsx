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
  faCloudUploadAlt,
  faLayerGroup,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

function My_Store() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sellerName, setSellerName] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);

  // ✅ CATEGORY OPTIONS
  const categoryOptions = {
    Product: ["Agriculture","Fashion","Electronics","Furniture","Food","Construction Materials"],
    Service: ["Repair","Cleaning","Transport","Construction","IT Services","Consulting"],
    Asset: ["House","Land","Vehicle","Apartment","Office Space","Farm"]
  };

  // ✅ FETCH DATA
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
        } else {
          setMessage(res.data.message);
        }
      } catch (error) {
        setMessage("Failed to load store");
      } finally {
        setPageLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ SEARCH
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, products]);

  // ✅ FILE HANDLING
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

  // ✅ UPDATE PRODUCT
  const handleUpdate = async (e) => {
    e.preventDefault();
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
            p._id === editingProduct._id ? res.data.UpdatedProduct : p
          )
        );

        setEditingProduct(null);
        setSelectedFiles([]);
        setPreviewFiles([]);

        alert("Updated successfully!");
      }
    } catch {
      setMessage("Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <h2>Loading...</h2>;

  return (
    <div className="My_Store">
      {/* NAVBAR */}
      <div className="My_Store_navbar">
        <h2>Welcome {sellerName}</h2>
        <Link to="/dashboard">
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </div>

      {/* SEARCH */}
      <input
        type="search"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* PRODUCTS */}
      <div className="store_container">
        {filteredProducts.map((product) => (
          <div key={product._id} className="productcard">
            <h3>{product.name}</h3>
            <p>{product.price} Rwf</p>
            <p>{product.type}</p>
            <p>{product.category}</p>

            {product.type === "Product" && (
              <p>Qty: {product.quantity}</p>
            )}

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
        ))}
      </div>

      {/* ✅ UPDATE MODAL */}
      {editingProduct && (
        <div className="modal">
          <form onSubmit={handleUpdate}>
            <h2>Update Item</h2>

            {/* TYPE */}
            <select
              value={editingProduct.type}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  type: e.target.value,
                  category: ""
                })
              }
              required
            >
              <option value="">Select Type</option>
              <option value="Product">Product</option>
              <option value="Service">Service</option>
              <option value="Asset">Asset</option>
            </select>

            {/* NAME */}
            <input
              type="text"
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  name: e.target.value
                })
              }
            />

            {/* PRICE */}
            <input
              type="number"
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  price: e.target.value
                })
              }
            />

            {/* LOCATION */}
            <input
              type="text"
              value={editingProduct.location}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  location: e.target.value
                })
              }
            />

            {/* CATEGORY */}
            <select
              value={editingProduct.category}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  category: e.target.value
                })
              }
              disabled={!editingProduct.type}
            >
              <option value="">Select Category</option>
              {editingProduct.type &&
                categoryOptions[editingProduct.type].map((cat, i) => (
                  <option key={i}>{cat}</option>
                ))}
            </select>

            {/* QUANTITY ONLY FOR PRODUCT */}
            {editingProduct.type === "Product" && (
              <input
                type="number"
                placeholder="Quantity"
                value={editingProduct.quantity || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    quantity: e.target.value
                  })
                }
              />
            )}

            {/* DESCRIPTION */}
            <textarea
              value={editingProduct.description}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  description: e.target.value
                })
              }
            />

            {/* FILE UPLOAD */}
            <input type="file" multiple onChange={handleFileChange} />

            <div>
              {previewFiles.map((file, i) => (
                <div key={i}>
                  <img src={file.url} width="80" alt="" />
                  <button type="button" onClick={() => removePreview(i)}>
                    X
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>

            <button type="button" onClick={() => setEditingProduct(null)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default My_Store;