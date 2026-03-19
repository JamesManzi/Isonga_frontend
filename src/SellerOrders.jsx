

import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes } from "@fortawesome/free-solid-svg-icons";

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null); // State for the receipt modal

  const getOrders = () => {
    axios
      .get("https://isonga-backend.onrender.com/api/seller/orders", { withCredentials: true })
      .then((res) => {
        if (res.data.success) setOrders(res.data.orders);
      })
      .catch((err) => console.error("Error fetching orders:", err));
  };

  useEffect(() => {
    getOrders();
  }, []);

  const updateStatus = (orderId, newStatus) => {
    axios
      .put(
        `https://isonga-backend.onrender.com/api/order/status/${orderId}`,
        { status: newStatus },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          getOrders(); // Refresh list to update UI
        }
      })
      .catch((err) => console.error("Error updating order status:", err));
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <Link to="/dashboard" style={{ textDecoration: "none", color: "#3498db", fontWeight: "600" }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>

      <h1 style={{ margin: "25px 0", color: "#2c3e50" }}>Incoming Orders</h1>

      {orders.length === 0 ? (
        <p style={{ color: "#7f8c8d" }}>You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>Order ID: ...{order._id.slice(-6)}</h3>
              <span style={statusBadge(order.status)}>{order.status}</span>
            </div>

            <div style={gridStyle}>
              <section>
                <h4 style={sectionTitle}>Customer Information</h4>
                <p><strong>Name:</strong> {order.name}</p>
                <p><strong>Phone:</strong> {order.phone}</p>
                <p><strong>Address:</strong> {order.address}</p>
              </section>

              <section>
                <h4 style={sectionTitle}>Logistics & Payment</h4>
                <p><strong>Delivery:</strong> {order.deliveryMethod}</p>
                <p><strong>Payment:</strong> {order.paymentMethod}</p>
                {/* Fixed: Opens modal instead of new tab */}
                {order.paymentProof && (
                  <button 
                    onClick={() => setSelectedImg(order.paymentProof)} 
                    style={receiptButtonStyle}
                  >
                    <FontAwesomeIcon icon={faImage} /> View Payment Receipt
                  </button>
                )}
              </section>
            </div>

            <div style={itemBox}>
              <h4 style={{ marginTop: 0 }}>Items Ordered</h4>
              {order.items.map((item, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "5px" }}>
                  {/* Fixed: Optional chaining prevents crash if product was deleted */}
                  <span>{item.product?.name || "Deleted Product"} × {item.quantity}</span>
                  <span>{item.price * item.quantity} Rwf</span>
                </div>
              ))}
              <div style={totalStyle}>Total: {order.totalPrice} Rwf</div>
            </div>

            {/* Always show actions so seller can manage orders regardless of status */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => updateStatus(order._id, "Accepted")} style={btnAccept}>
  Accept Order
</button>
              <button onClick={() => updateStatus(order._id, "Cancelled")} style={btnDecline}>
                Decline Order
              </button>
            </div>
          </div>
        ))
      )}

      {/* Modal Overlay Component */}
      {selectedImg && (
        <div style={modalOverlayStyle} onClick={() => setSelectedImg(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={() => setSelectedImg(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} alt="Receipt" style={modalImgStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  border: "1px solid #eee"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "15px"
};

const sectionTitle = { borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#34495e" };

const itemBox = {
  marginTop: "15px",
  background: "#f9f9f9",
  padding: "15px",
  borderRadius: "8px"
};

const totalStyle = {
  textAlign: "right",
  fontWeight: "bold",
  fontSize: "1.1rem",
  color: "#27ae60",
  marginTop: "10px",
  borderTop: "1px solid #ddd",
  paddingTop: "5px"
};

const statusBadge = (status) => ({
  backgroundColor: status === "Pending" ? "#f1c40f" : status === "Cancelled" ? "#e74c3c" : "#2ecc71",
  color: "white",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "0.8rem",
  height: "fit-content"
});

const receiptButtonStyle = {
  background: "none",
  border: "none",
  color: "#3498db",
  fontWeight: "bold",
  cursor: "pointer",
  padding: 0,
  fontSize: "0.95rem",
  marginTop: "5px",
  display: "block",
  textAlign: "left"
};

const btnAccept = { flex: 1, padding: "10px", background: "#27ae60", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };
const btnDecline = { flex: 1, padding: "10px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };

// Modal Styles
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
  zIndex: 1000,
};

const modalContentStyle = {
  position: "relative",
  background: "#fff",
  padding: "10px",
  borderRadius: "8px",
  maxWidth: "90%",
  maxHeight: "90%",
};

const modalImgStyle = {
  maxWidth: "100%",
  maxHeight: "80vh",
  borderRadius: "4px",
  display: "block"
};

const closeButtonStyle = {
  position: "absolute",
  top: "-40px",
  right: "0",
  background: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "30px",
  height: "30px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default SellerOrders;

