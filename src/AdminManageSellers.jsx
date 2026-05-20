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
  faShop,
  faSpinner,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import "./Buyer_Dashboard.css";

function AdminManageSellers() {
  const navigate = useNavigate();

  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalMedia, setModalMedia] = useState({
    sellerId: null,
    index: 0,
  });

  const socketRef = useRef(null);

  /* ---------------- CATEGORY ROUTES ---------------- */

  const productCategories = [
    "Fashion",
    "Electronics",
    "Furniture",
    "Construction",
    "Food",
  ];

  const serviceCategories = [
    "services",
    "Hospitality",
  ];

  const assetCategories = [
    "RealEstate",
    "Vehicles",
    "Livestock",
  ];

  const getSellerRoute = (category, id) => {
    if (productCategories.includes(category)) {
      return `/DeleteProducts/${id}`;
    }

    if (serviceCategories.includes(category)) {
      return `/DeleteServices/${id}`;
    }

    if (assetCategories.includes(category)) {
      return `/DeleteAssets/${id}`;
    }

    return `/DeleteProducts/${id}`;
  };

  /* ---------------- FETCH SELLERS ---------------- */

  useEffect(() => {
    const fetchAdminSellers = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const res = await api.get(
          "/api/admin/dashboard-sellers",
          config
        );

        if (res.data.success) {
          const sellersData = (res.data.sellers || []).map(
            (seller) => ({
              ...seller,
              averageRating:
                seller.averageRating || 0,
              numReviews:
                seller.numReviews || 0,
              isVerified:
                seller.isVerified ?? false,
              isSuspended:
                seller.isSuspended ?? false,
            })
          );

          setSellers(sellersData);
          setFilteredSellers(sellersData);

          const indexes = {};

          sellersData.forEach((seller) => {
            indexes[seller._id] = 0;
          });

          setCurrentImageIndex(indexes);
        }
      } catch (err) {
        console.error(
          "Fetch sellers error:",
          err
        );

        toast.error(
          err?.response?.data?.message ||
            "Failed to load sellers"
        );

        if (
          err?.response?.status === 401 ||
          err?.response?.status === 403
        ) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminSellers();
  }, [navigate]);

  /* ---------------- SOCKET ---------------- */

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    socketRef.current = io(
      "https://api.isongamarket.com",
      {
        auth: { token },
        transports: ["websocket", "polling"],
      }
    );

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Admin socket connected");
    });

    socket.on("newSeller", (data) => {
      toast.success(
        data?.message ||
          "New seller registered"
      );

      fetchLatestSellers();
    });

    return () => {
      socket.off("newSeller");

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchLatestSellers = async () => {
    try {
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await api.get(
        "/api/admin/dashboard-sellers",
        config
      );

      if (res.data.success) {
        setSellers(res.data.sellers || []);
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------- SEARCH ---------------- */

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
      return;
    }

    const q = searchQuery.toLowerCase();

    const filtered = sellers.filter(
      (seller) =>
        seller.name
          ?.toLowerCase()
          .includes(q) ||
        seller.category
          ?.toLowerCase()
          .includes(q) ||
        seller.location
          ?.toLowerCase()
          .includes(q) ||
        seller.email
          ?.toLowerCase()
          .includes(q)
    );

    setFilteredSellers(filtered);
  }, [searchQuery, sellers]);

  /* ---------------- IMAGE SLIDER ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const updated = { ...prev };

        filteredSellers.forEach((seller) => {
          if (
            seller.files &&
            seller.files.length > 1
          ) {
            const current =
              prev[seller._id] || 0;

            updated[seller._id] =
              (current + 1) %
              seller.files.length;
          }
        });

        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [filteredSellers]);

  /* ---------------- HELPERS ---------------- */

  const isVideoFile = (filename) => {
    return /\.(mp4|webm|ogg|mov)$/i.test(
      filename
    );
  };

  const getFileUrl = (path) => {
    if (!path) {
      return "/placeholder.png";
    }

    if (path.startsWith("http")) {
      return path;
    }

    return `https://api.isongamarket.com/uploads/${path}`;
  };

  /* ---------------- VERIFY SELLER ---------------- */

  const handleToggleVerify = async (
    sellerId,
    currentStatus
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await api.put(
        `/api/admin/sellers/${sellerId}/verify`,
        {
          verify: !currentStatus,
        },
        config
      );

      if (res.data.success) {
        setSellers((prev) =>
          prev.map((seller) =>
            seller._id === sellerId
              ? {
                  ...seller,
                  isVerified:
                    !currentStatus,
                }
              : seller
          )
        );

        toast.success(
          currentStatus
            ? "Seller verification removed"
            : "Seller verified successfully"
        );
      }
    } catch (err) {
      console.log(err);

      toast.error(
        err?.response?.data?.message ||
          "Verification failed"
      );
    }
  };

  /* ---------------- SUSPEND SELLER ---------------- */

  const handleToggleSuspend = async (
    sellerId,
    currentStatus
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await api.put(
        `/api/admin/sellers/${sellerId}/suspend`,
        {
          suspend: !currentStatus,
        },
        config
      );

      if (res.data.success) {
        setSellers((prev) =>
          prev.map((seller) =>
            seller._id === sellerId
              ? {
                  ...seller,
                  isSuspended:
                    !currentStatus,
                }
              : seller
          )
        );

        toast.success(
          currentStatus
            ? "Seller unsuspended"
            : "Seller suspended"
        );
      }
    } catch (err) {
      console.log(err);

      toast.error(
        err?.response?.data?.message ||
          "Suspend action failed"
      );
    }
  };

  /* ---------------- DELETE SELLER ---------------- */

  const handleDeleteSeller = async (
    sellerId
  ) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this seller?"
    );

    if (!confirmDelete) return;

    try {
      const token =
        localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await api.delete(
        `/api/admin/sellers/${sellerId}`,
        config
      );

      if (res.data.success) {
        setSellers((prev) =>
          prev.filter(
            (seller) =>
              seller._id !== sellerId
          )
        );

        toast.success(
          "Seller deleted successfully"
        );
      }
    } catch (err) {
      console.log(err);

      toast.error(
        err?.response?.data?.message ||
          "Delete failed"
      );
    }
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="beautiful-loading">
        <div className="text-center bg-white/20 backdrop-blur-lg p-10 rounded-3xl border border-white/30 shadow-2xl">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            size="3x"
            className="mb-4"
          />

          <h2>
            Loading Seller Management...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="Buyer_Dashboard">
      <Toaster position="top-center" />

      {/* ---------------- NAVBAR ---------------- */}

      <div className="Buyer_Dashboard_navbar">
        <div className="Buyer_Dashboard_logos">
          <img
            src="/logo.png"
            alt="logo"
          />
        </div>

        <div className="Buyer_Dashboard_heads">
          <h1>Admin</h1>
          <h2>Portal</h2>
        </div>

        <div className="Buyer_Dashboard_nav">
          <button
            onClick={() =>
              navigate(-1)
            }
            style={{
              background: "transparent",
              color: "white",
              border:
                "1px solid white",
              padding: "8px 14px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
            />
            Dashboard
          </button>
        </div>

        <div className="Buyer_Dashboard_Logout">
          <button
            onClick={() => {
              localStorage.removeItem(
                "token"
              );

              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ---------------- HEADING ---------------- */}

      <div className="Buyer_Dashboard_Heading">
        <h1>
          Manage Marketplace Sellers
        </h1>

        <p>
          Verify, suspend, monitor,
          and manage all seller
          accounts.
        </p>
      </div>

      {/* ---------------- SEARCH ---------------- */}

      <div className="Buyer_Dashboard_search">
        <input
          type="text"
          placeholder="Search sellers..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(
              e.target.value
            )
          }
        />

        <button>
          <FontAwesomeIcon
            icon={faSearch}
          />
        </button>
      </div>

      {/* ---------------- SELLERS ---------------- */}

      <div className="shop-grid">
        {filteredSellers.length > 0 ? (
          filteredSellers.map(
            (seller) => {
              const activeIdx =
                currentImageIndex[
                  seller._id
                ] || 0;

              return (
                <div
                  key={seller._id}
                  className="shop-card"
                  style={{
                    border:
                      seller.isSuspended
                        ? "2px solid red"
                        : seller.isVerified
                        ? "1px solid #ddd"
                        : "2px solid orange",
                  }}
                >
                  {/* IMAGE */}

                  <div className="card-image-section">
                    {seller.files &&
                    seller.files.length >
                      0 ? (
                      <div className="image-slider">
                        {isVideoFile(
                          seller.files[
                            activeIdx
                          ]
                        ) ? (
                          <video
                            src={getFileUrl(
                              seller
                                .files[
                                activeIdx
                              ]
                            )}
                            className="slider-image"
                            muted
                            autoPlay
                            loop
                            onClick={() =>
                              setModalMedia(
                                {
                                  sellerId:
                                    seller._id,
                                  index:
                                    activeIdx,
                                }
                              )
                            }
                          />
                        ) : (
                          <img
                            src={getFileUrl(
                              seller
                                .files[
                                activeIdx
                              ]
                            )}
                            alt={
                              seller.name
                            }
                            className="slider-image"
                            onClick={() =>
                              setModalMedia(
                                {
                                  sellerId:
                                    seller._id,
                                  index:
                                    activeIdx,
                                }
                              )
                            }
                          />
                        )}

                        {seller.files
                          .length >
                          1 && (
                          <div className="slider-dots">
                            {seller.files.map(
                              (
                                _,
                                idx
                              ) => (
                                <span
                                  key={
                                    idx
                                  }
                                  className={`dot ${
                                    idx ===
                                    activeIdx
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setCurrentImageIndex(
                                      (
                                        prev
                                      ) => ({
                                        ...prev,
                                        [seller._id]:
                                          idx,
                                      })
                                    )
                                  }
                                ></span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src="/placeholder.png"
                        alt="placeholder"
                        className="slider-image"
                      />
                    )}
                  </div>

                  {/* PROFILE */}

                  <Link
                    to={`/AdminProfile/${seller._id}`}
                    className="profile-avatar"
                  >
                    <img
                      src={
                        seller.profile
                          ? getFileUrl(
                              seller.profile
                            )
                          : "/placeholder.png"
                      }
                      alt={seller.name}
                      className="avatar-image"
                    />
                  </Link>

                  {/* INFO */}

                  <div className="shop-card-info">
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                      }}
                    >
                      <h3>
                        {seller.name} Shop
                      </h3>

                      <span
                        style={{
                          fontSize:
                            "12px",
                          fontWeight:
                            "bold",
                          color:
                            seller.isVerified
                              ? "green"
                              : "orange",
                        }}
                      >
                        {seller.isVerified
                          ? "Verified"
                          : "Pending"}
                      </span>
                    </div>

                    <p>
                      {
                        seller.location
                      }
                    </p>

                    <p>
                      {
                        seller.category
                      }
                    </p>

                    <div className="rating">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <FontAwesomeIcon
                            key={star}
                            icon={faStar}
                            color={
                              seller.averageRating >=
                              star
                                ? "gold"
                                : "gray"
                            }
                          />
                        )
                      )}

                      <span>
                        (
                        {
                          seller.numReviews
                        }
                        )
                      </span>
                    </div>

                    <p>
                      {seller.description ||
                        "No description"}
                    </p>

                    {/* ACTIONS */}

                    <div
                      className="card-actions"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: "10px",
                        marginTop:
                          "15px",
                      }}
                    >
                      <Link
                        to={getSellerRoute(
                          seller.category,
                          seller._id
                        )}
                      >
                        <button className="visit-btn">
                          <FontAwesomeIcon
                            icon={faEye}
                          />
                          Visit Shop
                        </button>
                      </Link>

                      <button
                        onClick={() =>
                          handleToggleVerify(
                            seller._id,
                            seller.isVerified
                          )
                        }
                        style={{
                          background:
                            seller.isVerified
                              ? "#f59e0b"
                              : "#10b981",
                          color:
                            "white",
                          border:
                            "none",
                          borderRadius:
                            "8px",
                          padding:
                            "10px",
                          cursor:
                            "pointer",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            seller.isVerified
                              ? faUserXmark
                              : faUserCheck
                          }
                        />{" "}
                        {seller.isVerified
                          ? "Unverify"
                          : "Verify"}
                      </button>

                      <button
                        onClick={() =>
                          handleToggleSuspend(
                            seller._id,
                            seller.isSuspended
                          )
                        }
                        style={{
                          background:
                            seller.isSuspended
                              ? "#6b7280"
                              : "#ef4444",
                          color:
                            "white",
                          border:
                            "none",
                          borderRadius:
                            "8px",
                          padding:
                            "10px",
                          cursor:
                            "pointer",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            faTriangleExclamation
                          }
                        />{" "}
                        {seller.isSuspended
                          ? "Unsuspend"
                          : "Suspend"}
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteSeller(
                            seller._id
                          )
                        }
                        style={{
                          background:
                            "#dc2626",
                          color:
                            "white",
                          border:
                            "none",
                          borderRadius:
                            "8px",
                          padding:
                            "10px",
                          cursor:
                            "pointer",
                          gridColumn:
                            "1 / -1",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            faTrashCan
                          }
                        />{" "}
                        Delete Seller
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )
        ) : (
          <p className="no-sellers-msg">
            No sellers found
          </p>
        )}
      </div>

      {/* ---------------- MODAL ---------------- */}

      {modalMedia.sellerId &&
        createPortal(
          (() => {
            const seller =
              sellers.find(
                (s) =>
                  s._id ===
                  modalMedia.sellerId
              );

            if (!seller) return null;

            const file =
              seller.files[
                modalMedia.index
              ];

            return (
              <div
                className="media-modal"
                onClick={() =>
                  setModalMedia({
                    sellerId: null,
                    index: 0,
                  })
                }
              >
                <span
                  className="close-btn"
                  onClick={() =>
                    setModalMedia({
                      sellerId: null,
                      index: 0,
                    })
                  }
                >
                  &times;
                </span>

                {isVideoFile(file) ? (
                  <video
                    src={getFileUrl(
                      file
                    )}
                    controls
                    autoPlay
                    className="full-media"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  />
                ) : (
                  <img
                    src={getFileUrl(
                      file
                    )}
                    alt="preview"
                    className="full-media"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  />
                )}

                <div className="modal-controls">
                  <FontAwesomeIcon
                    icon={
                      faChevronLeft
                    }
                    className="modal-arrow"
                    onClick={(e) => {
                      e.stopPropagation();

                      setModalMedia(
                        (prev) => ({
                          ...prev,
                          index:
                            (prev.index -
                              1 +
                              seller.files
                                .length) %
                            seller.files
                              .length,
                        })
                      );
                    }}
                  />

                  <FontAwesomeIcon
                    icon={
                      faChevronRight
                    }
                    className="modal-arrow"
                    onClick={(e) => {
                      e.stopPropagation();

                      setModalMedia(
                        (prev) => ({
                          ...prev,
                          index:
                            (prev.index +
                              1) %
                            seller.files
                              .length,
                        })
                      );
                    }}
                  />
                </div>
              </div>
            );
          })(),
          document.body
        )}

      {/* ---------------- FOOTER ---------------- */}

      <footer
        className="Buyer_Footer"
        style={{
          marginTop: "40px",
        }}
      >
        <div className="Footer_Bottom">
          <p>
            ©{" "}
            {new Date().getFullYear()}{" "}
            Isonga Market Admin
            Panel
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AdminManageSellers;