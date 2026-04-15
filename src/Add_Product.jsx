
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Add_Product.css";
import api from "./api";
import { faArrowRight, faTrash, faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons";

const categoryOptions = {
  Product: [
    "Agriculture",
    "Fashion",
    "Electronics",
    "Furniture",
    "Food",
    "Construction Materials"
  ],
  Service: [
    "Repair",
    "Cleaning",
    "Transport",
    "Construction",
    "IT Services",
    "Consulting"
  ],
  Asset: [
    "House",
    "Land",
    "Vehicle",
    "Apartment",
    "Office Space",
    "Farm"
  ]
};

function Add_Product() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");

  const [files, setFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);

  const [message, setMessage] = useState("");

  const MAX_FILE_SIZE = 20 * 1024 * 1024;

  const ACCEPTED_FORMATS = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg"
  ];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const previews = [];

    selectedFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large. Max size is 20MB.`);
        return;
      }

      if (!ACCEPTED_FORMATS.includes(file.type)) {
        alert(`${file.name} is not supported.`);
        return;
      }

      validFiles.push(file);
      previews.push({
        url: URL.createObjectURL(file),
        type: file.type
      });
    });

    // IMPROVEMENT: Append files so user can select many photos at different times
    setFiles((prev) => [...prev, ...validFiles]);
    setPreviewFiles((prev) => [...prev, ...previews]);

    e.target.value = null;
  };

  // NEW: Ability to remove a specific image from the many selected
  const removeImage = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviewFiles(previewFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length < 2) {
      alert("Upload at least two images or videos.");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("name", name);
    formData.append("price", price);
    formData.append("location", location);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("quantity", quantity);

    files.forEach((file) => {
      formData.append("files", file);
    });

    setLoading(true);
     const token = localStorage.getItem("token");
        if (!token) {
        navigate("/login");
        return;
      }
    try {
     const res = await api.post("/api/add_product",
        formData)
      if (!res.data.success) {
        navigate("/login");
        return;
      }

      setMessage({
        text: res.data.message,
        type: res.data.success ? "success" : "error",
      });

      if (res.data.success) {
        setTimeout(() => {
          navigate("/my_store");
        }, 1000);
      }

    } catch (error) {
      console.log(error);
      setMessage({
        text: "Adding Item Failed.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType("");
    setName("");
    setPrice("");
    setLocation("");
    setCategory("");
    setDescription("");
    setQuantity("");
    setFiles([]);
    setPreviewFiles([]);
    setMessage("");
  };

  return (
    <div className="Add_Product">
      <div className="Add_Product_navbar">
        <div className="Add_Product_logos">
          <img src="/logo.png" alt="logo" />
        </div>
        <div className="Add_Product_heads">
          <h1>Isonga</h1>
          <h2>Market</h2>
        </div>
        <div className="Add_Product_logout">
          <Link to="/dashboard">
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </div>

      <div className="Add_Product_container">
        <form onSubmit={handleSubmit}>
          <h2>Listing Information</h2>

          <label>Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setCategory("");
            }}
            required
          >
            <option value="">-- Select Type --</option>
            <option value="Product">Product</option>
            <option value="Service">Service</option>
            <option value="Asset">Asset</option>
          </select>

          <label>Name</label>
          <input
            type="text"
            placeholder={
              type === "Service"
                ? "Enter Service Name"
                : type === "Asset"
                ? "Enter Asset Name"
                : "Enter Product Name"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Price</label>
          <input
            type="number"
            placeholder="Enter Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          {type === "Product" && (
            <>
              <label>Quantity</label>
              <input
                type="number"
                placeholder="Enter Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </>
          )}


          <label>Description</label>
          <textarea
            placeholder="Enter Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>

          <label>Upload Images / Videos</label>
          {/* IMPROVED FILE INPUT STYLING */}
          <div className="custom_file_input">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
            />
            <div className="upload_design">
               <FontAwesomeIcon icon={faCloudUploadAlt} />
               <span>Click to Select Multiple Files</span>
            </div>
          </div>

          <div className="preview_container">
            {previewFiles.map((file, index) => (
              <div key={index} className="preview_card">
                {file.type.startsWith("image") ? (
                  <img
                    src={file.url}
                    alt="preview"
                    className="files"
                  />
                ) : (
                  <video
                    src={file.url}
                    className="files"
                  />
                )}
                <button type="button" className="remove_img_btn" onClick={() => removeImage(index)}>
                   <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>

          <div className="Add_Products_btns">
            <button
              type="button"
              className="bt1"
              onClick={resetForm}
            >
              Cancel
            </button>
            <button type="submit" className="bt2" disabled={loading}>
              {loading ? "Adding Item ..." : "Add Item"}
            </button>
          </div>

          {message && (
            <div className={`alert ${message.type}`}>
              <span className="alert-icon">
                {message.type === "success" ? "✓" : "⚠"}
              </span>
              <span>{message.text}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Add_Product;