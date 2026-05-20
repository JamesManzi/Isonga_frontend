import { useEffect, useState } from "react";
import api from "./api";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faImage,
  faTimes,
  faStore,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import "./SellerOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const fetchAdminOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      setLoading(true);

      const res = await api.get("/api/admin/orders");

      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setActionLoading(orderId);

      const res = await api.put(
        `/api/admin/order/status/${orderId}`,
        { status }
      );

      if (res.data.success) {
        fetchAdminOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="orders-loader-card">
          <div className="ring-loader"></div>
          <h2>ISONGA MARKET</h2>
          <p>
            <FontAwesomeIcon icon={faUserShield} /> ADMIN PANEL
          </p>
          <p>Loading all seller orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <button onClick={()=>navigate(-1)} style={backStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>
      <div style={headerStyle}>
        <h1 style={{ margin: 0 }}>All Seller Orders</h1>
        <span style={countBadge}>
          Total: {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center" }}>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={cardStyle}>
            
            {/* HEADER */}
            <div style={orderHeader}>
              <div>
                <h3 style={{ margin: 0 }}>
                  Order #{order._id.slice(-8).toUpperCase()}
                </h3>
                <small>{order.createdAt}</small>
              </div>

              <span style={statusBadge(order.status)}>
                {order.status || "Pending"}
              </span>
            </div>

            {/* CUSTOMER + PAYMENT */}
            <div style={gridStyle}>
              
              <div style={boxStyle}>
                <h4>Customer</h4>
                <p>{order.name}</p>
                <p>{order.phone}</p>
                <p>{order.address}</p>
              </div>

              <div style={boxStyle}>
                <h4>Payment</h4>
                <p>{order.paymentMethod}</p>
                <p>
                  Total: <b>{order.totalPrice} Rwf</b>
                </p>

                {order.paymentProof && (
                  <button
                    onClick={() => setSelectedImg(order.paymentProof)}
                    style={linkBtn}
                  >
                    <FontAwesomeIcon icon={faImage} /> View Proof
                  </button>
                )}
              </div>
            </div>

            {/* ITEMS */}
            <div style={itemsBox}>
              <h4>Seller Items</h4>

              {order.items?.map((item, i) => (
                <div key={i} style={itemRow}>
                  
                  <div>
                    <b>{item.product?.name || "Deleted Product"}</b>
                    <p>Qty: {item.quantity}</p>

                    <div style={sellerBox}>
                      <FontAwesomeIcon icon={faStore} />{" "}
                      Seller: {item.vendor?.shopName || item.seller || "Unknown"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <b>{item.price * item.quantity} Rwf</b>

                    <div style={smallStatus(item.status)}>
                      {item.status || "Pending"}
                    </div>
                  </div>
                </div>
              ))}

              <h3 style={{ textAlign: "right" }}>
                Total: {order.totalPrice} Rwf
              </h3>
            </div>

            {/* ACTIONS */}
            <div style={btnWrap}>
              <button
                onClick={() =>
                  updateOrderStatus(order._id, "Accepted")
                }
                disabled={actionLoading === order._id}
                style={acceptBtn}
              >
                {actionLoading === order._id
                  ? "Updating..."
                  : "Accept"}
              </button>

              <button
                onClick={() =>
                  updateOrderStatus(order._id, "Cancelled")
                }
                disabled={actionLoading === order._id}
                style={cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        ))
      )}

      {/* IMAGE MODAL */}
      {selectedImg && (
        <div style={modal} onClick={() => setSelectedImg(null)}>
          <div style={modalBox}>
            <button
              style={closeBtn}
              onClick={() => setSelectedImg(null)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} style={img} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const containerStyle = {
  padding: "25px",
  maxWidth: "1100px",
  margin: "auto",
  fontFamily: "sans-serif",
};

const backStyle = {
  textDecoration: "none",
  color: "#3498db",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "20px 0",
};

const countBadge = {
  background: "#2c3e50",
  color: "#fff",
  padding: "5px 10px",
  borderRadius: "5px",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
};

const orderHeader = {
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid #ddd",
  paddingBottom: "10px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  marginTop: "15px",
};

const boxStyle = {
  background: "#f9f9f9",
  padding: "10px",
  borderRadius: "6px",
};

const itemsBox = {
  marginTop: "15px",
  background: "#f6f6f6",
  padding: "15px",
  borderRadius: "8px",
};

const itemRow = {
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid #ddd",
  padding: "10px 0",
};

const sellerBox = {
  fontSize: "12px",
  color: "#e67e22",
  marginTop: "5px",
};

const btnWrap = {
  display: "flex",
  gap: "10px",
  marginTop: "15px",
};

const acceptBtn = {
  flex: 1,
  padding: "10px",
  background: "#2ecc71",
  border: "none",
  color: "#fff",
  borderRadius: "5px",
};

const cancelBtn = {
  flex: 1,
  padding: "10px",
  background: "#e74c3c",
  border: "none",
  color: "#fff",
  borderRadius: "5px",
};

const statusBadge = (status) => ({
  padding: "5px 10px",
  borderRadius: "20px",
  color: "#fff",
  background:
    status === "Accepted"
      ? "#2ecc71"
      : status === "Cancelled"
      ? "#e74c3c"
      : "#f1c40f",
});

const smallStatus = (status) => ({
  fontSize: "11px",
  color: "#fff",
  background:
    status === "Accepted"
      ? "#2ecc71"
      : status === "Cancelled"
      ? "#e74c3c"
      : "#f1c40f",
  padding: "3px 6px",
  borderRadius: "10px",
  marginTop: "5px",
  display: "inline-block",
});

const linkBtn = {
  border: "none",
  background: "none",
  color: "#3498db",
  cursor: "pointer",
};

const modal = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBox = {
  background: "#fff",
  padding: "10px",
  borderRadius: "8px",
};

const img = {
  maxWidth: "500px",
  maxHeight: "80vh",
};

const closeBtn = {
  float: "right",
  border: "none",
  background: "red",
  color: "#fff",
  borderRadius: "50%",
};

export default AdminOrders;