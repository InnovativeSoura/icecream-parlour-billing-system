// frontend/src/pages/CustomerDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaBoxOpen,
  FaCartPlus,
  FaCheckCircle,
  FaClock,
  FaIceCream,
  FaReceipt,
  FaShoppingBag,
  FaSpinner,
  FaWallet,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import api from "../api/api";

import "./CustomerDashboard.css";

const CART_KEY = "icecream_cart";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [cartCount, setCartCount] = useState(0);

  const [orders, setOrders] = useState([]);

  const [ordersLoading, setOrdersLoading] = useState(true);

  // =====================================================
  // CUSTOMER NAME
  // =====================================================

  const customerName =
    user?.name?.trim() ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Customer";

  // =====================================================
  // CART COUNT
  // =====================================================

  const getCartCount = () => {
    try {
      const storedCart = localStorage.getItem(CART_KEY);

      if (!storedCart) {
        return 0;
      }

      const parsedCart = JSON.parse(storedCart);

      if (!Array.isArray(parsedCart)) {
        return 0;
      }

      return parsedCart.reduce(
        (total, item) =>
          total + Number(item?.quantity || 1),
        0
      );
    } catch (error) {
      console.error("Failed to read cart:", error);
      return 0;
    }
  };

  // =====================================================
  // UPDATE CART COUNT
  // =====================================================

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(getCartCount());
    };

    updateCartCount();

    window.addEventListener(
      "cartUpdated",
      updateCartCount
    );

    window.addEventListener(
      "storage",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        updateCartCount
      );

      window.removeEventListener(
        "storage",
        updateCartCount
      );
    };
  }, []);

  // =====================================================
  // FETCH CUSTOMER ORDERS
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);

        const response = await api.get(
          "/orders/my-orders"
        );

        if (!mounted) {
          return;
        }

        const data = response?.data;

        const orderList = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : [];

        setOrders(orderList);
      } catch (error) {
        console.error(
          "Failed to load customer orders:",
          error
        );

        if (mounted) {
          setOrders([]);
        }
      } finally {
        if (mounted) {
          setOrdersLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // GREETING
  // =====================================================

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  }, []);

  // =====================================================
  // NORMALIZE ORDER STATUS
  // =====================================================

  const getOrderStatus = (order) => {
    const status = String(
      order?.status ??
        order?.orderStatus ??
        ""
    )
      .trim()
      .toLowerCase();

    return status || "pending";
  };

  // =====================================================
  // ORDER STATISTICS
  // =====================================================

  const orderStats = useMemo(() => {
    let pending = 0;
    let completed = 0;

    orders.forEach((order) => {
      const status = getOrderStatus(order);

      if (
        [
          "pending",
          "confirmed",
          "processing",
        ].includes(status)
      ) {
        pending += 1;
      }

      if (status === "completed") {
        completed += 1;
      }
    });

    return {
      total: orders.length,
      pending,
      completed,
    };
  }, [orders]);

  // =====================================================
  // RECENT ORDERS
  // =====================================================

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const dateA = new Date(
          a?.createdAt ||
            a?.orderDate ||
            0
        ).getTime();

        const dateB = new Date(
          b?.createdAt ||
            b?.orderDate ||
            0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 3);
  }, [orders]);

  // =====================================================
  // FORMAT ORDER NUMBER
  // =====================================================

  const getOrderNumber = (order) => {
    return (
      order?.orderNumber ||
      order?.number ||
      order?.invoiceNumber ||
      `#${String(
        order?._id ||
          order?.id ||
          ""
      ).slice(-8)}`
    );
  };

  // =====================================================
  // FORMAT ORDER DATE
  // =====================================================

  const getOrderDate = (order) => {
    const rawDate =
      order?.createdAt ||
      order?.orderDate ||
      order?.date;

    if (!rawDate) {
      return "Recent order";
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return "Recent order";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT ORDER TOTAL
  // =====================================================

  const getOrderTotal = (order) => {
    const total =
      Number(
        order?.totalAmount ??
          order?.total ??
          order?.grandTotal ??
          0
      );

    return `₹${total.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =====================================================
  // FORMAT STATUS
  // =====================================================

  const formatStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    const normalized = String(
      status || "pending"
    )
      .trim()
      .toLowerCase();

    if (normalized === "completed") {
      return "completed";
    }

    if (
      [
        "pending",
        "confirmed",
        "processing",
      ].includes(normalized)
    ) {
      return "pending";
    }

    if (
      [
        "cancelled",
        "refunded",
        "failed",
      ].includes(normalized)
    ) {
      return "cancelled";
    }

    return "pending";
  };

  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  const quickActions = [
    {
      title: "Order Ice Cream",
      description:
        "Explore delicious ice creams and desserts.",
      icon: <FaIceCream />,
      path: "/customer/products",
      className: "purple",
    },
    {
      title: "View My Orders",
      description:
        "Track your current and previous orders.",
      icon: <FaShoppingBag />,
      path: "/customer/orders",
      className: "blue",
    },
    {
      title: "View Cart",
      description:
        "Review your selected items and checkout.",
      icon: <FaCartPlus />,
      path: "/customer/cart",
      className: "pink",
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="customer-dashboard-page">

      {/* =================================================
          BACKGROUND DECORATION

          IMPORTANT:
          This page does NOT contain a sidebar or navbar.
          CustomerLayout already provides those.
      ================================================= */}

      <div className="customer-dashboard-glow glow-one" />
      <div className="customer-dashboard-glow glow-two" />
      <div className="customer-dashboard-glow glow-three" />

      <div className="customer-dashboard-container">

        {/* =================================================
            HERO
        ================================================= */}

        <motion.section
          className="customer-dashboard-hero"
          initial={{
            opacity: 0,
            y: 24,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            ease: "easeOut",
          }}
        >

          <div className="hero-content">

            <span className="hero-eyebrow">
              CUSTOMER PORTAL
            </span>

            <h1>
              {greeting},{" "}
              <strong>
                {customerName}!
              </strong>
            </h1>

            <p>
              Treat yourself today. Discover your
              favourite ice creams, place an order,
              and enjoy every scoop.
            </p>

            <motion.button
              type="button"
              className="hero-primary-button"
              onClick={() =>
                navigate(
                  "/customer/products"
                )
              }
              whileHover={{
                y: -3,
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.97,
              }}
            >
              <FaIceCream />

              <span>
                Explore Ice Cream
              </span>

              <FaArrowRight />
            </motion.button>

          </div>

          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <div className="hero-visual">

            <div className="hero-circle hero-circle-one" />

            <div className="hero-circle hero-circle-two" />

            <div className="hero-floating-icon hero-icon-one">
              <FaIceCream />
            </div>

            <div className="hero-floating-icon hero-icon-two">
              <FaShoppingBag />
            </div>

            <div className="hero-floating-icon hero-icon-three">
              <FaReceipt />
            </div>

            <div className="hero-main-icon">
              <FaIceCream />
            </div>

          </div>

        </motion.section>

        {/* =================================================
            ACTIVITY HEADER
        ================================================= */}

        <motion.div
          className="dashboard-section-heading"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
        >

          <div>
            <span>
              OVERVIEW
            </span>

            <h2>
              Your Activity
            </h2>
          </div>

        </motion.div>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="customer-stats-grid">

          {/* TOTAL ORDERS */}

          <motion.article
            className="customer-stat-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
            }}
            whileHover={{
              y: -4,
            }}
            onClick={() =>
              navigate(
                "/customer/orders"
              )
            }
          >

            <div className="stat-icon purple">
              <FaShoppingBag />
            </div>

            <div className="stat-info">

              <span>
                Total Orders
              </span>

              <strong>
                {ordersLoading
                  ? "—"
                  : orderStats.total}
              </strong>

            </div>

            <div className="stat-decoration" />

          </motion.article>

          {/* PENDING ORDERS */}

          <motion.article
            className="customer-stat-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            whileHover={{
              y: -4,
            }}
            onClick={() =>
              navigate(
                "/customer/orders"
              )
            }
          >

            <div className="stat-icon orange">
              <FaClock />
            </div>

            <div className="stat-info">

              <span>
                Pending Orders
              </span>

              <strong>
                {ordersLoading
                  ? "—"
                  : orderStats.pending}
              </strong>

            </div>

            <div className="stat-decoration" />

          </motion.article>

          {/* COMPLETED ORDERS */}

          <motion.article
            className="customer-stat-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
            }}
            whileHover={{
              y: -4,
            }}
            onClick={() =>
              navigate(
                "/customer/orders"
              )
            }
          >

            <div className="stat-icon green">
              <FaCheckCircle />
            </div>

            <div className="stat-info">

              <span>
                Completed Orders
              </span>

              <strong>
                {ordersLoading
                  ? "—"
                  : orderStats.completed}
              </strong>

            </div>

            <div className="stat-decoration" />

          </motion.article>

          {/* CART */}

          <motion.article
            className="customer-stat-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            whileHover={{
              y: -4,
            }}
            onClick={() =>
              navigate(
                "/customer/cart"
              )
            }
          >

            <div className="stat-icon pink">
              <FaWallet />
            </div>

            <div className="stat-info">

              <span>
                Cart Items
              </span>

              <strong>
                {cartCount}
              </strong>

            </div>

            <div className="stat-decoration" />

          </motion.article>

        </section>

        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <motion.div
          className="dashboard-section-heading quick-heading"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.35,
          }}
        >

          <div>

            <span>
              QUICK ACCESS
            </span>

            <h2>
              What would you like to do?
            </h2>

          </div>

        </motion.div>

        <section className="customer-quick-grid">

          {quickActions.map(
            (action, index) => (
              <motion.button
                type="button"
                key={action.title}
                className="customer-quick-card"
                onClick={() =>
                  navigate(action.path)
                }
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    0.4 +
                    index * 0.08,
                }}
                whileHover={{
                  y: -4,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >

                <div
                  className={`quick-icon ${action.className}`}
                >
                  {action.icon}
                </div>

                <div className="quick-content">

                  <strong>
                    {action.title}
                  </strong>

                  <span>
                    {action.description}
                  </span>

                </div>

                <div className="quick-arrow">
                  <FaArrowRight />
                </div>

              </motion.button>
            )
          )}

        </section>

        {/* =================================================
            RECENT ORDERS HEADER
        ================================================= */}

        <motion.div
          className="dashboard-section-heading recent-heading"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.65,
          }}
        >

          <div>

            <span>
              ORDER HISTORY
            </span>

            <h2>
              Recent Orders
            </h2>

          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() =>
              navigate(
                "/customer/orders"
              )
            }
          >
            View All
            <FaArrowRight />
          </button>

        </motion.div>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <motion.section
          className="recent-orders-card"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.7,
          }}
        >

          {ordersLoading ? (

            <div className="recent-empty-icon">
              <FaSpinner className="spin" />
            </div>

          ) : recentOrders.length === 0 ? (

            <>
              <div className="recent-empty-icon">
                <FaBoxOpen />
              </div>

              <span className="recent-empty-label">
                ORDER HISTORY
              </span>

              <h3>
                No orders yet
              </h3>

              <p>
                Your recent orders will appear
                here once you place your first order.
              </p>

              <motion.button
                type="button"
                className="start-shopping-button"
                onClick={() =>
                  navigate(
                    "/customer/products"
                  )
                }
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.97,
                }}
              >
                Start Shopping
                <FaArrowRight />
              </motion.button>
            </>

          ) : (

            <div className="recent-orders-list">

              {recentOrders.map(
                (order, index) => {

                  const status =
                    getOrderStatus(
                      order
                    );

                  return (
                    <motion.button
                      key={
                        order?._id ||
                        order?.id ||
                        index
                      }
                      type="button"
                      className="recent-order-row"
                      onClick={() =>
                        navigate(
                          "/customer/orders"
                        )
                      }
                      whileHover={{
                        y: -2,
                      }}
                    >

                      <div className="recent-order-icon">
                        <FaReceipt />
                      </div>

                      <div className="recent-order-info">

                        <strong>
                          {getOrderNumber(
                            order
                          )}
                        </strong>

                        <span>
                          {getOrderDate(
                            order
                          )}
                        </span>

                      </div>

                      <div className="recent-order-total">
                        {getOrderTotal(
                          order
                        )}
                      </div>

                      <span
                        className={`recent-order-status ${getStatusClass(
                          status
                        )}`}
                      >
                        {formatStatus(
                          status
                        )}
                      </span>

                      <FaArrowRight className="recent-order-arrow" />

                    </motion.button>
                  );
                }
              )}

            </div>

          )}

        </motion.section>

        {/* =================================================
            CART NOTICE
        ================================================= */}

        {cartCount > 0 && (
          <motion.button
            type="button"
            className="dashboard-cart-notice"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.8,
            }}
            onClick={() =>
              navigate(
                "/customer/cart"
              )
            }
            whileHover={{
              y: -3,
            }}
          >

            <div className="cart-notice-icon">
              <FaCartPlus />
            </div>

            <div className="cart-notice-content">

              <strong>
                You have {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}{" "}
                in your cart
              </strong>

              <span>
                Continue your order whenever
                you're ready.
              </span>

            </div>

            <FaArrowRight className="cart-notice-arrow" />

          </motion.button>
        )}

      </div>
    </div>
  );
};

export default CustomerDashboard;