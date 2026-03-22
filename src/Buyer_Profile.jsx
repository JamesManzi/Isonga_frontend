import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "./Buyer_Profile.css";
function Buyer_Profile() {

const [buyer,setBuyer] = useState(null);

const [name,setName] = useState("");
const [password,setPassword] = useState("");
const [confirmPassword,setConfirmPassword] = useState("");
const [loading,setLoading]=useState(false);
const [profile,setProfile] = useState(null);
const [preview,setPreview] = useState("");

const [message,setMessage] = useState("");

//////////////////////////////////////////////////
// FETCH BUYER
//////////////////////////////////////////////////

useEffect(()=>{

const fetchBuyer = async()=>{
setLoading(true)
try{

const res = await axios.get(
"https://isonga-backend.onrender.com/api/buyer_profile",
{withCredentials:true}
);

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

const res = await axios.put(
"https://isonga-backend.onrender.com/api/update_buyer_profile",
formData,
{
withCredentials:true,
headers:{ "Content-Type":"multipart/form-data" }
}
);

if(res.data.success){
setMessage("Profile updated successfully");
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

return path.startsWith("http")
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
src={
profile
? preview
: buyer?.profile
? getFileUrl(buyer.profile)
: "/placeholder.png"
}
alt="profile"
className="profile-image"
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
  <div className={`alert ${message.type}`}>
    <span className="alert-icon">
      {message.type === "success" ? "✓" : "⚠"}
    </span>
    <span>{message.text}</span>
  </div>
)}

</div>

</div>

);

}

export default Buyer_Profile;