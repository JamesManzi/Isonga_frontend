import { Link,useNavigate } from "react-router-dom";
import "./Register.css";
import axios from "axios";
import { useState,useRef } from "react";
function Register(){
    const [sellerType, setSellerType] = useState("");
    const fileInputRef = useRef(null);
    const [loading,setLoading]=useState(false);
    const[name,setName]=useState("");
    const cleanName = name.trim();
    const[profile,setProfile]=useState(null);
    const[previewProfile,setPreviewProfile]=useState(null);
    const[location,setLocation]=useState("");
    const[description,setDescription]=useState("");
    const[phone,setPhone]=useState("");
    const[email,setEmail]=useState("");
    const[password,setPassword]=useState("");
    const[repeat_pass,setRepeat_Pass]=useState("");
    const[files,setFiles]=useState([]);
    const[previewFiles,setPreviewFiles]=useState([]);
    const[message,setMessage]=useState("");
    const[category,setCategory]=useState("");
    const navigate=useNavigate();
    const phoneRule = /^07\d{8}$/;
    const rule = /^(?=.{10,})(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;
    const handleSubmit=async(e)=>{
        e.preventDefault();
        const formData=new FormData();
        formData.append("name", cleanName);
        formData.append("location",location.trim());
        formData.append("phone",phone);
        formData.append("email",email.trim());
        formData.append("password",password);
        formData.append("repeat_pass",repeat_pass);
        formData.append("description",description.trim());
        formData.append("category",category);
        formData.append("sellerType", sellerType);

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

        for (let file of files) {
  if (file.size > 10 * 1024 * 1024) {
    alert("Each image must be under 10MB");
    return;
  }
}

        if(files.length<2){
            alert("Please Upload Atleast Two Location Images");
            return;
        } else{
            files.forEach((file)=>{
            formData.append("files",file);
        })
        }


        if(files.length > 6){
  alert("Maximum 6 images allowed");
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

if(!phoneRule.test(phone)){
  alert("Enter a valid phone number");
  return;
}
setLoading(true);
        try {
            const res=await axios.post("https://isonga-backend.onrender.com/api/register",formData,{
                withCredentials:true
            })
            if (res.data.success) {
  setMessage("Registration successful! Please check your email to verify your account.");
} else {
  setMessage(res.data.message);
}
            if(res.data.success){
                setTimeout(() => {
            navigate("/login");
        }, 6000);
            }
        } catch (error) {
  console.log(error);

  if (error.response && error.response.data) {
    setMessage(error.response.data.message || "Registration failed");
  } else {
    setMessage("Network error. Please try again.");
  }
}finally{
            setLoading(false);
        }
};
const removeImage = (index) => {
  setFiles(files.filter((_, i) => i !== index));
  setPreviewFiles(previewFiles.filter((_, i) => i !== index));
    }
    return(
        <div className="Register">
            <div className="Register_navbar">
                <div className="Register_logo">
                    <img src="/logo.png"/>
                </div>
                <div className="Register_Text">
                    <h1>Isonga</h1>
                    <h2>Markert</h2>
                </div>
            </div>
            
            <div className="Register_Container">
                <div className="Register_Hero">
    <h1>Grow Your Business With Isonga Market</h1>
    <p>
        Reach thousands of buyers, increase your sales,
        and manage your products easily in one powerful platform.
    </p>
</div>
                <form onSubmit={handleSubmit}>
                    <h2> Seller Register</h2>
                <label htmlFor="profile">Profile</label><br/>
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
                <label htmlFor="name">Shop Name</label><br/>
                <input type="text" name="name" className="register" placeholder="Enter Shop Name"
                onChange={(e)=>setName(e.target.value)} required/><br/>
                 <select 
  value={category} 
  name="category" 
  onChange={e => setCategory(e.target.value)} 
  required
>
  <option value="">-- Select Category --</option>
  <option value="Fashion">Fashion</option>
  <option value="RealEstate">RealEstate</option>
  <option value="Vehicles">Vehicles</option>
  <option value="Agriculture">Agriculture</option>
  <option value="services">services</option>
  <option value="Hospitality">Hospitality</option>
  <option value="Electronics">Electronics</option>
  <option value="Furniture">Furniture</option>
  <option value="Construction">Construction</option>
</select>
                <label htmlFor="location">Location</label><br/>
                <input type="text" name="location" className="register" 
                 placeholder="Enter Location"
                onChange={(e)=>setLocation(e.target.value)} required/><br/>
                <label htmlFor="number">Phone Number</label><br/>
                <input type="tel" name="phone" className="register" 
                 pattern="07[0-9]{8}"placeholder="Enter Phone Number"
                onChange={(e)=>setPhone(e.target.value)} required/><br/>
                <label htmlFor="email">Email</label><br/>
                <input type="email" name="email" className="register" placeholder="Enter Email"
                onChange={(e)=>setEmail(e.target.value)} required/><br/>
                <label htmlFor="password">Password</label><br/>
                <small>
Password must be at least 10 characters and contain 3 of these:
uppercase, lowercase, number, special character.
</small>
                <input type="password" name="password" className="register" placeholder="Enter Password"
                onChange={(e)=>setPassword(e.target.value)} required/><br/>
                <label htmlFor="repeat">Repeat Password</label><br/>
                <input type="password" name="repeat_pass" className="register" placeholder="Repeat Password"
                onChange={(e)=>setRepeat_Pass(e.target.value)} required/><br/>
                <label htmlFor="sellerType">Seller Type</label><br/>
<select
  value={sellerType}  // <- Actually create a separate state for sellerType
  onChange={(e) => setSellerType(e.target.value)}
  required
>
  <option value="">-- Select Seller Type --</option>
  <option value="Product">Product</option>
  <option value="Service">Service</option>
  <option value="Asset">Asset</option>
</select><br/>
                <label htmlFor="description">Description</label><br/>
                <textarea name="description" placeholder="Describe Your Business"
                onChange={(e)=>setDescription(e.target.value)} required></textarea>
                <label htmlFor="images">Location Images</label><br/>
                <input type="file" name="files" accept="image/*" multiple
  onChange={(e)=>{
    const newFiles = Array.from(e.target.files);
    if(files.length + newFiles.length > 6){
      alert("Maximum 6 images allowed");
      return;
    }
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    const newImages = newFiles.map(file => URL.createObjectURL(file));
    setPreviewFiles(prev => [...prev, ...newImages]);
    e.target.value = null;
}}/>
                {previewFiles.map((img, index) => (
  <div key={index} className="image-preview">
    <img src={img} alt={`preview ${index}`} />
    <button type="button" onClick={() => removeImage(index)}>Remove</button>
  </div>
))}
                <div className="Register_btn">
                    <button type="submit" className="btn" disabled={loading}>
  {loading ? "Registering..." : "Register"}
</button>
                </div>
                <div className="Register_links">
                    <Link to="/">Home</Link>
                    <Link to="/login">Login</Link>
                </div>
               {message && (
  <div className={message.includes("check your email") ? "success-message" : "error-message"}>
    <p>{message}</p>

    {message.includes("check your email") && (
      <p style={{ marginTop: "10px", fontSize: "14px" }}>
        ⚠️ If you don’t see the email, check your spam folder.
      </p>
    )}
  </div>
)}
                </form>
                </div>
                </div>
    )
}
export default Register;