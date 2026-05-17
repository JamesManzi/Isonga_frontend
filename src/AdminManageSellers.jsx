import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "./api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faUserCheck,
  faUserXmark,
  faTriangleExclamation,
  faTrashCan,
  faArrowLeft,
  faShop
} from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import "./Buyer_Dashboard.css"; // Reuses your core layout structure and styling token sets

function AdminManageSellers() {
  const navigate = useNavigate();

  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalMedia, setModalMedia] = useState({ sellerId: null, index: 0 });

  // 1. Initial Admin Check and Seller Accounts Fetch
  useEffect(() => {
    const fetchAdminSellers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/buyer_login");
          return;
        }

        // Fetching all store registers via the Admin Management route
        const res = await api.get("/api/admin/dashboard-sellers"); 
        if (res.data.success) {
          const fetchedSellers = res.data.sellers.map(s => ({
            ...s,
            averageRating: s.averageRating || 0,
            numReviews: s.numReviews || 0,
            isVerified: s.isVerified ?? true, // baseline fallback checks
            isSuspended: s.isSuspended ?? false
          }));

          setSellers(fetchedSellers);
          setFilteredSellers(fetchedSellers);

          const indexes = {};
          fetchedSellers.forEach(s => { indexes[s._id] = 0; });
          setCurrentImageIndex(indexes);
        }
      } catch (err) {
        console.error("Admin Fetch Sellers Error:", err);
        // Redirect if route access verification fails (401/403)
        if (err.response?.status === 403 || err.response?.status === 401) {
          alert("Access denied. Admin authorization required.");
          navigate("/buyer_login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAdminSellers();
  }, [navigate]);

  // 2. Real-time Synchronization (Listens for new shops registering live)
  const socketRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!socketRef.current) {
      socketRef.current = io("https://api.isongamarket.com", {
        transports: ["polling", "websocket"],
        auth: { token },
      });
    }

    const socket = socketRef.current;
    socket.on("newSeller", () => {
      // Re-fetch store data silently to display incoming shop applications instantly
      api.get("/api/admin/dashboard-sellers").then(res => {
        if (res.data.success) {
          setSellers(res.data.sellers);
        }
      });
    });

    return () => {
      socket.off("newSeller");
    };
  }, []);

  // 3. Filter / Search Execution
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredSellers(
      sellers.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, sellers]);

  // 4. Auto-playing Media Sliders
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const newIndexes = { ...prev };
        filteredSellers.forEach((seller) => {
          if (seller.files && seller.files.length > 1) {
            const currentIndex = prev[seller._id] || 0;
            newIndexes[seller._id] = (currentIndex + 1) % seller.files.length;
          }
        });
        return newIndexes;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [filteredSellers]);

  // 5. Admin Management Control Triggers
  const handleToggleVerify = async (sellerId, currentStatus) => {
    try {
      const res = await api.put(`/api/admin/sellers/${sellerId}/verify`, { verify: !currentStatus });
      if (res.data.success) {
        setSellers(prev => prev.map(s => s._id === sellerId ? { ...s, isVerified: !currentStatus } : s));
      }
    } catch (err) {
      alert("Failed to alter seller verification parameters.");
    }
  };

  const handleToggleSuspend = async (sellerId, currentStatus) => {
    try {
      const res = await api.put(`/api/admin/sellers/${sellerId}/suspend`, { suspend: !currentStatus });
      if (res.data.success) {
        setSellers(prev => prev.map(s => s._id === sellerId ? { ...s, isSuspended: !currentStatus } : s));
      }
    } catch (err) {
      alert("Failed to modify account operational clearance status.");
    }
  };

  const handleDeleteSeller = async (sellerId) => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently purge this shop from Isonga Market? This removes all associated items and data permanently.")) {
      return;
    }
    try {
      const res = await api.delete(`/api/admin/sellers/${sellerId}`);
      if (res.data.success) {
        setSellers(prev => prev.filter(s => s._id !== sellerId));
        alert("Store records successfully purged.");
      }
    } catch (err) {
      alert("Purge operation dropped due to backend response failure.");
    }
  };

  const isVideoFile = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);
  const getFileUrl = (path) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("http")) return path;
    return `https://api.isongamarket.com/uploads/${path}`;
  };

  if (loading) {
    return (
      <div className="beautiful-loading">
        <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-3xl border border-white/30 shadow-2xl">
          <div className="loader-dots flex space-x-2 justify-center mb-4">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          </div>
          <h2 className="text-white font-bold text-xl tracking-widest">ADMIN PORTAL</h2>
          <p className="text-white/80 text-sm">Mapping marketplace stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Buyer_Dashboard Admin_Management_View">
      {/* Top Navbar Header */}
      <div className="Buyer_Dashboard_navbar">
        <div className="Buyer_Dashboard_logos"><img src="/logo.png" alt="Logo" /></div>
        <div className="Buyer_Dashboard_heads"><h1>Admin</h1><h2>Control</h2></div>
        <div className="Buyer_Dashboard_nav">
          <button onClick={() => navigate(-1)} style={{ background: "transparent", color: "white", border: "1px solid white", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <FontAwesomeIcon icon={faArrowLeft} /> Dashboard Home
          </button>
        </div>
        <div className="Buyer_Dashboard_Logout">
          <button onClick={() => { localStorage.removeItem("token"); navigate("/buyer_login"); }}>Exit Portal</button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="Buyer_Dashboard_Heading">
        <h1>Marketplace Shop Moderation Center 👑</h1>
        <p>Monitor profiles, handle security clearance verifications, or remove non-compliant vendor accounts globally.</p>
      </div>

      {/* Control Search Row */}
      <div className="Buyer_Dashboard_search">
        <input type="text" placeholder="Filter stores by name, niche domain category, active region location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button><FontAwesomeIcon icon={faSearch} /></button>
      </div>

      {/* Responsive Store Processing Grid Layout */}
      <div className="shop-grid">
        {filteredSellers.length > 0 ? (
          filteredSellers.map((seller) => {
            const activeIdx = currentImageIndex[seller._id] || 0;
            return (
              <div 
                key={seller._id} 
                className="shop-card" 
                style={{ 
                  border: seller.isSuspended ? "2px solid #dc3545" : !seller.isVerified ? "2px solid #ffc107" : "1px solid #e2e8f0",
                  opacity: seller.isSuspended ? 0.75 : 1 
                }}
              >
                {/* Media Presentation Container */}
                <div className="card-image-section" style={{ position: "relative" }}>
                  {seller.isSuspended && (
                    <span style={{ position: "absolute", top: "10px", left: "10px", background: "#dc3545", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", zIndex: 10 }}>
                      <FontAwesomeIcon icon={faTriangleExclamation} /> SUSPENDED
                    </span>
                  )}
                  {seller.files && seller.files.length > 0 ? (
                    <div className="image-slider">
                      {isVideoFile(seller.files[activeIdx]) ? (
                        <video src={getFileUrl(seller.files[activeIdx])} muted autoPlay loop className="slider-image" onClick={() => setModalMedia({ sellerId: seller._id, index: activeIdx })} />
                      ) : (
                        <img src={getFileUrl(seller.files[activeIdx])} alt={seller.name} className="slider-image" onClick={() => setModalMedia({ sellerId: seller._id, index: activeIdx })} />
                      )}
                      {seller.files.length > 1 && (
                        <div className="slider-dots">
                          {seller.files.map((_, idx) => (
                            <span key={idx} className={`dot ${idx === activeIdx ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => ({ ...prev, [seller._id]: idx })); }}></span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <img src="/placeholder.png" alt="no documentation assets" className="slider-image" />
                  )}
                </div>

                {/* Profile Icon Overlay */}
                <div className="profile-avatar">
                  <img src={seller.profile ? getFileUrl(seller.profile) : "/placeholder.png"} alt={seller.name} className="avatar-image" />
                </div>

                {/* Descriptive Core Store Profiling Text Metadata */}
                <div className="shop-card-info" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0 }}>{seller.name} Shop</h3>
                    <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", background: seller.isVerified ? "#e6fffa" : "#fffbeb", color: seller.isVerified ? "#319795" : "#b7791f" }}>
                      {seller.isVerified ? "Verified ✅" : "Pending Auth ⏳"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0" }}><b>Niche Domain:</b> {seller.category} Segment</p>
                  <p style={{ margin: "2px 0" }}><b>Regional Point:</b> {seller.location}</p>
                  <p style={{ margin: "2px 0", fontSize: "12px", color: "#4a5568" }}><b>System ID Email:</b> {seller.email || "No direct login mail attached"}</p>
                  
                  {/* Informational Rating Components */}
                  <div className="rating" style={{ margin: "6px 0" }}>
                    {(() => {
                      const stars = [];
                      for (let i = 1; i <= 5; i++) {
                        stars.push(<FontAwesomeIcon key={i} icon={faStar} color={seller.averageRating >= i ? "gold" : "gray"} />);
                      }
                      return stars;
                    })()}
                    <span style={{ fontSize: "12px", marginLeft: "4px" }}>({seller.numReviews} active consumer evaluations)</span>
                  </div>

                  <p style={{ fontSize: "13px", color: "#718096", flexGrow: 1 }}>{seller.description || "Vendor hasn't populated a description summary statement yet."}</p>
                  
                  {/* Dedicated System Administration Modification Grid Interface Blocks */}
                  <div className="admin-controls-grid" style={{ marginTop: "14px", borderTop: "1px dashed #cbd5e0", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    
                    <button 
                      onClick={() => handleToggleVerify(seller._id, seller.isVerified)}
                      style={{ background: seller.isVerified ? "#ecc94b" : "#48bb78", color: "white", padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}
                    >
                      <FontAwesomeIcon icon={seller.isVerified ? faUserXmark : faUserCheck} />
                      {seller.isVerified ? "Revoke Status" : "Verify Store"}
                    </button>

                    <button 
                      onClick={() => handleToggleSuspend(seller._id, seller.isSuspended)}
                      style={{ background: seller.isSuspended ? "#4a5568" : "#ed8936", color: "white", padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}
                    >
                      <FontAwesomeIcon icon={faTriangleExclamation} />
                      {seller.isSuspended ? "Unsuspend" : "Freeze/Lock"}
                    </button>

                    <button 
                      onClick={() => handleDeleteSeller(seller._id)}
                      style={{ gridColumn: "1 / -1", background: "#e53e3e", color: "white", padding: "9px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px" }}
                    >
                      <FontAwesomeIcon icon={faTrashCan} /> Hard Purge From System
                    </button>
                    
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-sellers-msg" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>No active seller records match your specified lookup parameters.</p>
        )}
      </div>

      {/* Immersive Portal-Mounted Multi-Media Preview Layer */}
      {modalMedia.sellerId && createPortal(
        (() => {
          const seller = sellers.find(s => s._id === modalMedia.sellerId);
          if (!seller) return null;
          const file = seller.files[modalMedia.index];
          return (
            <div className="media-modal" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>
              <span className="close-btn" onClick={() => setModalMedia({ sellerId: null, index: 0 })}>&times;</span>
              {isVideoFile(file) ? (
                <video src={getFileUrl(file)} controls autoPlay className="full-media" onClick={(e) => e.stopPropagation()} />
              ) : (
                <img src={getFileUrl(file)} alt="Full view" className="full-media" onClick={(e) => e.stopPropagation()} />
              )}
              <div className="modal-controls">
                <FontAwesomeIcon icon={faChevronLeft} className="modal-arrow" onClick={(e) => { e.stopPropagation(); setModalMedia((p) => ({ ...p, index: (p.index - 1 + seller.files.length) % seller.files.length })); }} />
                <FontAwesomeIcon icon={faChevronRight} className="modal-arrow" onClick={(e) => { e.stopPropagation(); setModalMedia((p) => ({ ...p, index: (p.index + 1) % seller.files.length })); }} />
              </div>
            </div>
          );
        })(), document.body
      )}

      {/* Core Footer Element */}
      <footer className="Buyer_Footer" style={{ marginTop: "40px" }}>
        <div className="Footer_Bottom">
          <p>&copy; {new Date().getFullYear()} Isonga Market Admin Portal • Operational Control Mode 🇷🇼</p>
        </div>
      </footer>
    </div>
  );
}

export default AdminManageSellers;