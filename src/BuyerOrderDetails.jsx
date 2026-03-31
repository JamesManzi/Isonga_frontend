import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes } from "@fortawesome/free-solid-svg-icons";

function BuyerOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getOrder = async () => {
      try {
        const res = await api.get(`/api/orders/${id}`);
        if (res.data.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getOrder();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>Order not found</p>;

  return (
    <div style={containerStyle}>
      <Link to="/notifications" style={backStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </Link>

      <h1 style={titleStyle}>Order Details</h1>

      <div style={cardStyle}>
        <h3>Order ID: ...{order._id.slice(-6)}</h3>

        <div style={gridStyle}>
          <section>
            <h4>Customer Info</h4>
            <p><strong>Name:</strong> {order.name}</p>
            <p><strong>Phone:</strong> {order.phone}</p>
            <p><strong>Address:</strong> {order.address}</p>
          </section>

          <section>
            <h4>Payment</h4>
            <p><strong>Delivery:</strong> {order.deliveryMethod}</p>
            <p><strong>Payment:</strong> {order.paymentMethod}</p>

            {order.paymentProof && (
              <button onClick={() => setSelectedImg(order.paymentProof)}>
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
                {item.product?.name || "Deleted Product"} × {item.quantity}
              </span>
              <span>{item.price * item.quantity} Rwf</span>
            </div>
          ))}
          <div style={totalStyle}>
            Total: {order.totalPrice} Rwf
          </div>
        </div>

        {order.fileUrl && (
          <button onClick={() => window.open(order.fileUrl, "_blank")}>
            ⬇ Download Invoice
          </button>
        )}
      </div>

      {selectedImg && (
        <div style={modalOverlayStyle} onClick={() => setSelectedImg(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImg(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImg} alt="Receipt" style={modalImgStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerOrderDetails;