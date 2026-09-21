import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaBoxOpen,
  FaBoxes,
  FaCheckCircle,
  FaClipboardList,
  FaCube,
  FaExclamationTriangle,
  FaIceCream,
  FaPlus,
  FaShoppingBag,
  FaUsers,
  FaChartLine,
  FaDatabase,
  FaShieldAlt,
  FaServer,
  FaSyncAlt,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

import "./AdminDashboard.css";

const getArray = (response, keys = []) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};

const getNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatCurrency = (value) => {
  return `₹${getNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getOrderTotal = (order) => {
  return getNumber(
    order?.grandTotal ??
      order?.totalAmount ??
      order?.total ??
      order?.amount ??
      0,
  );
};

const getOrderPaymentStatus = (order) => {
  return String(order?.paymentStatus || "")
    .trim()
    .toLowerCase();
};

const getStockValue = (item) => {
  return getNumber(
    item?.quantity ??
      item?.stock ??
      item?.currentStock ??
      item?.availableQuantity ??
      item?.stockQuantity ??
      0,
  );
};

const getInitials = (name = "") => {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "AD"
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    inventory: 0,
    lowStock: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const loadDashboard = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const results = await Promise.allSettled([
        api.get("/products"),
        api.get("/customers"),
        api.get("/inventory"),
        api.get("/orders"),
      ]);

      const products =
        results[0].status === "fulfilled"
          ? getArray(results[0].value, ["products"])
          : [];

      const customers =
        results[1].status === "fulfilled"
          ? getArray(results[1].value, ["customers"])
          : [];

      const inventory =
        results[2].status === "fulfilled"
          ? getArray(results[2].value, ["inventory", "items"])
          : [];

      const orders =
        results[3].status === "fulfilled"
          ? getArray(results[3].value, ["orders"])
          : [];

      const lowStockItems = inventory.filter((item) => {
        const stock = getStockValue(item);

        const threshold = getNumber(
          item?.lowStockThreshold ??
            item?.reorderLevel ??
            item?.minimumStock ??
            5,
        );

        return stock <= threshold;
      });

      const collectedRevenue = orders
        .filter((order) => {
          const paymentStatus = getOrderPaymentStatus(order);

          return (
            paymentStatus === "paid" ||
            paymentStatus === "captured" ||
            paymentStatus === "completed"
          );
        })
        .reduce((total, order) => total + getOrderTotal(order), 0);

      const sortedOrders = [...orders]
        .sort(
          (a, b) =>
            new Date(b?.createdAt || b?.date || 0) -
            new Date(a?.createdAt || a?.date || 0),
        )
        .slice(0, 4);

      setStats({
        products: products.length,
        customers: customers.length,
        inventory: inventory.length,
        lowStock: lowStockItems.length,
        revenue: collectedRevenue,
      });

      setRecentOrders(sortedOrders);
      setInventoryItems(lowStockItems.slice(0, 4));
    } catch (error) {
      console.error("Admin dashboard loading failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const firstName = useMemo(() => {
    return (
      user?.name?.trim()?.split(" ")[0] || user?.email?.split("@")[0] || "Admin"
    );
  }, [user]);

  const avatar = getInitials(user?.name || "Admin");

  const handleLogout = () => {
    logout();
  };

  const quickActions = [
    {
      title: "Products",
      description: "Manage ice cream catalogue",
      icon: FaIceCream,
      className: "purple",
      path: "/admin/products",
    },
    {
      title: "Inventory",
      description: "Monitor stock levels",
      icon: FaBoxes,
      className: "orange",
      path: "/admin/inventory",
    },
    {
      title: "Customers",
      description: "View customer records",
      icon: FaUsers,
      className: "green",
      path: "/admin/customers",
    },
  ];

  const systemStatus = [
    {
      title: "Application",
      description: "Server operational",
      value: "Online",
      icon: FaServer,
    },
    {
      title: "Authentication",
      description: "Secure session active",
      value: "Secure",
      icon: FaShieldAlt,
    },
    {
      title: "Database",
      description: "Database connected",
      value: "Connected",
      icon: FaDatabase,
    },
  ];

  const getOrderCustomer = (order) => {
    return (
      order?.customerSnapshot?.name ||
      order?.customer?.name ||
      order?.customerName ||
      "Walk-in Customer"
    );
  };

  const getOrderStatus = (order) => {
    return (
      String(order?.status || "pending")
        .trim()
        .toLowerCase() || "pending"
    );
  };

  const getOrderNumber = (order) => {
    return (
      order?.orderNumber ||
      order?.invoiceNumber ||
      order?._id?.slice(-8)?.toUpperCase() ||
      "ORDER"
    );
  };

  const formatDate = (date) => {
    if (!date) return "Today";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Today";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="admin-dashboard-page">
      <motion.section
        className="admin-dashboard-intro"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="admin-dashboard-intro-copy">
          <span className="admin-dashboard-eyebrow">OVERVIEW</span>

          <h1>
            Welcome back, {firstName}
            <span className="admin-wave">👋</span>
          </h1>

          <p>
            Here&apos;s what&apos;s happening with your ice cream parlour today.
          </p>
        </div>

        <div className="admin-dashboard-intro-actions">
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            <FaSyncAlt className={refreshing ? "admin-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>

          <button
            type="button"
            className="admin-primary-btn"
            onClick={() => navigate("/admin/products")}
          >
            <FaPlus />
            Manage Products
          </button>
        </div>
      </motion.section>

      <section className="admin-dashboard-stats">
        <motion.article
          className="admin-stat-card purple"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="admin-stat-icon">
            <FaCube />
          </div>

          <div className="admin-stat-content">
            <span className="admin-stat-label">TOTAL PRODUCTS</span>

            <strong>{loading ? "—" : stats.products}</strong>

            <small>
              <FaCheckCircle />
              Available in catalogue
            </small>
          </div>
        </motion.article>

        <motion.article
          className="admin-stat-card orange"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="admin-stat-icon">
            <FaUsers />
          </div>

          <div className="admin-stat-content">
            <span className="admin-stat-label">REGISTERED CUSTOMERS</span>

            <strong>{loading ? "—" : stats.customers}</strong>

            <small>
              <FaCheckCircle />
              Customer database
            </small>
          </div>
        </motion.article>

        <motion.article
          className="admin-stat-card green"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="admin-stat-icon">
            <FaBoxes />
          </div>

          <div className="admin-stat-content">
            <span className="admin-stat-label">INVENTORY ITEMS</span>

            <strong>{loading ? "—" : stats.inventory}</strong>

            <small>
              <FaCheckCircle />
              Stock records
            </small>
          </div>
        </motion.article>

        <motion.article
          className="admin-stat-card blue"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="admin-stat-icon">
            <FaShoppingBag />
          </div>

          <div className="admin-stat-content">
            <span className="admin-stat-label">COLLECTED REVENUE</span>

            <strong>{loading ? "—" : formatCurrency(stats.revenue)}</strong>

            <small>
              <FaChartLine />
              Recorded payments
            </small>
          </div>
        </motion.article>
      </section>

      <section className="admin-dashboard-workspace">
        <motion.article
          className="admin-dashboard-panel quick-actions-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="admin-panel-heading">
            <div>
              <span>WORKSPACE</span>
              <h2>Quick Actions</h2>
            </div>

            <div className="admin-panel-heading-icon">
              <FaArrowRight />
            </div>
          </div>

          <div className="admin-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  type="button"
                  key={action.title}
                  className="admin-quick-action"
                  onClick={() => navigate(action.path)}
                >
                  <span
                    className={`admin-quick-action-icon ${action.className}`}
                  >
                    <Icon />
                  </span>

                  <span className="admin-quick-action-copy">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>

                  <span className="admin-quick-action-arrow">
                    <FaArrowRight />
                  </span>
                </button>
              );
            })}
          </div>
        </motion.article>

        <motion.article
          className="admin-dashboard-panel system-status-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="admin-panel-heading">
            <div>
              <span>SYSTEM</span>
              <h2>System Status</h2>
            </div>

            <div className="admin-live-status">
              <i />
              LIVE
            </div>
          </div>

          <div className="admin-system-list">
            {systemStatus.map((item) => {
              const Icon = item.icon;

              return (
                <div className="admin-system-row" key={item.title}>
                  <span className="admin-system-check">
                    <FaCheckCircle />
                  </span>

                  <span className="admin-system-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  <span className="admin-system-value">{item.value}</span>
                </div>
              );
            })}
          </div>
        </motion.article>
      </section>

      <motion.section
        className="admin-dashboard-panel admin-stock-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="admin-panel-heading">
          <div>
            <span>INVENTORY</span>
            <h2>Stock Alerts</h2>
          </div>

          <button
            type="button"
            className="admin-panel-link"
            onClick={() => navigate("/admin/inventory")}
          >
            View Inventory
            <FaArrowRight />
          </button>
        </div>

        {loading ? (
          <div className="admin-stock-loading">
            <FaSyncAlt className="admin-spin" />
            Loading inventory information...
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="admin-stock-success">
            <span className="admin-stock-success-icon">
              <FaCheckCircle />
            </span>

            <div>
              <strong>Inventory looks healthy</strong>
              <p>No low-stock items require immediate attention.</p>
            </div>
          </div>
        ) : (
          <div className="admin-stock-list">
            {inventoryItems.map((item, index) => {
              const stock = getStockValue(item);

              return (
                <div
                  className="admin-stock-row"
                  key={item?._id || item?.id || item?.product?._id || index}
                >
                  <span className="admin-stock-warning-icon">
                    <FaExclamationTriangle />
                  </span>

                  <div className="admin-stock-copy">
                    <strong>
                      {item?.product?.name ||
                        item?.productName ||
                        item?.name ||
                        "Inventory Item"}
                    </strong>

                    <span>
                      Only {stock} unit
                      {stock === 1 ? "" : "s"} remaining
                    </span>
                  </div>

                  <span className="admin-stock-badge">LOW STOCK</span>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      <motion.section
        className="admin-dashboard-panel admin-recent-orders-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="admin-panel-heading">
          <div>
            <span>SALES</span>
            <h2>Recent Orders</h2>
          </div>

          <button
            type="button"
            className="admin-panel-link"
            onClick={() => navigate("/admin/orders")}
          >
            View Orders
            <FaArrowRight />
          </button>
        </div>

        {loading ? (
          <div className="admin-orders-empty">
            <FaSyncAlt className="admin-spin" />
            Loading recent orders...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="admin-orders-empty">
            <span className="admin-orders-empty-icon">
              <FaClipboardList />
            </span>

            <strong>No recent orders</strong>

            <p>New orders will appear here once customers make purchases.</p>
          </div>
        ) : (
          <div className="admin-orders-table-wrapper">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order, index) => {
                  const status = getOrderStatus(order);

                  return (
                    <tr key={order?._id || order?.id || index}>
                      <td>
                        <div className="admin-order-number">
                          <span>
                            <FaClipboardList />
                          </span>

                          <strong>{getOrderNumber(order)}</strong>
                        </div>
                      </td>

                      <td>
                        <div className="admin-order-customer">
                          <span>{getInitials(getOrderCustomer(order))}</span>

                          <strong>{getOrderCustomer(order)}</strong>
                        </div>
                      </td>

                      <td>{formatDate(order?.createdAt || order?.date)}</td>

                      <td>
                        <strong className="admin-order-amount">
                          {formatCurrency(getOrderTotal(order))}
                        </strong>
                      </td>

                      <td>
                        <span className={`admin-order-status ${status}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      <footer className="admin-dashboard-footer">
        <div>
          <span className="admin-footer-logo">
            <FaIceCream />
          </span>

          <strong>IceCream Billing System</strong>
          <span>Admin Control Center</span>
        </div>

        <span>© {new Date().getFullYear()} All rights reserved.</span>
      </footer>
    </main>
  );
};

export default AdminDashboard;
