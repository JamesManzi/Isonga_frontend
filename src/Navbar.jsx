import { Link } from "react-router-dom";
import ChatNotification from "./ChatNotification";

function Navbar() {

  return (
    <div className="navbar">

      <Link to="/buyer_dashboard">Home</Link>

      <Link to="/buyer_profile">Profile</Link>

      <ChatNotification />

    </div>
  );
}

export default Navbar;