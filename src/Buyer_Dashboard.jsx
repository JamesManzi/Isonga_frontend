import { socket } from "./socket";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faCartShopping,
  faBell
} from "@fortawesome/free-solid-svg-icons";

import ChatNotification from "./ChatNotification";
import "./Buyer_Dashboard.css";
import { createPortal } from "react-dom";
function Buyer_Dashboard() {

const navigate = useNavigate();

const [buyerName,setBuyerName]=useState("");
const [profile,setProfile]=useState("");
const [sellers,setSellers]=useState([]);
const [filteredSellers,setFilteredSellers]=useState([]);
const [currentImageIndex,setCurrentImageIndex]=useState({});
const [searchQuery,setSearchQuery]=useState("");
const [buyerId,setBuyerId]=useState("");
const [cartCount,setCartCount]=useState(0);
const [message,setMessage]=useState("");
const [loading, setLoading] = useState(true);
const [unreadNotifCount, setUnreadNotifCount] = useState(0);
// State for Media Zoom Modal (Matches My_Store style)
const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });

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

const fetchCartCount = async () => {
  try {
    // No need for 'axios' or manual headers anymore!
    const res = await api.get("/api/cart/count"); 
    if (res.data.success) {
      setCartCount(res.data.count);
    }
  } catch (err) {
    console.error("Cart count error:", err);
  }
};

useEffect(()=>{
fetchCartCount();
},[]);

const handleLogout = async () => {
  try {
    const res = await api.post("/api/logout"); // Simplified
    if (res.data.success) {
      localStorage.removeItem("token");
      navigate("/buyer_login");
    }
  } catch (err) {
    console.error("Logout error:", err);
    // Even if the server call fails, we should clear the token locally
    localStorage.removeItem("token");
    navigate("/buyer_login");
  }
};

const fetchNotificationCount = async () => {
  try {
    const res = await api.get("/api/notifications/unread-count");
    if (res.data.success) {
      setUnreadNotifCount(res.data.count);
    }
  } catch (err) {
    console.error("Notification count error:", err);
  }
};

useEffect(() => {
  fetchCartCount();
  fetchNotificationCount(); // New call
}, []); 
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

useEffect(() => {
  // Use 'socket' only if it exists in the scope
  const currentSocket = typeof socket !== 'undefined' ? socket : null;

  if (currentSocket) {
    if (!currentSocket.connected) {
      currentSocket.connect();
    }

    const handler = (data) => {
      setUnreadNotifCount(data.unreadCount);
      setMessage({ type: "success", text: data.message });
      setTimeout(() => setMessage(""), 5000);
    };

    currentSocket.on("new_notification", handler);

    return () => {
      currentSocket.off("new_notification", handler);
    };
  } else {
    console.error("Critical Error: 'socket' is not defined in Buyer_Dashboard. Check your import path!");
  }
}, []);

useEffect(()=>{
const fetchData=async()=>{
setLoading(true);
try{
  const token = localStorage.getItem("token");
        if (!token) {
        navigate("/buyer_login");
        return;
      }
const res = await api.get("/api/buyer_dashboard");
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


useEffect(() => {
  const interval = setInterval(() => {
    setCurrentImageIndex((prev) => {
      const newIndexes = { ...prev };
      filteredSellers.forEach((seller) => {
        if (seller.files && seller.files.length > 1) {
          const currentIndex = prev[seller._id] || 0;
          newIndexes[seller._id] = (currentIndex + 1) % seller.files.length;
        }
      });
      return newIndexes;
    });
  }, 5000);
  return () => clearInterval(interval);
}, [filteredSellers]);

const isVideoFile=(filename)=>/\.(mp4|webm|ogg|mov)$/i.test(filename);

const getFileUrl = (path) => {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http")) return path;
  return `https://isonga-backend.onrender.com/uploads/${path}`;
};
// Hide navbar when modal opens or on scroll
useEffect(() => {
  const navbar = document.querySelector(".Buyer_Dashboard_navbar");
  if (!navbar) return; // Safety check

  // Modal opens → hide navbar
  if (modalMedia.sellerId) {
    navbar.style.transform = "translateY(-100%)";
  } else {
    navbar.style.transform = "translateY(0)";
  }
}, [modalMedia]);

useEffect(() => {
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const navbar = document.querySelector(".Buyer_Dashboard_navbar");
    if (!navbar) return; // Safety check

    if (window.scrollY > lastScrollY) {
      // scrolling down
      navbar.style.transform = "translateY(-100%)";
    } else {
      // scrolling up
      navbar.style.transform = "translateY(0)";
    }

    lastScrollY = window.scrollY;
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, []);
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

<div className="Buyer_Dashboard_navbar">
<div className="Buyer_Dashboard_logos"><img src="/logo.png" alt="Logo"/></div>
<div className="Buyer_Dashboard_heads"><h1>Isonga</h1><h2>Market</h2></div>
<div className="Buyer_Dashboard_user">
<Link to="/buyer_profile"><img src={profile ? getFileUrl(profile) : "/placeholder.png"} alt="profile"/></Link>
<ChatNotification/>
</div>
<div className="Buyer_Dashboard_nav">
<nav><ul><li><Link to="/fashion">Products</Link></li><li><Link to="/services">Services</Link></li><li><Link to="/RealEstate">Assets</Link></li></ul></nav>
</div>
{/* Notification Bell */}
<Link to="/notifications" className="nav-icon-link">
  <FontAwesomeIcon icon={faBell} size="2x" />
  {unreadNotifCount > 0 && (
    <span className="notification-badge">{unreadNotifCount}</span>
  )}
</Link>
<Link to="/cart" style={{position:"relative"}}>
<FontAwesomeIcon icon={faCartShopping} size="2x"/>
{cartCount>0 &&(
<span style={{position:"absolute",top:"-5px",right:"-5px",background:"red",color:"white",borderRadius:"50%",padding:"2px 6px",fontSize:"12px",fontWeight:"bold"}}>{cartCount}</span>
)}
</Link>
<div className="Buyer_Dashboard_Logout"><button onClick={handleLogout}>Logout</button></div>
</div>

<div className="Buyer_Dashboard_Heading">
<h1>Welcome back, {buyerName}! 🛍️</h1>
<p>Browse shops and enjoy secure shopping.</p>
</div>

<div className="Buyer_Dashboard_search">
<input type="text" placeholder="Search sellers..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}/>
<button><FontAwesomeIcon icon={faSearch}/></button>
</div>

<div className="shop-grid">
{filteredSellers.length > 0 ? (
  filteredSellers.map((seller) => {
    const activeIdx = currentImageIndex[seller._id] || 0;
    return (
    <div key={seller._id} className="shop-card">
<div className="card-image-section">
{seller.files && seller.files.length > 0 ? (
  <div className="image-slider">
    {isVideoFile(seller.files[activeIdx]) ? (
      <video
        src={getFileUrl(seller.files[activeIdx])}
        muted autoPlay loop className="slider-image"
        onClick={(e) => { 
          e.stopPropagation(); 
          setModalMedia({ sellerId: seller._id, index: activeIdx }); 
        }}
      />
    ) : (
      <img
        src={getFileUrl(seller.files[activeIdx])}
        alt={seller.name} className="slider-image"
        onClick={(e) => { 
          e.stopPropagation(); 
          setModalMedia({ sellerId: seller._id, index: activeIdx }); 
        }}
      />
    )}
    {seller.files.length > 1 && (
      <div className="slider-dots">
        {seller.files.map((_, idx) => (
          <span key={idx} className={`dot ${idx === activeIdx ? "active" : ""}`}
            onClick={(e) => { 
              e.stopPropagation(); 
              setCurrentImageIndex(prev => ({...prev, [seller._id]: idx})); 
            }}
          ></span>
        ))}
      </div>
    )}
  </div>
) : (
  <img src="/placeholder.png" alt="no image" className="slider-image" />
)}
</div>
{/* Link is kept only on the small avatar icon area */}
<Link to={`/view_profile/${seller._id}`} className="profile-avatar">
  <img src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"} alt={seller.name} className="avatar-image"/>
</Link>

<div className="shop-card-info">
<h3>{seller.name} Shop</h3>
<p>{seller.location}</p>
<p>{seller.category} Shop</p>
<div className="rating">{renderStars(seller.averageRating)}<span>({seller.numReviews})</span></div>
<p>{seller.description}</p>
<div className="card-actions">
  <Link to={getSellerRoute(seller.category, seller._id)}><button className="visit-btn">Visit</button></Link>
  <Link to={`/buyer_chat/${seller._id}`}><button className="chat-btn">Chat</button></Link>
</div>
</div>
</div>
)})
) : (
<p className="no-sellers-msg">No sellers found</p>
)}
</div>
{modalMedia.sellerId &&
createPortal(
(() => {
  const seller = sellers.find(s => s._id === modalMedia.sellerId);
  if (!seller) return null;
  const file = seller.files[modalMedia.index];

  return (
    <div
      className="media-modal"
      onClick={() => setModalMedia({ sellerId: null, index: 0 })}
    >
      <span
        className="close-btn"
        onClick={() => setModalMedia({ sellerId: null, index: 0 })}
      >
        &times;
      </span>

      {isVideoFile(file) ? (
        <video
          src={getFileUrl(file)}
          controls
          autoPlay
          className="full-media"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={getFileUrl(file)}
          alt="Full view"
          className="full-media"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div className="modal-controls">
        <FontAwesomeIcon
          icon={faChevronLeft}
          className="modal-arrow"
          onClick={(e) => {
            e.stopPropagation();
            setModalMedia((p) => ({
              ...p,
              index:
                (p.index - 1 + seller.files.length) %
                seller.files.length,
            }));
          }}
        />

        <FontAwesomeIcon
          icon={faChevronRight}
          className="modal-arrow"
          onClick={(e) => {
            e.stopPropagation();
            setModalMedia((p) => ({
              ...p,
              index: (p.index + 1) % seller.files.length,
            }));
          }}
        />
      </div>
    </div>
  );
})(),
document.body
)}
{message && (
  <div className={`alert ${message.type}`}><span className="alert-icon">{message.type === "success" ? "✓" : "⚠"}</span><span>{message.text}</span></div>
)}

<footer className="Buyer_Footer">
  <div className="Footer_Container">
    <div className="Footer_Section">
      <div className="Footer_Logo"><img src="/logo.png" alt="Isonga Logo"/><h3>Isonga Market</h3></div>
      <p>The leading digital marketplace in Rwanda.</p>
    </div>
    <div className="Footer_Section">
      <h4>Quick Links</h4>
      <ul>
        <li><Link to="/fashion">All Products</Link></li>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/RealEstate">Assets</Link></li>
        <li><Link to="/cart">My Cart</Link></li>
      </ul>
    </div>
    <div className="Footer_Section">
      <h4>Support</h4>
      <ul>
        <li><Link to="/help">Help Center</Link></li>
        <li><Link to="/terms">Terms</Link></li>
        <li><Link to="/privacy">Privacy Policy</Link></li>
      </ul>
    </div>
    <div className="Footer_Section">
      <h4>Secure Payments</h4>
      <div className="Payment_Methods">
        <span className="Payment_Badge momo">MTN MoMo</span>
        <span className="Payment_Badge airtel">Airtel Money</span>
      </div>
      <p className="Secure_Note">🔒 SSL Secure Transactions</p>
    </div>
  </div>
  <div className="Footer_Bottom"><p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved. Designed for Rwanda 🇷🇼</p></div>
</footer>
</div>
);
}

export default Buyer_Dashboard;