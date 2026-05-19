import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowLeft,
  faEye,
  faDownload,
  faTimes,
  faImage,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import "./Notifications.css";

function Notifications_Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDetail, setViewDetail] = useState(null);

  const pdfRef = useRef();
  const navigate = useNavigate();

  /* ================= FETCH NOTIFICATIONS ================= */
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");

      if (res.data.success) {
        setNotifications(res.data.notifications);

        // Mark all as read
        await api.put("/api/notifications/mark-read");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIEW DETAILS ================= */
  const handleView = async (n) => {
    try {
      const type = n.bookingId ? "booking" : "order";
      const id = n.bookingId || n.orderId;

      if (!id) {
        return alert("Details ID not found.");
      }

      const res = await api.get(`/api/${type}s/${id}`);

      if (!res.data.success) return;

      let data = res.data[type];

      /* ================= ORDER LOGIC ================= */
      if (type === "order") {
        const sellerId =
          typeof n.sender === "object"
            ? n.sender._id
            : n.sender;

        const filteredItems = data.items.filter((item) => {
          const itemSellerId =
            typeof item.seller === "object"
              ? item.seller._id
              : item.seller;

          return String(itemSellerId) === String(sellerId);
        });

        const sellerTotal = filteredItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        data = {
          ...data,
          items: filteredItems,
          totalPrice: sellerTotal,
        };
      }

      setViewDetail({
        ...data,
        type,
      });
    } catch (err) {
      console.error("View Error:", err);
    }
  };

  /* ================= DELETE NOTIFICATION ================= */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/api/notifications/${id}`);

      if (res.data.success) {
        setNotifications((prev) =>
          prev.filter((n) => n._id !== id)
        );
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete notification.");
    }
  };

  /* ================= DOWNLOAD PDF ================= */
  const downloadPDF = async () => {
    const element = pdfRef.current;

    if (!element || !viewDetail) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();

      const pdfHeight =
        (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        10,
        pdfWidth,
        pdfHeight
      );

      pdf.save(
        `Isonga_${viewDetail.type}_${viewDetail._id?.slice(
          -6
        )}.pdf`
      );
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Error generating PDF.");
    }
  };

  return (
    <div className="notifications-page">
      {/* ================= HEADER ================= */}
      <div className="notif-header">
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <h2>Notifications</h2>
      </div>

      {/* ================= NOTIFICATION LIST ================= */}
      <div className="notif-list">
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-msg">
            No notifications found.
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-card ${
                n.read ? "read" : "unread"
              }`}
            >
              <div
                className="notif-center"
                onClick={() => handleView(n)}
              >
                <p>{n.message}</p>

                <span className="notif-date">
                  {new Date(
                    n.createdAt
                  ).toLocaleDateString()}
                </span>
              </div>

              <div className="notif-right">
                <button
                  className="icon-btn view"
                  onClick={() => handleView(n)}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>

                <button
                  className="icon-btn delete"
                  onClick={() => handleDelete(n._id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= MODAL ================= */}
      {viewDetail && (
        <div
          style={modalOverlayStyle}
          onClick={() => setViewDetail(null)}
        >
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ================= TOP BUTTONS ================= */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <button
                onClick={downloadPDF}
                style={downloadBtnStyle}
              >
                <FontAwesomeIcon icon={faDownload} /> Download PDF
              </button>

              <button
                style={closeBtnStyle}
                onClick={() => setViewDetail(null)}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  size="lg"
                />
              </button>
            </div>

            {/* ================= PDF CONTENT ================= */}
            <div ref={pdfRef} style={pdfCanvasStyle}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    color: "#2c3e50",
                    margin: 0,
                  }}
                >
                  ISONGA MARKET
                </h2>

                <p style={{ color: "#7f8c8d" }}>
                  Official{" "}
                  {viewDetail.type.toUpperCase()} Receipt
                </p>
              </div>

              {/* ================= CUSTOMER + TRANSACTION ================= */}
              <div style={gridStyle}>
                <section>
                  <h4 style={sectionTitle}>
                    Customer Information
                  </h4>

                  <p>
                    <strong>Name:</strong>{" "}
                    {viewDetail.name || "N/A"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {viewDetail.phone || "N/A"}
                  </p>

                  {viewDetail.address && (
                    <p>
                      <strong>Address:</strong>{" "}
                      {viewDetail.address}
                    </p>
                  )}
                </section>

                <section>
                  <h4 style={sectionTitle}>
                    Transaction Info
                  </h4>

                  <p>
                    <strong>ID:</strong> #
                    {viewDetail._id
                      ?.slice(-8)
                      .toUpperCase()}
                  </p>

                  <p>
                    <strong>Payment:</strong>{" "}
                    {viewDetail.paymentMethod}
                  </p>

                  {/* ================= BOOKING STATUS ================= */}
                  {viewDetail.type === "booking" && (
                    <p>
                      <strong>Status:</strong>

                      <span
                        style={{
                          color: "#27ae60",
                          fontWeight: "bold",
                        }}
                      >
                        {" "}
                        {viewDetail.status || "Pending"}
                      </span>
                    </p>
                  )}
                </section>
              </div>

              {/* ================= BOOKING DETAILS ================= */}
              {viewDetail.type === "booking" && (
                <div style={itemBox}>
                  <h4 style={{ marginTop: 0 }}>
                    Booking Details
                  </h4>

                  <p>
                    <strong>Service Date:</strong>{" "}
                    {viewDetail.date}
                  </p>

                  <p>
                    <strong>Service Time:</strong>{" "}
                    {viewDetail.time}
                  </p>

                  <p>
                    <strong>Notes:</strong>{" "}
                    {viewDetail.message ||
                      "No specific instructions"}
                  </p>
                </div>
              )}

              {/* ================= ORDER DETAILS ================= */}
              {viewDetail.type === "order" &&
                viewDetail.items && (
                  <div style={itemBox}>
                    <h4 style={{ marginTop: 0 }}>
                      Items Ordered
                    </h4>

                    {viewDetail.items.map((item, i) => (
                      <div
                        key={i}
                        style={itemRowContainer}
                      >
                        <div>
                          <div style={itemNameStyle}>
                            {item.product?.name ||
                              "Product"}{" "}
                            x {item.quantity}
                          </div>

                          {/* ITEM STATUS */}
                          <div
                            style={{
                              fontSize: "12px",
                              marginTop: "5px",
                              fontWeight: "600",
                              color:
                                item.status ===
                                "Accepted"
                                  ? "#27ae60"
                                  : item.status ===
                                    "Cancelled"
                                  ? "#e74c3c"
                                  : "#f39c12",
                            }}
                          >
                            Status:{" "}
                            {item.status || "Pending"}
                          </div>
                        </div>

                        <span>
                          {(
                            item.price * item.quantity
                          ).toLocaleString()}{" "}
                          Rwf
                        </span>
                      </div>
                    ))}

                    <div style={totalStyle}>
                      Total:{" "}
                      {viewDetail.totalPrice?.toLocaleString() ||
                        0}{" "}
                      Rwf
                    </div>
                  </div>
                )}

              {/* ================= PAYMENT PROOF ================= */}
              {(viewDetail.paymentProof ||
                viewDetail.paymentScreenshot) && (
                <div
                  style={{
                    marginTop: "20px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    <FontAwesomeIcon icon={faImage} />{" "}
                    Payment Receipt Attached
                  </p>

                  <img
                    src={
                      viewDetail.paymentProof ||
                      viewDetail.paymentScreenshot
                    }
                    alt="Proof"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      marginTop: "10px",
                      border: "1px solid #ddd",
                    }}
                  />
                </div>
              )}

              {/* ================= FOOTER ================= */}
              <div
                style={{
                  marginTop: "30px",
                  fontSize: "11px",
                  textAlign: "center",
                  color: "#bdc3c7",
                }}
              >
                Thank you for choosing Isonga Market!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

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
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  width: "95%",
  maxWidth: "600px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
};

const pdfCanvasStyle = {
  padding: "30px",
  background: "#fff",
  border: "1px solid #f1f1f1",
};

const downloadBtnStyle = {
  background: "#27ae60",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};

const closeBtnStyle = {
  border: "none",
  background: "none",
  cursor: "pointer",
  color: "#333",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "20px",
};

const sectionTitle = {
  borderBottom: "2px solid #f1f1f1",
  paddingBottom: "5px",
  color: "#2c3e50",
  fontSize: "14px",
};

const itemBox = {
  marginTop: "20px",
  background: "#fdfdfd",
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #eee",
};

const itemRowContainer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "15px",
  paddingBottom: "10px",
  borderBottom: "1px solid #f1f1f1",
};

const itemNameStyle = {
  fontWeight: "600",
  fontSize: "14px",
};

const totalStyle = {
  textAlign: "right",
  fontWeight: "bold",
  marginTop: "15px",
  borderTop: "2px solid #eee",
  paddingTop: "10px",
  fontSize: "1.1rem",
  color: "#2c3e50",
};

export default Notifications_Page;