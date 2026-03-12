import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

function SellerOrders() {
  const [orders, setOrders] = useState([]);

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
          alert(`Order ${newStatus}`);
          getOrders();
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/dashboard" style={{ textDecoration: "none", color: "#2c3e50" }}>
        <FontAwesomeIcon icon={faArrowRight} style={{ marginRight: "8px" }} />
        Back
      </Link>

      <h1 style={{ margin: "20px 0", fontSize: "1.8rem", color: "#2c3e50" }}>
        Incoming Orders
      </h1>

      {orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((order) => (
        <div
          key={order._id}
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.2s ease-in-out",
          }}
        >
          <h3 style={{ marginBottom: "10px", color: "#34495e" }}>
            Order ID: {order._id}
          </h3>
          <p>
            <strong>Status:</strong> {order.status}
          </p>

          <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #eee" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ marginBottom: "8px", color: "#2c3e50" }}>Customer Details</h4>
              <p><strong>Name:</strong> {order.name}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Address:</strong> {order.address}</p>
            </div>

            <div>
              <h4 style={{ marginBottom: "8px", color: "#2c3e50" }}>Logistics</h4>
              <p><strong>Delivery Method:</strong> {order.deliveryMethod}</p>
              <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
              <p><strong>Delivery Date:</strong> {order.deliveryDate || "N/A"}</p>
            </div>
          </div>

          <div style={{ marginTop: "10px", fontStyle: "italic", color: "#777" }}>
            <h4 style={{ marginBottom: "5px", color: "#2c3e50" }}>Order Notes:</h4>
            <p>{order.notes || "No notes provided."}</p>
          </div>

          <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #eee" }} />

          <h4 style={{ marginBottom: "8px", color: "#2c3e50" }}>Items Ordered:</h4>
          {order.items.map((item) => (
            <p key={item.product._id}>
              {item.product.name} × {item.quantity} ={" "}
              <strong>{item.quantity * item.price} Rwf</strong>
            </p>
          ))}

          <h3 style={{ marginTop: "10px", fontSize: "1.2rem", fontWeight: "bold", color: "#27ae60" }}>
            Total Price: {order.totalPrice} Rwf
          </h3>

          {/* Action Buttons */}
          <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
            <button
              onClick={() => updateStatus(order._id, "accepted")}
              style={{
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                padding: "10px 25px",
                cursor: "pointer",
                borderRadius: "5px",
                fontWeight: "bold",
                transition: "background-color 0.2s ease-in-out",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#219150")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#27ae60")}
            >
              Accept Order
            </button>
            <button
              onClick={() => updateStatus(order._id, "declined")}
              style={{
                backgroundColor: "#c0392b",
                color: "white",
                border: "none",
                padding: "10px 25px",
                cursor: "pointer",
                borderRadius: "5px",
                fontWeight: "bold",
                transition: "background-color 0.2s ease-in-out",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#a93226")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#c0392b")}
            >
              Decline Order
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SellerOrders;
