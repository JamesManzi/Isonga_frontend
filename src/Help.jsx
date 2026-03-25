import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faQuestionCircle, 
  faEnvelope, 
  faPhone, 
  faHeadset, 
  faUserPlus, 
  faRightToBracket,
  faStore,
  faCartShopping
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import "./Help.css";

function Help() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-in-out", once: true });
  }, []);

  const faqs = [
    { 
      question: "How do I start selling?", 
      answer: "Click the 'Seller Sign Up' button, set up your shop profile, and start uploading your properties or products immediately." 
    },
    { 
      question: "Is there a fee for buyers?", 
      answer: "No, browsing and contacting sellers is completely free for all buyers on Isonga Market." 
    },
    { 
      question: "How do payments work?", 
      answer: "We integrate with MTN MoMo and Airtel Money to ensure fast and secure local transactions within Rwanda." 
    },
    { 
      question: "Can I trust the listings?", 
      answer: "We encourage users to review seller ratings and verify details through our built-in chat system before making payments." 
    }
  ];

  return (
    <div className="help-wrapper">
      {/* Clean Navbar: Brand + Login + 2 Signups */}
      <nav className="Landing_Navbar">
        <div className="Navbar_Brand">
          <img src="/logo.png" alt="Isonga Logo" />
          <div className="Brand_Text">
            <h1>Isonga</h1>
            <span>Market</span>
          </div>
        </div>
        
        <div className="Navbar_Auth_Group">
          <Link to="/buyer_login" className="login-link">
            <FontAwesomeIcon icon={faRightToBracket} /> Login
          </Link>
          <div className="Signup_Buttons">
            <Link to="/buyer_register" className="reg-btn buyer">
              <FontAwesomeIcon icon={faCartShopping} /> Buyer Sign Up
            </Link>
            <Link to="/seller_register" className="reg-btn seller">
              <FontAwesomeIcon icon={faStore} /> Seller Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="help-hero" data-aos="fade-down">
        <FontAwesomeIcon icon={faHeadset} size="4x" className="hero-icon" />
        <h1>Help Center</h1>
        <p>Get started with Rwanda's most trusted digital marketplace.</p>
      </div>

      {/* FAQ Grid */}
      <div className="faq-grid">
        {faqs.map((faq, index) => (
          <div className="faq-item" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
            <div className="faq-q-header">
              <FontAwesomeIcon icon={faQuestionCircle} className="q-icon" />
              <h3>{faq.question}</h3>
            </div>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>

      {/* Support Contact */}
      <div className="support-contact" data-aos="zoom-in">
        <h2>Still have questions?</h2>
        <div className="contact-methods">
          <div className="method-card">
            <FontAwesomeIcon icon={faEnvelope} size="2x" />
            <h4>Email Support</h4>
            <p>support@isonga.rw</p>
          </div>
          <div className="method-card">
            <FontAwesomeIcon icon={faPhone} size="2x" />
            <h4>Call Us</h4>
            <p>+250 788 000 000</p>
          </div>
        </div>
      </div>

      <footer className="Landing_Footer">
        <div className="Footer_Content">
          <div className="Footer_Info">
            <img src="/logo.png" alt="Logo" />
            <p>Connecting Rwanda's buyers and sellers safely.</p>
          </div>
          <div className="Footer_Payments">
            <div className="badge-row">
              <span className="momo-badge">MTN MoMo</span>
              <span className="airtel-badge">Airtel Money</span>
            </div>
          </div>
        </div>
        <div className="Footer_Copyright">
          <p>&copy; {new Date().getFullYear()} Isonga Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Help;