import { useState, useEffect } from "react";
import { Link,useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTimes,faEye,faEyeSlash } from "@fortawesome/free-solid-svg-icons"; // Added faTimes
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
const [showPassword,setShowPassword]=useState(false);

const [message, setMessage] = useState({ text: "", type: "" });

const [isZoomed, setIsZoomed] = useState(false);
 const rule = /^(?=.{10,})(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;
const togglePassword=()=>{
  setShowPassword(prev=>!prev)
}

useEffect(()=>{

const fetchBuyer = async()=>{
setLoading(true)
try{
  const token=localStorage.getItem("token");
  if(!token){
    navigate("/buyer_login");
    return;
  }
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

const handleImageChange = (e)=>{

const file = e.target.files[0];
if(file.size>5*1024*1024){
  setMessage("Profile is Large Max(5MB");
  return
}
if(file){
setProfile(file);
setPreview(URL.createObjectURL(file));

}

};

const handleUpdate = async(e)=>{

e.preventDefault();

if(!(password||name||confirmPassword)){
  setMessage("All Fields Required");
  return;
}

if(password !== confirmPassword){
setMessage("Passwords do not match");
return;
}

if(!rule.test(password)){
  setMessage("Please Use Strong Password");
  return;
}
setLoading(true)
try{

const formData = new FormData();

formData.append("name",name);

if(password){
formData.append("password",password);
}
if(confirmPassword){
  formData.append("confirmPassword",confirmPassword)
}
const Max_Size=5*1024*1024;

if(profile){
  if(profile.size>Max_Size){
  return setMessage("Profile is Large Max(5MB");
}
formData.append("profile",profile);
}

const res = await api.put("/api/update_buyer_profile", formData);

if(res.data.success){
setMessage("Profile updated successfully");
setMessage({ text: "Profile updated successfully", type: "success" });
setTimeout(() => navigate("/buyer_dashboard"), 2000);

}

}catch(err){
console.log(err);
setMessage("Update failed");
} finally{
    setLoading(false)
}

};

const getFileUrl = (path)=>{

if(!path) return "/placeholder.png";

return path.startsWith("http") || path.startsWith("blob:")
? path
: `https://api.isongamarket.com/uploads/${path}`;

};

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
accept="image/*"
/>

</div>

<form className="profile-form" onSubmit={handleUpdate}>

<div className="form-group">

<label>Name</label>

<input
type="text"
placeholder="Enter Name"
value={name}
onChange={(e)=>setName(e.target.value)}
required
/>

</div>

<div className="form-group">

<label>New Password</label>
<div className="input-wrapper">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Enter new password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    name="password"
  />
  <span className="eye-icon" onClick={togglePassword}>
    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
  </span>
</div>
</div>
<div className="form-group">
<label>Confirm Password</label>
<div className="input-wrapper">
<input
type={showPassword ? "text":"password"}
placeholder="Confirm password"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
name="confirmPassword"
/>
<span className="eye-icon" onClick={togglePassword}>
  <FontAwesomeIcon icon={showPassword ? faEyeSlash:faEye}/>
</span>
</div>
</div>
<button className="save-btn">
Update Profile
</button>

</form>

{message && (
              <div className={`buyer-modern-alert ${message.type}`}>
                {message.text}
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