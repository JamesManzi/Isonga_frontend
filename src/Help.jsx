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
  faRightToBracket 
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import "./Help.css";

function Help() {
  useEffect(() => {
    // Initialize Animations
    AOS.init({ duration: 800, easing: "ease-in-out", once: true });
  }, []);

  // Sticky Navbar Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".Landing_Navbar");
      if (window.scrollY > 50) {
        navbar?.classList.add("scrolled");
      } else {
        navbar?.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const faqs = [
    { 
      question: "How do I create an account?", 
      answer: "Click the 'Sign Up' button in the top right corner. You can register as a Buyer to shop or a Seller to list products." 
    },
    { 
      question: "Is Isonga Market free to use?", 
      answer: "Browsing and searching for products is completely free. Sellers may have different plans for listing their items." 
    },
    { 
      question: "Which payment methods are supported?", 
      answer: "We focus on local Rwandan payments including MTN MoMo and Airtel Money for fast, secure transactions." 
    },
    { 
      question: "How do I contact a seller?", 
      answer: "Once you create a free account and log in, you will see a 'Chat' button on every shop and product page." 
    }
  ];

  return (
    <div className="help-wrapper">
      {/* Landing Page Navbar (No Profile Needed) */}
      <nav className="Landing_Navbar">
        <div className="Navbar_Brand">
          <img src="/logo.png" alt="Isonga Logo" />
          <div className="Brand_Text">
            <h1>Isonga</h1>
            <span>Market</span>
          </div>
        </div>
        
        <div className="Navbar_Links">
          <Link to="/">Home</Link>
          <Link to="/RealEstate">Assets</Link>
          <Link to="/Agriculture">Agriculture</Link>
        </div>

        <div className="Navbar_Auth">
          <Link to="/buyer_login" className="login-link">
            <FontAwesomeIcon icon={faRightToBracket} /> Login
          </Link>
          <Link to="/buyer_register" className="register-btn">
            <FontAwesomeIcon icon={faUserPlus} /> Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="help-hero" data-aos="fade-down">
        <FontAwesomeIcon icon={faHeadset} size="4x" className="hero-icon" />
        <h1>How can we help you?</h1>
        <p>Everything you need to know about using Isonga Market in Rwanda.</p>
      </div>

      {/* FAQ Grid */}
      <div className="faq-grid">
        {faqs.map((faq, index) => (
          <div 
            className="faq-item" 
            key={index} 
            data-aos="fade-up" 
            data-aos-delay={index * 100}
          >
            <div className="faq-q-header">
              <FontAwesomeIcon icon={faQuestionCircle} className="q-icon" />
              <h3>{faq.question}</h3>
            </div>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>

      {/* Direct Contact */}
      <div className="support-contact" data-aos="zoom-in">
        <h2>Still have questions?</h2>
        <p>Our support team is ready to help you get started.</p>
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

      {/* Landing Footer */}
      <footer className="Landing_Footer">
        <div className="Footer_Content">
          <div className="Footer_Info">
            <img src="/logo.png" alt="Logo" />
            <p>Connecting Rwanda's buyers and sellers safely.</p>
          </div>
          <div className="Footer_Payments">
            <h4>Accepted Payments</h4>
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