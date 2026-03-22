import { Link,useNavigate } from "react-router-dom";
import "./Buyer_Login.css";
import { useState } from "react";
import axios from "axios";
function Buyer_Login(){
     const[email,setEmail]=useState("");
     const [loading,setLoading]=useState(false);
    const[password,setPassword]=useState("");
    const[message,setMessage]=useState("");
    const navigate=useNavigate();

    const handleSubmit=async(e)=>{
        e.preventDefault();
       setLoading(true);
        try {
            const res=await axios.post("https://isonga-backend.onrender.com/api/buyer_login",{
                email,
                password
            },
            {withCredentials:true}
        )

        setMessage({
      text: res.data.message,
      type: res.data.success ? "success" : "error",
    });
        if(res.data.success){
             setTimeout(() => {
        navigate("/buyer_dashboard");
      }, 1000); 
        }
        } catch (error) {
            console.log(error.response?.data);
 setMessage({
      text: "Login failed. Please try again.",
      type: "error",
    });
        } finally{
            setLoading(false);
        }
    } 
    return(
        <div className="Buyer_Login">
            <div className="Buyer_Login_navbar">
                <div className="Buyer_Login_navbar">
                    <img src="/logo.png"/>
                </div>
                <div className="Buyer_Login_heads">
                    <h1>Isonga</h1>
                    <h2>Markert</h2>
                </div>
            </div>
             <div className="Buyer_Login_Container">
                <div className="Buyer_Login_Hero">
    <h1>Welcome Back to Isonga Market</h1>
    <p>
        Continue exploring quality products and trusted stores.
        Sign in now and enjoy a smarter, faster, and more convenient
        shopping experience.
    </p>

    <ul>
        <li> Discover products near you</li>
        <li> Save your favorite items</li>
        <li> Shop with confidence</li>
    </ul>
</div>

                <form onSubmit={handleSubmit}>
                <div className="Buyer_Login_form">
                    <h2>Buyer Login</h2>
                    <label htmlFor="email">Email</label><br/>
                    <input type="email" name="email" className="buyer_login"
                    placeholder="Enter Email" onChange={(e)=>setEmail(e.target.value)} required/><br/>
                    <label htmlFor="password">Password</label><br/>
                    <input type="password" name="password" className="buyer_login"
                    placeholder="Enter Password" onChange={(e)=>setPassword(e.target.value)} required/><br/>
                    <div className="Buyer_Login_btn">
                        <button type="submit" disabled={loading}
                        >{loading ? "Login...":"Login"}</button>
                    </div>
                    <div className="Buyer_Login_links">
                        <Link to="/buyer_register">Register</Link>
                        <Link to="/">Home</Link>
                    </div>
                </div>
 {message && (
  <div className={`alert ${message.type}`}>
    <span className="alert-icon">
      {message.type === "success" ? "✓" : "⚠"}
    </span>
    <span>{message.text}</span>
  </div>
)}
            </form>
             </div>
        </div>
    )
}

export default Buyer_Login;