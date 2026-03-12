import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Add_Product.css";
import axios from "axios";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

function Add_Product() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // Define max size (20MB) and allowed types
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  const ACCEPTED_FORMATS = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg",
  ];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const previews = [];

    selectedFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large. Max size is 20 MB.`);
        return;
      }
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        alert(`${file.name} is not an accepted file type.`);
        return;
      }
      validFiles.push(file);
      previews.push({ url: URL.createObjectURL(file), type: file.type });
    });

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviewFiles((prev) => [...prev, ...previews]);
    e.target.value = null; // reset input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length < 2) {
      alert("Please upload at least Two images or videos.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("location", location);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("quantity", quantity);

    files.forEach((file) => formData.append("files", file));

    try {
      const res = await axios.post("https://isonga-backend.onrender.com/api/add_product", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if(!res.data.success){
            navigate("/login");
          }
      setMessage(res.data.message);
      if (res.data.success) navigate("/my_store");
    } catch (error) {
      console.log(error);
      setMessage("Add Product Error");
    }
  };

  return (
    <div className="Add_Product">
      <div className="Add_Product_navbar">
        <div className="Add_Product_logos">
          <img src="/logo.png" alt="logo" />
        </div>
        <div className="Add_Product_heads">
          <h1>Isonga</h1>
          <h2>Markert</h2>
        </div>
        <div className="Add_Product_logout">
          <Link to="/dashboard">
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </div>

      <div className="Add_Product_container">
        <form onSubmit={handleSubmit}>
          <h2>Product Information:</h2>

          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            className="product"
            placeholder="Enter Product Name"
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="price">Price</label>
          <input
            type="number"
            name="price"
            className="product"
            placeholder="Enter Price"
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <label htmlFor="location">Location</label>
          <input
            type="text"
            name="location"
            className="product"
            placeholder="Enter Location"
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            name="quantity"
            className="product"
            placeholder="Enter Quantity"
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <label htmlFor="category">Category</label>
          <select
            value={category}
            name="category"
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">-- Select Category --</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Services">Services</option>
            <option value="Fashion">Fashion</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Construction">Construction</option>
          </select>

          <label htmlFor="description">Description</label>
          <textarea
            value={description}
            name="description"
            placeholder="Enter Description"
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>

          <label htmlFor="images">Upload Images/Videos</label>
          <input
            type="file"
            name="files"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
          />

          <div className="preview_container">
            {previewFiles.map((file, index) => (
              <div key={index} className="preview_card">
                {file.type.startsWith("image") ? (
                  <img src={file.url} alt="preview" className="files" />
                ) : (
                  <video src={file.url} controls className="files" width="200" />
                )}
              </div>
            ))}
          </div>

          <div className="Add_Products_btns">
            <button
              type="button"
              className="bt1"
              onClick={() => {
                setName("");
                setPrice("");
                setLocation("");
                setCategory("");
                setDescription("");
                setFiles([]);
                setPreviewFiles([]);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="bt2">
              Add Product
            </button>
          </div>
          {message&&(
            <p>{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Add_Product;