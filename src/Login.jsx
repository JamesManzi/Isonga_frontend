import { Link,useNavigate } from "react-router-dom";
import "./Login.css";
import { useState } from "react";
import axios from "axios";
function Login(){
    const[email,setEmail]=useState("");
    const[password,setPassword]=useState("");
    const[message,setMessage]=useState("");
    const navigate=useNavigate();

    const handleSubmit=async(e)=>{
        e.preventDefault();

        try {
            const res=await axios.post("http://localhost:8000/api/login",{
                email,
                password
            },
            {withCredentials:true}
        )

        setMessage(res.data.message);
        if(res.data.success){
            navigate("/dashboard");
        }
        } catch (error) {
            console.log(error);
            setMessage("Login Error")
        }
    }
    return(
        <div className="Login">
            <div className="Login_navbar">
                <div className="Login_logo">
                    <img src="/logo.png"/>
                </div>
                <div className="Login_heads">
                    <h1>Isonga</h1>
                    <h2>Markert</h2>
                </div>
            </div>
            <div className="Login_Container">
                <div className="Login_Hero">
    <h1>Welcome Back to Isonga Market</h1>
    <p>
        Your business journey continues here. 
        Manage your inventory, respond to customers,
        and track your performance — all in one place.
    </p>
</div>
                <form onSubmit={handleSubmit}>
                <div className="Login_form">
                    <h2>Seller Login</h2>
                    <label htmlFor="email">Email</label><br/>
                    <input type="email" name="email" className="login"
                    placeholder="Enter Email" onChange={(e)=>setEmail(e.target.value)} required/><br/>
                    <label htmlFor="password">Password</label><br/>
                    <input type="password" name="password" className="login"
                    placeholder="Enter Password" onChange={(e)=>setPassword(e.target.value)} required/><br/>
                    <div className="Login_btn">
                        <button type="submit">Login</button>
                    </div>
                    <div className="Login_links">
                        <Link to="/register">Register</Link>
                        <Link to="/">Home</Link>
                    </div>
                </div>
                {message&&(
                    <p className="error">{message}</p>
                )}
            </form>
            </div>
        </div>
    )
}

export default Login;