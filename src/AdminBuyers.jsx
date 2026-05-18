import { useEffect, useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
import "./AdminBuyers.css";

function AdminBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/admin/buyers");

      setBuyers(res.data.buyers || []);
    } catch (err) {
      console.error("Fetch buyers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBuyer = async (id) => {
    const confirmDelete = window.confirm("Delete this buyer?");
    if (!confirmDelete) return;

    try {
      setDeleteLoading(id);

      await api.delete(`/api/admin/buyer/${id}`);

      setBuyers((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ✅ Safe image handler
  const getProfileImage = (img) => {
    if (!img) return "/default-user.png";

    return img.startsWith("http")
      ? img
      : `https://api.isongamarket.com/uploads/${img}`;
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading buyers...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h2 style={{ marginBottom: "20px" }}>All Buyers</h2>

      {buyers.length === 0 ? (
        <p>No buyers found</p>
      ) : (
        buyers.map((buyer) => (
          <div
            key={buyer._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              marginBottom: "10px",
              background: "#fff",
            }}
          >
            {/* LEFT SIDE - PROFILE */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              
              {/* PROFILE IMAGE */}
              <img
                src={getProfileImage(buyer.profile)}
                alt="profile"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #eee",
                }}
              />

              {/* INFO */}
              <div>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  <FontAwesomeIcon icon={faUser} /> {buyer.name}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
                  {buyer.email}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#777" }}>
                  {buyer.phone || "No phone"}
                </p>
              </div>
            </div>

            {/* DELETE BUTTON */}
            <button
              onClick={() => deleteBuyer(buyer._id)}
              disabled={deleteLoading === buyer._id}
              style={{
                background: "#e74c3c",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {deleteLoading === buyer._id ? (
                "Deleting..."
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </>
              )}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminBuyers;