
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faCartShopping
} from "@fortawesome/free-solid-svg-icons";

import ChatNotification from "./ChatNotification";
import "./Buyer_Dashboard.css";

function Buyer_Dashboard() {

const navigate = useNavigate();

const [buyerName,setBuyerName]=useState("");
const [profile,setProfile]=useState("");
const [sellers,setSellers]=useState([]);
const [filteredSellers,setFilteredSellers]=useState([]);
const [currentImageIndex,setCurrentImageIndex]=useState({});
const [selectedMedia,setSelectedMedia]=useState(null);
const [searchQuery,setSearchQuery]=useState("");
const [buyerId,setBuyerId]=useState("");
const [cartCount,setCartCount]=useState(0);
const [message,setMessage]=useState("");
const [loading, setLoading] = useState(true);
//////////////////////////////////////////////////
// CATEGORY CLASSIFICATION
//////////////////////////////////////////////////

const productCategories=["Fashion","Electronics","Furniture","Construction"];
const serviceCategories=["services","Hospitality"];
const assetCategories=["RealEstate","Vehicles","Agriculture"];

const getSellerRoute=(category,id)=>{

if(productCategories.includes(category)){
return `/view_products/${id}`;
}

if(serviceCategories.includes(category)){
return `/Service_Products/${id}`;
}

if(assetCategories.includes(category)){
return `/Asset_products/${id}`;
}

return `/view_products/${id}`;
};



//////////////////////////////////////////////////
// FETCH CART COUNT
//////////////////////////////////////////////////

const fetchCartCount=async()=>{
try{

const res=await axios.get(
"https://isonga-backend.onrender.com/api/cart/count",
{withCredentials:true}
);

if(res.data.success){
setCartCount(res.data.count);
}

}catch(err){
console.log(err);
}
};

useEffect(()=>{
fetchCartCount();
},[]);



//////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////

const handleLogout=async()=>{

try{

const res=await axios.post(
"https://isonga-backend.onrender.com/api/logout",
{},
{withCredentials:true}
);

if(res.data.success){
navigate("/buyer_login");
}

}catch(err){
console.log(err);
}

};



//////////////////////////////////////////////////
// STAR RENDER
//////////////////////////////////////////////////

const renderStars=(avg=0)=>{

const stars=[];

for(let i=1;i<=5;i++){

if(avg>=i){
stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gold"/>);
}

else if(avg>=i-0.5){
stars.push(
<FontAwesomeIcon
key={i}
icon={faStar}
color="gold"
style={{clipPath:"inset(0 50% 0 0)"}}
/>
);
}

else{
stars.push(<FontAwesomeIcon key={i} icon={faStar} color="gray"/>);
}

}

return stars;
};



//////////////////////////////////////////////////
// FETCH DASHBOARD DATA
//////////////////////////////////////////////////

useEffect(()=>{

const fetchData=async()=>{
setLoading(true);
try{

const res=await axios.get(
"https://isonga-backend.onrender.com/api/buyer_dashboard",
{withCredentials:true}
);

if(!res.data.success){
navigate("/buyer_login");
return;
}

const buyer=res.data.buyer;

setBuyerName(buyer.name);
setProfile(buyer.profile);
setBuyerId(buyer._id);


const sellersWithRatings=res.data.sellers.map(s=>({
...s,
averageRating:s.averageRating || 0,
numReviews:s.numReviews || 0
}));

setSellers(sellersWithRatings);
setFilteredSellers(sellersWithRatings);


const indexes={};

sellersWithRatings.forEach(s=>{
indexes[s._id]=0;
});

setCurrentImageIndex(indexes);

}catch(err){
console.log(err);
} finally{
  setLoading(false);
}

};

fetchData();

},[navigate]);



//////////////////////////////////////////////////
// SEARCH FILTER
//////////////////////////////////////////////////

useEffect(()=>{

if(!searchQuery.trim()){
setFilteredSellers(sellers);
return;
}

const q=searchQuery.toLowerCase();

setFilteredSellers(

sellers.filter(s=>

(s.name && s.name.toLowerCase().includes(q)) ||
(s.category && s.category.toLowerCase().includes(q)) ||
(s.location && s.location.toLowerCase().includes(q)) ||
(s.description && s.description.toLowerCase().includes(q))

)

);

},[searchQuery,sellers]);



//////////////////////////////////////////////////
// SLIDER
//////////////////////////////////////////////////

const handleNext=(sellerId,total)=>{
setCurrentImageIndex(prev=>({
...prev,
[sellerId]:(prev[sellerId]+1)%total
}));
};

const handlePrev=(sellerId,total)=>{
setCurrentImageIndex(prev=>({
...prev,
[sellerId]:(prev[sellerId]-1+total)%total
}));
};



//////////////////////////////////////////////////
// FILE TYPE DETECTION
//////////////////////////////////////////////////

const isVideoFile=(filename)=>/\.(mp4|webm|ogg|mov)$/i.test(filename);

  const getFileUrl = (path) => {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http")) return path;
  return `https://isonga-backend.onrender.com/uploads/${path}`;
};

if (loading) {
  return (
    <div className="beautiful-loading">
      <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-3xl border border-white/30 shadow-2xl">
        <div className="loader-dots flex space-x-2 justify-center mb-4">
           <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
           <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
           <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
        <h2 className="text-white font-bold text-xl tracking-widest">ISONGA MARKET</h2>
        <p className="text-white/80 text-sm">Preparing your dashboard...</p>
      </div>
    </div>
  );
}
return(

<div className="Buyer_Dashboard">


{/* NAVBAR */}

<div className="Buyer_Dashboard_navbar">

<div className="Buyer_Dashboard_logos">
<img src="/logo.png" alt="Logo"/>
</div>

<div className="Buyer_Dashboard_heads">
<h1>Isonga</h1>
<h2>Market</h2>
</div>

<div className="Buyer_Dashboard_user">

<Link to="/buyer_profile">
<img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="profile"/>
</Link>

<ChatNotification/>

</div>


<div className="Buyer_Dashboard_nav">

<nav>
<ul>

<li><Link to="/fashion">Products</Link></li>
<li><Link to="/services">Services</Link></li>
<li><Link to="/RealEstate">Assets</Link></li>

</ul>
</nav>

</div>



<Link to="/cart" style={{position:"relative"}}>

<FontAwesomeIcon icon={faCartShopping} size="2x"/>

{cartCount>0 &&(

<span
style={{
position:"absolute",
top:"-5px",
right:"-5px",
background:"red",
color:"white",
borderRadius:"50%",
padding:"2px 6px",
fontSize:"12px",
fontWeight:"bold"
}}
>
{cartCount}
</span>

)}

</Link>


<div className="Buyer_Dashboard_Logout">
<button onClick={handleLogout}>Logout</button>
</div>

</div>



{/* HEADING */}

<div className="Buyer_Dashboard_Heading">

<h1>Welcome back, {buyerName}! 🛍️</h1>
<p>Browse shops and enjoy secure shopping.</p>

</div>



{/* SEARCH */}

<div className="Buyer_Dashboard_search">

<input
type="text"
placeholder="Search sellers by name, category, location..."
value={searchQuery}
onChange={(e)=>setSearchQuery(e.target.value)}
/>

<button>
<FontAwesomeIcon icon={faSearch}/>
</button>

</div>



{/* SELLERS */}

<div className="shop-grid">
{filteredSellers.length > 0 ? (

  filteredSellers.map((seller) => (
    <div key={seller._id} className="shop-card">
<div className="card-image-section">

{seller.files && seller.files.length > 0 ? (
  <div className="image-slider">
    {isVideoFile(seller.files[currentImageIndex[seller._id] || 0]) ? (
      <video
        src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
        controls
        className="slider-image"
        onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
      />
    ) : (
      <img
        src={getFileUrl(seller.files[currentImageIndex[seller._id] || 0])}
        alt={seller.name}
        className="slider-image"
        onClick={() => setSelectedMedia(seller.files[currentImageIndex[seller._id] || 0])}
      />
    )}

    <div className="slider-controls">
      <FontAwesomeIcon
  icon={faChevronLeft}
  className="slider-icon"
  onClick={(e) => {
    e.stopPropagation();   // ✅ STOP redirect
    handlePrev(seller._id, seller.files.length);
  }}
/>

<FontAwesomeIcon
  icon={faChevronRight}
  className="slider-icon"
  onClick={(e) => {
    e.stopPropagation();   // ✅ STOP redirect
    handleNext(seller._id, seller.files.length);
  }}
/>
    </div>
  </div>
) : (
  <img src="/placeholder.png" alt="no image" className="slider-image" />
)}

<Link to={`/view_profile/${seller._id}`} className="profile-avatar">

<img
src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"}
alt={seller.name}
className="avatar-image"
/>

</Link>

</div>



<div className="shop-card-info">

<h3>{seller.name} Shop</h3>

<p>{seller.location}</p>

<p>{seller.category} Shop</p>

<div className="rating">

{renderStars(seller.averageRating)}
<span>({seller.numReviews})</span>

</div>

<p>{seller.description}</p>

<div className="card-actions">
                  <Link to={getSellerRoute(seller.category, seller._id)}><button className="visit-btn">Visit</button></Link>
                  <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat</button></Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-sellers-msg">No sellers found</p>
        )}
      </div>

{/* MEDIA MODAL */}

{selectedMedia && (

<div className="media-modal" onClick={()=>setSelectedMedia(null)}>

<span className="close-btn">&times;</span>

{isVideoFile(selectedMedia) ? (

<video src={getFileUrl(selectedMedia)} controls autoPlay/>

) : (

<img src={getFileUrl(selectedMedia)} alt="preview"/>

)}

</div>

)}

{message && (
  <div className={`alert ${message.type}`}>
    <span className="alert-icon">
      {message.type === "success" ? "✓" : "⚠"}
    </span>
    <span>{message.text}</span>
  </div>
)}
{/* FOOTER SECTION */}
<footer className="Buyer_Footer">
  <div className="Footer_Container">
    
    {/* Brand Section */}
    <div className="Footer_Section">
      <div className="Footer_Logo">
        <img src="/logo.png" alt="Isonga Logo"/>
        <h3>Isonga Market</h3>
      </div>
      <p>The leading digital marketplace in Rwanda. Connecting local sellers with happy buyers.</p>
      <div className="Social_Icons">
        {/* Add your social links here */}
      </div>
    </div>

    {/* Quick Links */}
    <div className="Footer_Section">
      <h4>Quick Links</h4>
      <ul>
        <li><Link to="/fashion">All Products</Link></li>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/RealEstate">Assets</Link></li>
        <li><Link to="/cart">My Cart</Link></li>
      </ul>
    </div>

    {/* Support */}
    <div className="Footer_Section">
      <h4>Support</h4>
      <ul>
        <li><Link to="/help">Help Center</Link></li>
        <li><Link to="/terms">Terms & Conditions</Link></li>
        <li><Link to="/privacy">Privacy Policy</Link></li>
      </ul>
    </div>

    {/* Payment & Trust Section (CRUCIAL) */}
    <div className="Footer_Section">
      <h4>Secure Payments</h4>
      <p>We support local payment methods:</p>
      <div className="Payment_Methods">
        {/* Replace these with your MoMo/Airtel logos */}
        <span className="Payment_Badge momo">MTN MoMo</span>
        <span className="Payment_Badge airtel">Airtel Money</span>
      </div>
      <p className="Secure_Note">🔒 SSL Secure Transactions</p>
    </div>

  </div>

  <div className="Footer_Bottom">
    <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved.</p>
    <p>Designed for Rwanda 🇷🇼</p>
  </div>
</footer>
</div>
);
}

export default Buyer_Dashboard;