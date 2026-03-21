import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Add_Product.css";
import axios from "axios";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

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
  const [loading,setLoading]=useState(false)
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

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviewFiles((prev) => [...prev, ...previews]);

    e.target.value = null;
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
    setLoading(true)
    try {

      const res = await axios.post(
        "https://isonga-backend.onrender.com/api/add_product",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (!res.data.success) {
        navigate("/login");
        return;
      }

      setMessage(res.data.message);

      if (res.data.success) {
        navigate("/my_store");
      }

    } catch (error) {

      console.log(error);
      setMessage("Add item error");

    } finally{
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

          <label>Location</label>

          <input
            type="text"
            placeholder="Enter Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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

          <label>Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!type}
            required
          >

            <option value="">-- Select Category --</option>

            {type &&
              categoryOptions[type].map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}

          </select>

          <label>Description</label>

          <textarea
            placeholder="Enter Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>

          <label>Upload Images / Videos</label>

          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
          />

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
                    controls
                    className="files"
                  />

                )}

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
              {loading ? "Add Item ...":"Add Item"}
            </button>

          </div>

          {message && <p>{message}</p>}

        </form>

      </div>

    </div>

  );

}

export default Add_Product;