import { useEffect, useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
import "./AdminBuyers.css"
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBuyer = async (id) => {
    const confirm = window.confirm("Delete this buyer?");
    if (!confirm) return;

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

  if (loading) return <p>Loading buyers...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Buyers</h2>

      {buyers.length === 0 ? (
        <p>No buyers found</p>
      ) : (
        buyers.map((buyer) => (
          <div
            key={buyer._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px",
              border: "1px solid #ddd",
              marginBottom: "10px",
            }}
          >
            <div>
              <p>
                <FontAwesomeIcon icon={faUser} /> {buyer.name}
              </p>
              <p>{buyer.email}</p>
              <p>{buyer.phone}</p>
            </div>

            <button
              onClick={() => deleteBuyer(buyer._id)}
              disabled={deleteLoading === buyer._id}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "8px",
              }}
            >
              {deleteLoading === buyer._id ? "Deleting..." : (
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