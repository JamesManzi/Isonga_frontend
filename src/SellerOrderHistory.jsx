import { useEffect, useState, useRef } from "react";
import api from "./api";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faImage, 
  faTimes, 
  faHistory, 
  faDownload,
  faSearch // 👈 Added search icon
} from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./SellerOrderHistory.css";

function SellerOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // 👈 Array for search filtering
  const [searchQuery, setSearchQuery] = useState("");      // 👈 String tracking search input
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Refs to capture specific order cards for PDF generation
  const orderRefs = useRef({});

  const getOrders = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    api.get("/api/seller/orders/history")
      .then((res) => {
        if (res.data.success) {
          setOrders(res.data.orders);
          setFilteredOrders(res.data.orders); // Initialize filtered list with all records
        }
      })
      .catch((err) => console.error("Error fetching history:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getOrders();
  }, []);

  // 🔎 DYNAMIC SEARCH FILTER LOGIC
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter((order) => {
        const matchesName = order.name?.toLowerCase().includes(query);
        const matchesPhone = order.phone?.toLowerCase().includes(query);
        const matchesId = order._id?.toLowerCase().includes(query);
        
        // Optional: Search inside item product names too
        const matchesProducts = order.items?.some(item => 
          item.product?.name?.toLowerCase().includes(query)
        );

        return matchesName || matchesPhone || matchesId || matchesProducts;
      });
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  // PDF DOWNLOAD LOGIC
  const downloadOrderPDF = async (orderId) => {
    const element = orderRefs.current[orderId];
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff" 
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Adding a small margin from the top
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${orderId.slice(-6)}.pdf`);
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
    <div style={containerStyle}>
      <Link to="/dashboard" style={backLinkStyle}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>

      <h1 style={titleStyle}>
        <FontAwesomeIcon icon={faHistory} /> Order History
      </h1>

      {/* 🔍 SEARCH BAR UI CONTROLS */}
      {orders.length > 0 && (
        <div style={searchBarContainerStyle}>
          <div style={searchFieldWrapperStyle}>
            <FontAwesomeIcon icon={faSearch} style={searchIconStyle} />
            <input
              type="text"
              placeholder="Search by customer name, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={clearSearchButtonStyle}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div style={emptyStateStyle}>
          <p>{orders.length === 0 ? "No processed orders in your history yet." : "No history items match your search criteria."}</p>
        </div>
      ) : (
        filteredOrders.map((order) => (
          <div key={order._id} style={historyCardStyle}>
            
            {/* Header: Contains ID, Download Button, and Status */}
            <div style={cardHeaderStyle}>
              <h3 style={{ margin: 0, color: "#34495e" }}>Order ...{order._id.slice(-6)}</h3>
              
              <div style={actionAreaStyle}>
                <button 
                  onClick={() => downloadOrderPDF(order._id)}
                  style={downloadBtnStyle}
                >
                  <FontAwesomeIcon icon={faDownload} /> PDF
                </button>
              </div>
            </div>

            {/* This div is the only part captured in the PDF */}
            <div ref={(el) => (orderRefs.current[order._id] = el)} style={{ padding: '5px' }}>
              <div style={gridStyle}>
                <section>
                  <h4 style={sectionTitle}>Customer</h4>
                  <p style={textStyle}><strong>Name:</strong> {order.name}</p>
                  <p style={textStyle}><strong>Phone:</strong> {order.phone}</p>
                  <p style={textStyle}><strong>Message:</strong> {order.notes || "No message"}</p>
                </section>

                <section>
                  <h4 style={sectionTitle}>Payment Info</h4>
                  <p style={textStyle}><strong>Method:</strong> {order.paymentMethod}</p>
                  {order.paymentProof ? (
                    <button
                      onClick={() => setSelectedImg(order.paymentProof)}
                      style={receiptButtonStyle}
                    >
                      <FontAwesomeIcon icon={faImage} /> View Receipt
                    </button>
                  ) : (
                    <p style={{ color: "#999" }}></p>
                  )}
                </section>
              </div>

              <div style={itemBox}>
                {order.items.map((item, index) => (
                  <div key={index} style={itemRowStyle}>
                    <span>{item.product?.name || "Product"} × {item.quantity}</span>
                    <span>{item.price * item.quantity} Rwf</span>
                    <span style={statusBadge(item.status)}>{item.status}</span>
                  </div>
                ))}
                <div style={totalStyle}>Total Amount: {order.totalPrice} Rwf</div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal for Payment Proof */}
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

/* --- STYLES --- */

const containerStyle = { padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" };
const backLinkStyle = { textDecoration: "none", color: "#3498db", fontWeight: "600" };
const titleStyle = { margin: "25px 0 15px 0", color: "#2c3e50" };
const emptyStateStyle = { textAlign: "center", marginTop: "50px", color: "#7f8c8d" };

// New search bar UI clean inline styles
const searchBarContainerStyle = { marginBottom: "25px", width: "100%" };
const searchFieldWrapperStyle = { position: "relative", display: "flex", alignItems: "center", width: "100%", background: "#fff", borderRadius: "8px", border: "1px solid #dcdde1", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const searchIconStyle = { position: "absolute", left: "15px", color: "#a4b0be", fontSize: "1rem" };
const searchInputStyle = { width: "100%", padding: "12px 40px 12px 45px", border: "none", borderRadius: "8px", fontSize: "0.95rem", color: "#2c3e50", outline: "none", background: "transparent" };
const clearSearchButtonStyle = { position: "absolute", right: "15px", background: "none", border: "none", color: "#a4b0be", cursor: "pointer", fontSize: "1rem", padding: "2px" };

const historyCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  borderLeft: "5px solid #bdc3c7",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "15px",
  paddingBottom: "10px",
  borderBottom: "1px solid #f9f9f9"
};

const actionAreaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const downloadBtnStyle = {
  background: "#fff",
  color: "#27ae60",
  border: "1px solid #27ae60",
  borderRadius: "4px",
  padding: "4px 10px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  gap: "5px"
};

const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const sectionTitle = { borderBottom: "1px solid #eee", paddingBottom: "5px", color: "#7f8c8d", fontSize: "0.85rem", textTransform: "uppercase" };
const textStyle = { margin: "5px 0", fontSize: "0.9rem", color: "#2c3e50" };
const itemBox = { marginTop: "15px", background: "#fcfcfc", padding: "12px", borderRadius: "5px", border: "1px dashed #eee" };
const itemRowStyle = { display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" };
const totalStyle = { textAlign: "right", fontWeight: "bold", color: "#2c3e50", marginTop: "10px", paddingTop: "5px", borderTop: "1px solid #eee" };

const statusBadge = (status) => ({
  backgroundColor: status === "Accepted" ? "#27ae60" : "#95a5a6",
  color: "white", padding: "4px 12px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold"
});

const receiptButtonStyle = { background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: "0.85rem", padding: 0, marginTop: "5px" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { position: "relative", background: "#fff", padding: "10px", borderRadius: "8px", maxWidth: "90%" };
const modalImgStyle = { maxWidth: "100%", maxHeight: "80vh", display: "block" };
const closeButtonStyle = { position: "absolute", top: "-35px", right: "0", background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" };

export default SellerOrderHistory;