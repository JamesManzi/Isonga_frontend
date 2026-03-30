import { useState, useEffect } from "react";
import { Link,useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTimes } from "@fortawesome/free-solid-svg-icons"; // Added faTimes
import "./Buyer_Profile.css";

function Buyer_Profile() {

const [buyer,setBuyer] = useState(null);
const navigate=useNavigate();
const [name,setName] = useState("");
const [password,setPassword] = useState("");
const [confirmPassword,setConfirmPassword] = useState("");
const [loading,setLoading]=useState(false);
const [profile,setProfile] = useState(null);
const [preview,setPreview] = useState("");

const [message,setMessage] = useState("");

// --- ADDED FOR ZOOM ---
const [isZoomed, setIsZoomed] = useState(false);

//////////////////////////////////////////////////
// FETCH BUYER
//////////////////////////////////////////////////

useEffect(()=>{

const fetchBuyer = async()=>{
setLoading(true)
try{
const res = await api.get("/api/buyer_profile");

if(res.data.success){

const b = res.data.buyer;

setBuyer(b);
setName(b.name);
setPreview(b.profile);

}

}catch(err){
console.log(err);
} finally{
    setLoading(false)
}

};

fetchBuyer();

},[]);

//////////////////////////////////////////////////
// IMAGE PREVIEW
//////////////////////////////////////////////////

const handleImageChange = (e)=>{

const file = e.target.files[0];

if(file){

setProfile(file);
setPreview(URL.createObjectURL(file));

}

};

//////////////////////////////////////////////////
// UPDATE PROFILE
//////////////////////////////////////////////////

const handleUpdate = async(e)=>{

e.preventDefault();

if(password !== confirmPassword){
setMessage("Passwords do not match");
return;
}
setLoading(true)
try{

const formData = new FormData();

formData.append("name",name);

if(password){
formData.append("password",password);
}

if(profile){
formData.append("profile",profile);
}

const res = await api.put("/api/update_buyer_profile", formData);

if(res.data.success){
setMessage("Profile updated successfully");
navigate("/buyer_dashboard");

}

}catch(err){
console.log(err);
setMessage("Update failed");
} finally{
    setLoading(false)
}

};

//////////////////////////////////////////////////
// IMAGE URL
//////////////////////////////////////////////////

const getFileUrl = (path)=>{

if(!path) return "/placeholder.png";

return path.startsWith("http") || path.startsWith("blob:")
? path
: `https://isonga-backend.onrender.com/uploads/${path}`;

};

//////////////////////////////////////////////////
// LOADING
//////////////////////////////////////////////////

if (loading || !buyer) {
  return (
    <div className="profile-loading">
      <div className="loading-card">
        <div className="spinner"></div>
        <h2>Loading your profile...</h2>
        <p>Please wait a moment</p>
      </div>
    </div>
  );
}

// Logic to determine which image is currently showing
const currentImage = profile 
? preview 
: buyer?.profile 
? getFileUrl(buyer.profile) 
: "/placeholder.png";

//////////////////////////////////////////////////
// UI
//////////////////////////////////////////////////

return(

<div className="profile-page">

{/* HEADER */}

<div className="profile-header">

<Link to="/buyer_dashboard" className="back-btn">
<FontAwesomeIcon icon={faArrowLeft} style={{color:"black"}}/> Back
</Link>

<h1>Account Settings</h1>

</div>

<div className="profile-card">

{/* PROFILE IMAGE */}

<div className="profile-image-section">

<img
src={currentImage}
alt="profile"
className="profile-image"
onClick={() => setIsZoomed(true)} /* Trigger Zoom */
style={{cursor: "zoom-in"}}
/>

<input
type="file"
onChange={handleImageChange}
className="file-input"
/>

</div>

<form className="profile-form" onSubmit={handleUpdate}>

<div className="form-group">

<label>Name</label>

<input
type="text"
value={name}
onChange={(e)=>setName(e.target.value)}
required
/>

</div>

<div className="form-group">

<label>New Password</label>

<input
type="password"
placeholder="Enter new password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

</div>

<div className="form-group">

<label>Confirm Password</label>

<input
type="password"
placeholder="Confirm password"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
/>

</div>

<button className="save-btn">
Update Profile
</button>

</form>

{message && (
  <div className={`alert`}>
    <span>{message}</span>
  </div>
)}

</div>

{/* ZOOM MODAL (COMBINED FROM YOUR PREVIOUS MODAL STYLE) */}
{isZoomed && (
  <div className="media-modal" onClick={() => setIsZoomed(false)} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', 
      justifyContent: 'center', alignItems: 'center', zIndex: 2000
  }}>
    <span className="close-btn" style={{
        position: 'absolute', top: '20px', right: '30px', 
        color: 'white', fontSize: '30px', cursor: 'pointer'
    }}>
      <FontAwesomeIcon icon={faTimes} />
    </span>
    <img 
      src={currentImage} 
      alt="Full Profile" 
      style={{ maxWidth: '90%', maxHeight: '85%', borderRadius: '10px' }} 
      onClick={(e) => e.stopPropagation()} 
    />
  </div>
)}

</div>

);

}

export default Buyer_Profile;