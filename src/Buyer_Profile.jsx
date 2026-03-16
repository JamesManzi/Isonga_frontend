import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Buyer_Profile.css";

function Buyer_Profile() {

const [buyer,setBuyer] = useState(null);
const [name,setName] = useState("");
const [email,setEmail] = useState("");
const [profile,setProfile] = useState(null);
const [preview,setPreview] = useState("");
const [message,setMessage] = useState("");

useEffect(()=>{

const fetchBuyer = async()=>{

try{

const res = await axios.get(
"https://isonga-backend.onrender.com/api/buyer_profile",
{withCredentials:true}
);

if(res.data.success){

const b = res.data.buyer;

setBuyer(b);
setName(b.name);
setEmail(b.email);
setPreview(b.profile);

}

}catch(err){
console.log(err);
}

};

fetchBuyer();

},[]);



const handleImageChange = (e)=>{

const file = e.target.files[0];

if(file){

setProfile(file);
setPreview(URL.createObjectURL(file));

}

};



const handleUpdate = async(e)=>{

e.preventDefault();

try{

const formData = new FormData();

formData.append("name",name);
formData.append("email",email);

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
}

};



const getFileUrl = (path)=>{

if(!path) return "/placeholder.png";

return path.startsWith("http")
? path
: `https://isonga-backend.onrender.com/uploads/${path}`;

};


if(!buyer){
return <p>Loading...</p>;
}



return(

<div className="profile-page">

{/* HEADER */}

<div className="profile-header">

<Link to="/buyer_dashboard" className="back-btn">
← Back
</Link>

<h1>My Profile</h1>

</div>



{/* PROFILE CARD */}

<div className="profile-card">

<div className="profile-image-section">

<img
src={preview ? getFileUrl(preview) : "/placeholder.png"}
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

<label>Email</label>

<input
type="email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
/>

</div>


<button className="save-btn">
Save Changes
</button>

</form>


{message && <p className="profile-message">{message}</p>}

</div>

</div>

);

}

export default Buyer_Profile;