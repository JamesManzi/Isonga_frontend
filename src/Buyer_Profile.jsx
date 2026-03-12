import { useState,useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./Buyer_Profile.css";
function Buyer_Profile(){
    const [buyer,setBuyer]=useState([]);
    const[message,setMessage]=useState("");
    useEffect(()=>{
        const fetchBuyer=async()=>{
            try {
                const res=await axios.get("https://isonga-backend.onrender.com/api/buyer_profile",{
                    withCredentials:true
                })

                setMessage(res.data.message);
                if(res.data.success){
                    setBuyer(res.data.buyer);
                }
            } catch (error) {
                console.log(error);
                setMessage("Fetch Buyer Error");
            }
        }
        fetchBuyer();
    },[]);
    if(!buyer){
        return <p>Loading.....</p>
    }
    return(
        <div className="Buyer_Profile">
            <div className="Buyer_Profile_navbar">
                <div className="Buyer_Profile_Logos">
                    <img src="/logo.png"/>
                </div>
                <div className="Buyer_Profile_headings">
                    <h1>Isonga</h1>
                    <h2>Markert</h2>
                </div>
                <div className="Buyer_Profile_Logout">
                    <Link to="/buyer_dashboard">
                    <FontAwesomeIcon icon={faArrowRight}/>
                    </Link>
                </div>
            </div>

            <div className="buyer_profile">
                {buyer.profile&&(
                    <img
                    src={`https://isonga-backend.onrender.com/uploads/${buyer.profile}`}
                    />
                )}
                <p>{buyer.name}</p>
            </div>
            <div className="other_buyer_info">
                <p>{buyer.email}</p>
            </div>
            {message&&(
                <p>{message}</p>
            )}
        </div>
    )
}

export default Buyer_Profile;