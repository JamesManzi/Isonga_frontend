import "./PrivacyRules.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

function PrivacyRules() {
  const navigate = useNavigate();

  return (
    <div className="privacy_page">

      {/* Navbar */}
      <div className="privacy_navbar">
        <div className="privacy_back" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </div>
        <h1>Privacy & Rules</h1>
      </div>

      {/* Content */}
      <div className="privacy_container">

        {/* Privacy Section */}
        <section>
          <h2>🔒 Privacy Policy</h2>
          <p>
            We respect your privacy. Your personal information (name, email, phone)
            is only used to provide marketplace services such as buying, selling,
            and communication between users.
          </p>

          <ul>
            <li>We do not sell your personal data to third parties.</li>
            <li>Your password is encrypted and securely stored.</li>
            <li>Chats between users remain private.</li>
            <li>We may use cookies to improve user experience.</li>
          </ul>
        </section>

        {/* Rules Section */}
        <section>
          <h2>📜 Marketplace Rules</h2>
          <ul>
            <li>No fake or misleading product listings allowed.</li>
            <li>No scams, fraud, or illegal activities.</li>
            <li>Respect all buyers and sellers in chats.</li>
            <li>Do not post offensive or harmful content.</li>
            <li>All payments must follow platform guidelines.</li>
          </ul>
        </section>

        {/* User Agreement */}
        <section>
          <h2>⚖️ User Agreement</h2>
          <p>
            By using Isonga Market, you agree to follow all rules and accept that
            your activity may be monitored for safety and fraud prevention.
          </p>
        </section>

      </div>
    </div>
  );
}

export default PrivacyRules;