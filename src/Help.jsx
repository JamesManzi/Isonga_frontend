import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FiLogOut } from "react-icons/fi";
import "./Help.css";
import { Link } from "react-router-dom";

function Help() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-in-out", once: true });
  }, []);

  const faqs = [
    { question: "How do I create an account?", answer: "Click on Sign Up and fill your details." },
    { question: "How can I contact a seller?", answer: "Visit the seller's shop page and click Chat." },
    { question: "What payment methods are accepted?", answer: "Credit cards, mobile money, and others." },
    { question: "How do I report a problem?", answer: "Use the contact form or click Report on products/shops." }
  ];

  const handleLogout = (e) => {
    e.preventDefault();
    console.log("Logout submitted");
    // Add your actual logout logic here (clear session, redirect, etc.)
    alert("Logged out!");
  };

  return (
    <div className="help-wrapper">
      {/* Navbar with logout form */}
      <div className="help-navbar">
        <h1 className="brand">Isonga Market</h1>
          <Link to="/">
          <button type="submit" className="logout-btn" title="Logout">
            <FiLogOut size={28} />
          </button>
          </Link>
      </div>

      {/* Header */}
      <h1 data-aos="fade-up">Help & Support</h1>
      <p className="help-subheading" data-aos="fade-up" data-aos-delay="100">
        Find answers to common questions or reach out to our support team.
      </p>

      {/* FAQ Section */}
      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div className="faq-card" key={index} data-aos="fade-up" data-aos-delay={200 + index * 100}>
            <div className="faq-icon">
              <FontAwesomeIcon icon={faQuestionCircle} size="2x" />
            </div>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="contact-section" data-aos="fade-up" data-aos-delay="700">
        <h2>Contact Us</h2>
        <p>Have more questions? Reach out directly:</p>
        <div className="contact-cards">
          <div className="contact-card">
            <FontAwesomeIcon icon={faEnvelope} size="2x" />
            <p>support@isonga.com</p>
          </div>
          <div className="contact-card">
            <FontAwesomeIcon icon={faPhone} size="2x" />
            <p>+250 788 000 000</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;