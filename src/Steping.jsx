import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faComments, faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { FiLogOut } from "react-icons/fi"; // Logout icon
import AOS from "aos";
import "aos/dist/aos.css";
import "./Steps.css";
import { Link } from "react-router-dom";
function Steping() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-in-out", once: true });
  }, []);

  const handleLogout = () => {
    console.log("Logout clicked");
    // Add your logout logic here
  };

  return (
    <div className="steps-wrapper">
      {/* Navbar with Logout */}
      <div className="steps-navbar">
        <h1 className="brand">Isonga Market</h1>
        <Link to="/buyer_dashboard">
        <FiLogOut
          size={28}
          className="logout-icon"
          title="Logout"
          onClick={handleLogout}
        />
        </Link>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works" id="how-it-works">
        <h2 data-aos="fade-up">How It Works</h2>
        <p className="subheading" data-aos="fade-up" data-aos-delay="100">
          Connecting buyers and sellers seamlessly
        </p>

        <div className="steps-container">
          <div className="step" data-aos="fade-up" data-aos-delay="200">
            <div className="step-icon browse">
              <FontAwesomeIcon icon={faSearch} size="2x" />
            </div>
            <h3>Browse Products</h3>
            <p>Search and explore shops to find exactly what you need.</p>
          </div>

          <div className="step" data-aos="fade-up" data-aos-delay="300">
            <div className="step-icon chat">
              <FontAwesomeIcon icon={faComments} size="2x" />
            </div>
            <h3>Contact Sellers</h3>
            <p>Chat directly with sellers for inquiries or negotiations.</p>
          </div>

          <div className="step" data-aos="fade-up" data-aos-delay="400">
            <div className="step-icon purchase">
              <FontAwesomeIcon icon={faCreditCard} size="2x" />
            </div>
            <h3>Purchase Securely</h3>
            <p>Make safe payments and get your products delivered quickly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Steping;