import { useEffect, useState } from "react";
import axios from "axios";
import "./Cart.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

function Cart() {

const [cart,setCart] = useState(null);
const [loading,setLoading] = useState(true);
const[profile,setProfile]=useState("");
const navigate = useNavigate();

useEffect(()=>{
fetchCart();
},[]);

const fetchCart = async()=>{

try{

const res = await axios.get(
"http://localhost:8000/api/cart",
{withCredentials:true}
);

if(res.data.success){
setCart(res.data.cart);
setProfile(res.data.buyer.profile);
}

}catch(error){
console.log(error);
}

setLoading(false);
};

const removeItem = async(productId)=>{

await axios.delete(
`http://localhost:8000/api/cart/remove/${productId}`,
{withCredentials:true}
);

fetchCart();

};

const updateQuantity = async(productId,quantity)=>{

if(quantity < 1) return;

await axios.put(
"http://localhost:8000/api/cart/update",
{productId,quantity},
{withCredentials:true}
);

fetchCart();

};

const logout = async()=>{

await axios.post(
"http://localhost:8000/api/logout",
{},
{withCredentials:true}
);

navigate("/buyer_login");

};

if(loading) return <p>Loading cart...</p>;
if (!cart || cart.items.length === 0) {
  return (
    <div className="Cart_empty">
      <div className="Cart_nav-left">
        <button onClick={() => navigate(-1)} className="Cart_back-btn">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      </div>

      <h2>Your cart is empty</h2>
      <p>Start adding products to your cart.</p>
    </div>
  );
}
return(

<div className="cart-page">

{/* NAVBAR */}

<div className="cart-navbar">

<div className="nav-left">
<button onClick={()=>navigate(-1)} className="back-btn">
<FontAwesomeIcon icon={faArrowLeft}/>
</button>
</div>

<div className="nav-center">
<h2>Shopping Cart</h2>
</div>

<div className="nav-right">

<div className="Cart_profile">
<img src={profile ? `http://localhost:8000/uploads/${profile}` : "/placeholder.png"} alt="Profile" />
</div>

<button className="logout-btn" onClick={logout}>
<FontAwesomeIcon icon={faSignOutAlt}/> Logout
</button>

</div>

</div>


<h1 className="cart-title">Your Cart</h1>

<div className="cart-container">

{/* PRODUCTS */}

<div className="cart-products">

{cart.items.map(item=>(

<div className="cart-item" key={item.product._id}>

<img
src={`http://localhost:8000${item.product.files[0]}`}
className="cart-image"
/>

<div className="cart-info">

<h3>{item.product.name}</h3>

<p>{item.product.location}</p>

<p className="price">{item.price} Rwf</p>

<div className="quantity">

<button
onClick={()=>updateQuantity(
item.product._id,
item.quantity-1
)}
>-</button>

<span>{item.quantity}</span>

<button
onClick={()=>updateQuantity(
item.product._id,
item.quantity+1
)}
>+</button>

</div>

<button
className="remove"
onClick={()=>removeItem(item.product._id)}
>
Remove
</button>

</div>

<div className="subtotal">

{item.quantity * item.price} Rwf

</div>

</div>

))}

</div>


{/* SUMMARY */}

<div className="cart-summary">

<h2>Order Summary</h2>

<div className="summary-row">
<span>Subtotal</span>
<span>{cart.totalPrice} Rwf</span>
</div>

<div className="summary-row">
<span>Shipping</span>
<span>0 Rwf</span>
</div>

<hr/>

<div className="summary-total">
<span>Total</span>
<span>{cart.totalPrice} Rwf</span>
</div>

<button
className="checkout"
onClick={()=>navigate("/checkout")}
>
Proceed to Checkout
</button>

</div>

</div>

</div>

)

}

export default Cart;