import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";

function VerifyEmail() {
  const [code, setCode] = useState("");
  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email;

  const verify = async () => {
    const res = await api.post("/api/verify-email", { email, code });

    if (res.data.success) {
      alert("Verified!");
      navigate("/buyer_login");
    } else {
      alert(res.data.message);
    }
  };

  return (
    <div>
      <h2>Verify Email</h2>
      <p>{email}</p>

      <input onChange={(e) => setCode(e.target.value)} />
      <button onClick={verify}>Verify</button>
    </div>
  );
}

export default VerifyEmail;