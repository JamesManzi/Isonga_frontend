
    import { useEffect, useState } from "react";
import api from "./api";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes } from "@fortawesome/free-solid-svg-icons";
import "./SellerOrders.css";
function SellerOrders() {
  const [orders, setOrders] = useState([]);
const [selectedImg, setSelectedImg] = useState(null);
const [loading, setLoading] = useState(true);
const [actionLoading, setActionLoading] = useState(null); // for buttons

useEffect(() => {
  const getOrders = async () => {
     const token = localStorage.getItem("token");
        if (!token) {
        navigate("/login");
        return;
      }
    try {
      setLoading(true);
      const res = await api.get("/api/seller/orders");
      if (res.data.success) {
        const incoming = res.data.orders.filter(
          (order) => order.status === "Pending"
        );
        setOrders(incoming);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  getOrders();
}, []);

  const updateStatus = async (orderId, newStatus) => {
  try {
    setActionLoading(orderId);
   const res = await api.put(
  `/api/order/status/${orderId}`,
  { status: newStatus }
);
    if (res.data.success) {
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== orderId)
      );
    }
  } catch (err) {
    console.error("Error updating order status:", err);
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
        <p>Fetching incoming orders...</p>

      </div>
    </div>
  );
}

  return (
    <div style={containerStyle}>
      <Link to="/dashboard" style={backStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>

      <h1 style={titleStyle}>Incoming Orders</h1>

      {orders.length === 0 ? (
        <p style={{ color: "#7f8c8d" }}>No incoming orders.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Order ID: ...{order._id.slice(-6)}</h3>
              <span style={statusBadge(order.status)}>
                {order.status}
              </span>
            </div>

            <div style={gridStyle}>
              <section>
                <h4 style={sectionTitle}>Customer Info</h4>
                <p><strong>Name:</strong> {order.name}</p>
                <p><strong>Phone:</strong> {order.phone}</p>
                <p><strong>Address:</strong> {order.address}</p>
                <p><strong>Message:</strong> {order.notes || "No message"}</p>
              </section>

              <section>
                <h4 style={sectionTitle}>Payment</h4>
                <p><strong>Delivery:</strong> {order.deliveryMethod}</p>
                <p><strong>Payment:</strong> {order.paymentMethod}</p>

                {order.paymentProof && (
                  <button
                    onClick={() => setSelectedImg(order.paymentProof)}
                    style={receiptButtonStyle}
                  >
                    <FontAwesomeIcon icon={faImage} /> View Receipt
                  </button>
                )}
              </section>
            </div>

            <div style={itemBox}>
              <h4>Items</h4>
              {order.items.map((item, i) => (
                <div key={i} style={itemRow}>
                  <span>
                    {item.product?.name || "Deleted Product"} ×{" "}
                    {item.quantity}
                  </span>
                  <span>{item.price * item.quantity} Rwf</span>
                </div>
              ))}
              <div style={totalStyle}>
                Total: {order.totalPrice} Rwf
              </div>
            </div>

            {/*  ACTION BUTTONS */}
            <div style={btnContainer}>
              <button
  onClick={() => updateStatus(order._id, "Accepted")}
  style={btnAccept}
  disabled={actionLoading === order._id}
>
  {actionLoading === order._id ? "Processing..." : "Accept"}
</button>

<button
  onClick={() => updateStatus(order._id, "Cancelled")}
  style={btnDecline}
  disabled={actionLoading === order._id}
>
  {actionLoading === order._id ? "Processing..." : "Decline"}
</button>
            </div>
          </div>
        ))
      )}

      {/*  IMAGE MODAL */}
      {selectedImg && (
        <div
          style={modalOverlayStyle}
          onClick={() => setSelectedImg(null)}
        >
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={closeButtonStyle}
              onClick={() => setSelectedImg(null)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} alt="Receipt" style={modalImgStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const containerStyle = {
  padding: "30px",
  maxWidth: "1000px",
  margin: "0 auto",
  fontFamily: "sans-serif",
};

const backStyle = {
  textDecoration: "none",
  color: "#3498db",
  fontWeight: "600",
};

const titleStyle = {
  margin: "25px 0",
  color: "#2c3e50",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
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
};

const itemBox = {
  marginTop: "15px",
  background: "#f9f9f9",
  padding: "15px",
  borderRadius: "8px",
};

const itemRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "5px",
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
  padding: "4px 10px",
  borderRadius: "20px",
});

const receiptButtonStyle = {
  background: "none",
  border: "none",
  color: "#3498db",
  cursor: "pointer",
};

const btnContainer = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

const btnAccept = {
  flex: 1,
  padding: "10px",
  background: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const btnDecline = {
  flex: 1,
  padding: "10px",
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
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
};

const modalContentStyle = {
  position: "relative",
  background: "#fff",
  padding: "10px",
  borderRadius: "8px",
};

const modalImgStyle = {
  maxWidth: "100%",
  maxHeight: "80vh",
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
};

export default SellerOrders;


