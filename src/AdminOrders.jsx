import { useEffect, useState } from "react";
import api from "./api";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes, faStore, faUserShield } from "@fortawesome/free-solid-svg-icons";
import "./SellerOrders.css"; // Uses your existing styling layout safely

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Tracks active processing order id
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const fetchAdminOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      // Calls global administration context endpoint rather than individual seller scoped routes
      const res = await api.get("/api/admin/orders");
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error("Error fetching master order records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Updates full global payment status or master order state
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(orderId);
      const res = await api.put(`/api/admin/order/status/${orderId}`, { status: newStatus });
      if (res.data.success) {
        // Safe context refresh to sync state across the pipeline
        const refreshed = await api.get("/api/admin/orders");
        setOrders(refreshed.data.orders);
      }
    } catch (err) {
      console.error("Error modifying master order status flags:", err);
      alert(err.response?.data?.message || "Failed to update order status.");
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
          <p style={{ fontWeight: 'bold', color: '#e67e22' }}>
            <FontAwesomeIcon icon={faUserShield} /> ADMIN PORTAL
          </p>
          <p>Compiling cross-marketplace master orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Link to="/admin/dashboard" style={backStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Administration Control Panel
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '25px 0' }}>
        <h1 style={{ ...titleStyle, margin: 0 }}>Global Market Orders</h1>
        <span style={{ backgroundColor: '#2c3e50', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          Total Logged: {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p style={{ color: "#7f8c8d", textAlign: 'center', margin: '40px 0' }}>No customer platform orders recorded yet.</p>
      ) : (
        orders.map((order) => {
          return (
            <div key={order._id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', borderBottom: '2px solid #f4f6f7', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Order Reference: <span style={{ color: '#2980b9' }}>#{order._id.slice(-8).toUpperCase()}</span></h3>
                  <small style={{ color: '#95a5a6' }}>Database Key: {order._id}</small>
                </div>
                {/* Master checkout payment processing validation */}
                <span style={statusBadge(order.status || "Pending")}>
                  System: {order.status || "Pending"}
                </span>
              </div>

              <div style={gridStyle}>
                {/* Customer Details block */}
                <section>
                  <h4 style={sectionTitle}>Customer Particulars</h4>
                  <p><strong>Client Name:</strong> {order.name}</p>
                  <p><strong>Mobile Contact:</strong> {order.phone}</p>
                  <p><strong>Delivery Destination:</strong> {order.address}</p>
                  <p><strong>User Instructions:</strong> {order.notes || <span style={{ color: '#bdc3c7', italic: 'true' }}>None provided</span>}</p>
                </section>

                {/* Audit & Transaction verification block */}
                <section>
                  <h4 style={sectionTitle}>Financial Verification</h4>
                  <p><strong>Fulfillment Mode:</strong> {order.deliveryMethod}</p>
                  <p><strong>Payment Gateway:</strong> {order.paymentMethod}</p>
                  
                  <div style={{ marginTop: '12px' }}>
                    <strong>Payment Proof Receipt: </strong>
                    {order.paymentProof ? (
                      <button
                        onClick={() => setSelectedImg(order.paymentProof)}
                        style={{ ...receiptButtonStyle, fontWeight: 'bold', textDecoration: 'underline' }}
                      >
                        <FontAwesomeIcon icon={faImage} /> Open Transaction Image
                      </button>
                    ) : (
                      <span style={{ color: "#e74c3c", fontSize: '14px' }}>No clearing slip uploaded</span>
                    )}
                  </div>
                </section>
              </div>

              {/* Comprehensive platform items breakdown including standalone vendor attribution mapping */}
              <div style={itemBox}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Line Items Ledger</h4>
                {order.items && order.items.map((item, i) => (
                  <div key={i} style={{ ...itemRow, padding: '6px 0', borderBottom: i !== order.items.length - 1 ? '1px dashed #eee' : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600' }}>
                        {item.product?.name || "Removed Inventory Item"} × {item.quantity}
                      </span>
                      {/* Displays isolated vendor scopes securely */}
                      <small style={{ color: '#e67e22' }}>
                        <FontAwesomeIcon icon={faStore} /> Vendor ID: {item.vendor?._id || item.seller || "Multi-Vendor/Unknown"}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '600', display: 'block' }}>{item.price * item.quantity} Rwf</span>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        color: '#fff',
                        backgroundColor: item.status === "Cancelled" ? "#e74c3c" : item.status === "Accepted" ? "#2ecc71" : "#f1c40f"
                      }}>
                        {item.status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
                <div style={{ ...totalStyle, fontSize: '18px', color: '#2c3e50', borderTop: '2px solid #ddd', paddingTop: '8px' }}>
                  Cumulative Total: <span style={{ color: '#27ae60' }}>{order.totalPrice} Rwf</span>
                </div>
              </div>
        
              {/* Central Administration System State Toggles */}
              <div style={btnContainer}>
                <button
                  onClick={() => updateOrderStatus(order._id, "Accepted")}
                  style={btnAccept}
                  disabled={actionLoading === order._id || order.status === "Accepted"}
                >
                  {actionLoading === order._id ? "Updating Ledger..." : "Approve Order & Transmit"}
                </button>

                <button
                  onClick={() => updateOrderStatus(order._id, "Cancelled")}
                  style={btnDecline}
                  disabled={actionLoading === order._id || order.status === "Cancelled"}
                >
                  {actionLoading === order._id ? "Updating Ledger..." : "Void Order & Flag Failure"}
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Verification Slip Zoom View Modal */}
      {selectedImg && (
        <div style={modalOverlayStyle} onClick={() => setSelectedImg(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={() => setSelectedImg(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} alt="Platform Receipt Verification Audit" style={modalImgStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- CSS-IN-JS HOOKS (Preserved & Adjusted) ---------------- */
const containerStyle = {
  padding: "30px",
  maxWidth: "1100px",
  margin: "0 auto",
  fontFamily: "sans-serif",
};

const backStyle = {
  textDecoration: "none",
  color: "#3498db",
  fontWeight: "600",
};

const titleStyle = {
  color: "#2c3e50",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "25px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  border: "1px solid #eef2f3"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "15px",
};

const sectionTitle = {
  borderBottom: "1px solid #eee",
  paddingBottom: "5px",
  color: "#34495e",
  margin: "0 0 10px 0"
};

const itemBox = {
  marginTop: "15px",
  background: "#f8f9fa",
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #ebdada"
};

const itemRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const totalStyle = {
  textAlign: "right",
  fontWeight: "bold",
  marginTop: "10px",
};

const statusBadge = (status) => ({
  background:
    status === "Pending"
      ? "#f1c40f"
      : status === "Cancelled"
      ? "#e74c3c"
      : "#2ecc71",
  color: "#fff",
  padding: "5px 12px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase"
});

const receiptButtonStyle = {
  background: "none",
  border: "none",
  color: "#3498db",
  cursor: "pointer",
  padding: 0
};

const btnContainer = {
  display: "flex",
  gap: "12px",
  marginTop: "20px",
};

const btnAccept = {
  flex: 1,
  padding: "12px",
  background: "#2ecc71",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
};

const btnDecline = {
  flex: 1,
  padding: "12px",
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000
};

const modalContentStyle = {
  position: "relative",
  background: "#fff",
  padding: "10px",
  borderRadius: "8px",
  maxWidth: "90%",
  maxHeight: "85vh"
};

const modalImgStyle = {
  maxWidth: "100%",
  maxHeight: "80vh",
  objectFit: "contain"
};

const closeButtonStyle = {
  position: "absolute",
  top: "-40px",
  right: "0",
  background: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "35px",
  height: "35px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px"
};

export default AdminOrders;