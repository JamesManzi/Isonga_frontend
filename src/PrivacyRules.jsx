import "./PrivacyRules.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faShieldHalved,
  faGavel,
  faLock,
  faComments,
  faUserCheck,
  faTriangleExclamation,
  faCookieBite,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

function PrivacyRules() {
  const navigate = useNavigate();

  return (
    <div className="privacy_page">

      {/* Top Navbar */}
      <div className="privacy_navbar">
        <button
          className="privacy_back"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <div>
          <h1>Privacy & Rules</h1>
          <p>Safe marketplace for buyers & sellers</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="privacy_hero">
        <div className="privacy_overlay"></div>

        <div className="privacy_hero_content">
          <div className="privacy_badge">
            <FontAwesomeIcon icon={faShieldHalved} />
            Trusted Marketplace
          </div>

          <h2>Your Safety Comes First</h2>

          <p>
            We protect your data, conversations, and marketplace experience
            while ensuring a safe environment for everyone on Isonga Market.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="privacy_container">

        {/* Privacy Section */}
        <section className="privacy_card">
          <div className="privacy_title">
            <FontAwesomeIcon icon={faLock} />
            <h2>Privacy Policy</h2>
          </div>

          <p>
            Your personal information is protected and only used to improve
            your buying and selling experience on Isonga Market.
          </p>

          <div className="privacy_grid">
            <div className="privacy_item">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>We never sell your personal data.</span>
            </div>

            <div className="privacy_item">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>Passwords are encrypted securely.</span>
            </div>

            <div className="privacy_item">
              <FontAwesomeIcon icon={faComments} />
              <span>Private chats stay confidential.</span>
            </div>

            <div className="privacy_item">
              <FontAwesomeIcon icon={faCookieBite} />
              <span>Cookies improve your experience.</span>
            </div>
          </div>
        </section>

        {/* Rules Section */}
        <section className="privacy_card">
          <div className="privacy_title">
            <FontAwesomeIcon icon={faGavel} />
            <h2>Marketplace Rules</h2>
          </div>

          <div className="rules_list">

            <div className="rule_box">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <div>
                <h3>No Fake Listings</h3>
                <p>Products must be real and accurately described.</p>
              </div>
            </div>

            <div className="rule_box">
              <FontAwesomeIcon icon={faShieldHalved} />
              <div>
                <h3>No Fraud or Scams</h3>
                <p>Illegal activities are strictly prohibited.</p>
              </div>
            </div>

            <div className="rule_box">
              <FontAwesomeIcon icon={faComments} />
              <div>
                <h3>Respect Communication</h3>
                <p>Be respectful in chats and interactions.</p>
              </div>
            </div>

            <div className="rule_box">
              <FontAwesomeIcon icon={faUserCheck} />
              <div>
                <h3>Safe Community</h3>
                <p>No offensive, harmful, or abusive content.</p>
              </div>
            </div>

          </div>
        </section>

        {/* Agreement */}
        <section className="privacy_card agreement_card">
          <div className="privacy_title">
            <FontAwesomeIcon icon={faShieldHalved} />
            <h2>User Agreement</h2>
          </div>

          <p>
            By using <strong>Isonga Market</strong>, you agree to follow our
            marketplace rules and understand that activity may be monitored
            for fraud prevention, security, and platform safety.
          </p>
        </section>

      </div>
    </div>
  );
}

export default PrivacyRules;