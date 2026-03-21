import { Link,useNavigate } from "react-router-dom";
import { useState,useRef } from "react";
import axios from "axios";
import "./Buyer_Register.css";
function Buyer_Register(){
    const fileInputRef = useRef(null);
    const [loading,setLoading]=useState(false);
    const[name,setName]=useState("");
    const[profile,setProfile]=useState("");
    const[previewProfile,setPreviewProfile]=useState(null);
    const[email,setEmail]=useState("");
    const[password,setPassword]=useState("");
    const[repeat_pass,setRepeat_Pass]=useState("");
    const[message,setMessage]=useState("");
    const rule = /^(?=.{10,})(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;


     const navigate=useNavigate();
    const handleSubmit=async(e)=>{
        e.preventDefault();
        const formData=new FormData();
        formData.append("name",name.trim());
        formData.append("email",email.trim());
        formData.append("password",password);
        formData.append("repeat_pass",repeat_pass);

        if(!profile){
            alert("Please Upload Profile Picture");
            return;
        } else{
            formData.append("profile",profile)
        }

        if(profile.size > 5 * 1024 * 1024){
  alert("Profile image must be under 5MB");
  return;
}

         if(!rule.test(password)){
            alert(
      "Password must be at least 10 characters and include at least 3 of these: uppercase, lowercase, number, special character."
    );
    return;
        }
    if(password !== repeat_pass){
    alert("Passwords do not match");
    return;
}

       setLoading(true);
            try {
            const res=await axios.post("https://isonga-backend.onrender.com/api/buyer_register",formData,{
                withCredentials:true
            })
            setMessage(res.data.message);
            if(res.data.success){
                navigate("/buyer_login")
            }
         } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    
    // Check if the error came from the server response
    if (error.response && error.response.data) {
        setMessage(error.response.data.message || "Registration failed");
    } else {
        setMessage("Network error. Please check your connection.");
    }
} finally {
    setLoading(false);
}
    };
    return(
        <div className="Buyer_Register">
            <div className="Register_navbar">
                <div className="Register_logo">
                    <img src="/logo.png"/>
                </div>
                <div className="Register_Text">
                    <h1>Isonga</h1>
                    <h2>Markert</h2>
                </div>
            </div>
            <div className="Buyer_Register_Container">
                <div className="Buyer_Register_Hero">
    <h1>Welcome to the Future of Shopping</h1>
    <p>
        Isonga Market connects you with reliable sellers and
        quality products in one powerful platform.
        Sign up today and start exploring.
    </p>

    <ul>
        <li> Wide variety of categories</li>
        <li> Trusted sellers</li>
        <li> Fast and convenient experience</li>
    </ul>
</div>

                <form onSubmit={handleSubmit}>
                    <h2> Buyer Register</h2>
                <label htmlFor="buyer_profile">Profile</label><br/>
                <input type="file" 
                ref={fileInputRef}
                name="profile" 
                accept="image/*"
                onChange={(e)=>{
                    const file=e.target.files[0];
                    if(!file) return;
  if(file.size > 5 * 1024 * 1024){ // 5MB limit
    alert("Profile image must be under 5MB");
    return;
  }
                    setProfile(file);
                    setPreviewProfile(URL.createObjectURL(file))
                }}/><br/>
                {previewProfile && (
  <div className="profile-preview">
    <img src={previewProfile} alt="Profile Preview" />
    <button type="button" onClick={() => {
      setProfile(null);
      setPreviewProfile(null);
      if (fileInputRef.current) {
                        fileInputRef.current.value = ""; //  This clears the actual input!
                    }
    }}>Remove</button>
  </div>
)}
                <label htmlFor="name">Name</label><br/>
                <input type="text" name="name" className="buyer_register" placeholder="Enter Name"
                onChange={(e)=>setName(e.target.value)} required/><br/>
                <label htmlFor="email">Email</label><br/>
                <input type="email" name="email" className="buyer_register" placeholder="Enter Email"
                onChange={(e)=>setEmail(e.target.value)} required/><br/>
                <label htmlFor="password">Password</label><br/>
                <input type="password" name="password" className="buyer_register" placeholder="Enter Password"
                onChange={(e)=>setPassword(e.target.value)} required/><br/>
                <label htmlFor="repeat">Repeat Password</label><br/>
                <input type="password" name="repeat_pass" className="buyer_register" placeholder="Repeat Password"
                onChange={(e)=>setRepeat_Pass(e.target.value)} required/><br/>

                <div className="Buyer_Register_btn">
                    <button type="submit" className="Buyer_btn" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
                </div>
                <div className="Buyer_Register_links">
                    <Link to="/">Home</Link>
                    <Link to="/buyer_login">Login</Link>
                </div>
                {message&&(
                    <p className="error">{message}</p>
                )}
                </form>
                </div>
                </div>
    )
}

export default Buyer_Register;