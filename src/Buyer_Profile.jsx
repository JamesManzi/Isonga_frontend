import { useState,useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./Buyer_Profile.css";

function Buyer_Profile(){

const [buyer,setBuyer]=useState(null);
const [name,setName]=useState("");
const [email,setEmail]=useState("");
const [profile,setProfile]=useState(null);
const [preview,setPreview]=useState("");
const [message,setMessage]=useState("");

//////////////////////////////////////////////////
// FETCH BUYER
//////////////////////////////////////////////////

useEffect(()=>{

const fetchBuyer=async()=>{

try{

const res=await axios.get(
"https://isonga-backend.onrender.com/api/buyer_profile",
{withCredentials:true}
);

if(res.data.success){

const b=res.data.buyer;

setBuyer(b);
setName(b.name);
setEmail(b.email);
setPreview(b.profile);

}

setMessage(res.data.message);

}catch(error){

console.log(error);
setMessage("Fetch Buyer Error");

}

};

fetchBuyer();

},[]);

//////////////////////////////////////////////////
// IMAGE PREVIEW
//////////////////////////////////////////////////

const handleImageChange=(e)=>{

const file=e.target.files[0];

if(file){

setProfile(file);
setPreview(URL.createObjectURL(file));

}

};

//////////////////////////////////////////////////
// UPDATE PROFILE
//////////////////////////////////////////////////

const handleUpdate=async(e)=>{

e.preventDefault();

try{

const formData=new FormData();

formData.append("name",name);
formData.append("email",email);

if(profile){
formData.append("profile",profile);
}

const res=await axios.put(
"https://isonga-backend.onrender.com/api/update_buyer_profile",
formData,
{
withCredentials:true,
headers:{
"Content-Type":"multipart/form-data"
}
}
);

if(res.data.success){

setMessage("Profile updated successfully");
setBuyer(res.data.buyer);

}

}catch(error){

console.log(error);
setMessage("Profile update failed");

}

};

//////////////////////////////////////////////////
// IMAGE URL
//////////////////////////////////////////////////

const getFileUrl=(path)=>{

if(!path) return "/placeholder.png";

return path.startsWith("http")
? path
: `https://isonga-backend.onrender.com/uploads/${path}`;

};

//////////////////////////////////////////////////
// LOADING
//////////////////////////////////////////////////

if(!buyer){
return <p>Loading...</p>;
}

//////////////////////////////////////////////////
// UI
//////////////////////////////////////////////////

return(

<div className="Buyer_Profile">

{/* NAVBAR */}

<div className="Buyer_Profile_navbar">

<div className="Buyer_Profile_Logos">
<img src="/logo.png" alt="logo"/>
</div>

<div className="Buyer_Profile_headings">
<h1>Isonga</h1>
<h2>Market</h2>
</div>

<div className="Buyer_Profile_Logout">

<Link to="/buyer_dashboard">
<FontAwesomeIcon icon={faArrowRight}/>
</Link>

</div>

</div>


{/* PROFILE FORM */}

<form className="buyer_profile" onSubmit={handleUpdate}>

<img
src={preview ? getFileUrl(preview) : "/placeholder.png"}
alt="profile"
/>

<input
type="file"
onChange={handleImageChange}
/>

<input
type="text"
value={name}
onChange={(e)=>setName(e.target.value)}
placeholder="Name"
/>

<input
type="email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
placeholder="Email"
/>

<button type="submit">
Update Profile
</button>

</form>


<div className="other_buyer_info">

<p>Email: {email}</p>

</div>


{message && (
<p className="message">{message}</p>
)}

</div>

);

}

export default Buyer_Profile;