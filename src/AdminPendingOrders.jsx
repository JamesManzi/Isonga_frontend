import { useEffect, useState } from "react";
import api from "./api";
import "./AdminPendingOrders.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faBox,
  faUser,
  faPhone,
  faLocationDot,
  faMoneyBillWave,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

function AdminPendingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await api.get("/api/admin/pending-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to load pending orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoadingId(orderId);
      const token = localStorage.getItem("token");

      // Assuming your backend route handles order status updates at /api/admin/order-status/:id
      const res = await api.put(
        `/api/admin/order-status/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        // Remove the processed order from the pending list dynamically
        setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
      } else {
        setMessage(res.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred while updating order status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin_pending_loading">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <h2>Loading Pending Orders...</h2>
      </div>
    );
  }

  return (
    <div className="admin_pending_page">
      <div className="admin_pending_header">
        <h1>Pending Orders</h1>
        <p>Manage all customer orders waiting for processing</p>
      </div>

      {message && <div className="admin_pending_alert">{message}</div>}

      {orders.length === 0 ? (
        <div className="admin_pending_empty">
          <FontAwesomeIcon icon={faBox} size="3x" />
          <h2>No Pending Orders</h2>
        </div>
      ) : (
        <div className="admin_pending_orders_grid">
          {orders.map((order) => (
            <div className="admin_pending_card" key={order._id}>
              <div className="admin_pending_top">
                <h2>Order #{order._id ? order._id.slice(-6) : "------"}</h2>
                <span className="pending_badge">Pending</span>
              </div>

              <div className="admin_pending_info">
                <p>
                  <FontAwesomeIcon icon={faUser} />
                  {order.name || "N/A"}
                </p>
                <p>
                  <FontAwesomeIcon icon={faPhone} />
                  {order.phone || "N/A"}
                </p>
                <p>
                  <FontAwesomeIcon icon={faLocationDot} />
                  {order.address || "N/A"}
                </p>
                <p>
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                  ${order.totalPrice || 0}
                </p>
              </div>

              <div className="admin_pending_items">
                <h3>Products</h3>
                {order.items?.map((item, index) => (
                  <div className="admin_pending_item" key={index}>
                    <p>{item.product?.name || "Product Unavailable"}</p>
                    <span>Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="admin_pending_actions">
                <button
                  className="btn_approve"
                  disabled={actionLoadingId === order._id}
                  onClick={() => handleUpdateStatus(order._id, "Approved")}
                >
                  <FontAwesomeIcon icon={faCheck} /> Approve
                </button>
                <button
                  className="btn_decline"
                  disabled={actionLoadingId === order._id}
                  onClick={() => handleUpdateStatus(order._id, "Declined")}
                >
                  <FontAwesomeIcon icon={faXmark} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPendingOrders;