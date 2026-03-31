import { useEffect, useState, useRef } from "react"; // Added useRef
import api from "./api";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faImage, faTimes, faHistory, faDownload } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./SellerOrderHistory.css";

function SellerOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Create an object to store refs for each order card
  const orderRefs = useRef({});

  const getOrders = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    api.get("/api/seller/orders")
      .then((res) => {
        if (res.data.success) {
          const processed = res.data.orders.filter(
            (o) => o.status === "Accepted" || o.status === "Cancelled"
          );
          setOrders(processed);
        }
      })
      .catch((err) => console.error("Error fetching history:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getOrders();
  }, []);

  // PROFESSIONAL DOWNLOAD LOGIC
  const downloadOrderPDF = async (orderId) => {
    const element = orderRefs.current[orderId];
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Order_Receipt_${orderId.slice(-6)}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="history-card">
          <div className="line-loader"><div></div><div></div><div></div></div>
          <p>Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <Link to="/dashboard" style={{ textDecoration: "none", color: "#3498db", fontWeight: "600" }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: "25px 0", color: "#2c3e50" }}>
          <FontAwesomeIcon icon={faHistory} /> Order History
        </h1>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px", color: "#7f8c8d" }}>
          <p>No processed orders in your history yet.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={{ position: 'relative', marginBottom: '20px' }}>
            {/* Download Button Overlayed on Top Right */}
            <button 
              onClick={() => downloadOrderPDF(order._id)}
              style={downloadBtnStyle}
              title="Download Invoice"
            >
              <FontAwesomeIcon icon={faDownload} /> PDF
            </button>

            {/* The actual card that gets captured into PDF */}
            <div 
              ref={(el) => (orderRefs.current[order._id] = el)} 
              style={historyCardStyle}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, color: "#34495e" }}>Order ...{order._id.slice(-6)}</h3>
                <span style={statusBadge(order.status)}>{order.status}</span>
              </div>

              <div style={gridStyle}>
                <section>
                  <h4 style={sectionTitle}>Customer</h4>
                  <p style={textStyle}><strong>Name:</strong> {order.name}</p>
                  <p style={textStyle}><strong>Phone:</strong> {order.phone}</p>
                </section>

                <section>
                  <h4 style={sectionTitle}>Payment Info</h4>
                  <p style={textStyle}><strong>Method:</strong> {order.paymentMethod}</p>
                  {order.paymentProof && (
                    <button onClick={() => setSelectedImg(order.paymentProof)} style={receiptButtonStyle}>
                      <FontAwesomeIcon icon={faImage} /> View Receipt
                    </button>
                  )}
                </section>
              </div>

              <div style={itemBox}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "3px" }}>
                    <span>{item.product?.name || "Product"} × {item.quantity}</span>
                    <span>{item.price * item.quantity} Rwf</span>
                  </div>
                ))}
                <div style={totalStyle}>Total Amount: {order.totalPrice} Rwf</div>
              </div>
              
              {/* Footer for PDF branding */}
              <div className="pdf-only" style={{ display: 'none', textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#ccc' }}>
                Generated via ISONGA MARKET
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal for Receipt */}
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

/* --- Styles --- */

const downloadBtnStyle = {
  position: "absolute",
  right: "10px",
  top: "10px",
  zIndex: 5,
  background: "#2ecc71",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  padding: "5px 12px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "bold",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

const historyCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  borderLeft: "5px solid #bdc3c7",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  position: "relative"
};

const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" };
const sectionTitle = { borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#7f8c8d", fontSize: "0.9rem", textTransform: "uppercase" };
const textStyle = { margin: "5px 0", fontSize: "0.9rem", color: "#2c3e50" };
const itemBox = { marginTop: "12px", background: "#fcfcfc", padding: "10px", borderRadius: "5px", border: "1px dashed #eee" };
const totalStyle = { textAlign: "right", fontWeight: "bold", color: "#2c3e50", marginTop: "8px", paddingTop: "5px", borderTop: "1px solid #eee" };

const statusBadge = (status) => ({
  backgroundColor: status === "Accepted" ? "#27ae60" : "#95a5a6",
  color: "white", padding: "3px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold"
});

const receiptButtonStyle = { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: "0.85rem", padding: 0, marginTop: "5px" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { position: "relative", background: "#fff", padding: "10px", borderRadius: "8px", maxWidth: "90%" };
const modalImgStyle = { maxWidth: "100%", maxHeight: "80vh", display: "block" };
const closeButtonStyle = { position: "absolute", top: "-35px", right: "0", background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" };

export default SellerOrderHistory;