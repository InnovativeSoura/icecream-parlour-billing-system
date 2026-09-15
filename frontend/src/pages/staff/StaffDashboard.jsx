import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCashRegister,
  FaClipboardList,
  FaUsers,
  FaIceCream,
  FaChartLine,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaBoxes,
  FaReceipt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./StaffDashboard.css";

const StaffDashboard = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("icecream_user")) || {};
    } catch {
      return {};
    }
  }, []);

  const staffName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "Staff";

  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const [
          ordersResponse,
          customersResponse,
          productsResponse,
          inventoryResponse,
        ] = await Promise.allSettled([
          api.get("/orders"),
          api.get("/customers"),
          api.get("/products"),
          api.get("/inventory"),
        ]);

        if (ordersResponse.status === "fulfilled") {
          const data = ordersResponse.value?.data;

          setOrders(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.orders)
              ? data.orders
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        }

        if (customersResponse.status === "fulfilled") {
          const data = customersResponse.value?.data;

          setCustomers(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.customers)
              ? data.customers
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        }

        if (productsResponse.status === "fulfilled") {
          const data = productsResponse.value?.data;

          setProducts(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.products)
              ? data.products
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        }

        if (inventoryResponse.status === "fulfilled") {
          const data = inventoryResponse.value?.data;

          setInventory(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.inventory)
              ? data.inventory
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        }
      } catch (error) {
        console.error("Staff dashboard error:", error);
        toast.error("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getOrderStatus = (order) =>
    String(order?.status || "pending").toLowerCase();

  const getPaymentStatus = (order) =>
    String(order?.paymentStatus || "pending").toLowerCase();

  const getOrderAmount = (order) =>
    Number(
      order?.totalAmount ??
        order?.total ??
        order?.grandTotal ??
        order?.amount ??
        0
    ) || 0;

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const today = new Date();

    const todaysOrders = orders.filter((order) => {
      if (!order?.createdAt) return false;

      const orderDate = new Date(order.createdAt);

      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    });

    const todaysSales = todaysOrders.reduce(
      (total, order) => total + getOrderAmount(order),
      0
    );

    const pendingOrders = orders.filter((order) => {
      const status = getOrderStatus(order);

      return ["pending", "confirmed", "processing"].includes(status);
    });

    const completedOrders = orders.filter((order) => {
      return getOrderStatus(order) === "completed";
    });

    const paidOrders = orders.filter((order) => {
      return getPaymentStatus(order) === "paid";
    });

    const lowStock = inventory.filter((item) => {
      const quantity = Number(
        item?.quantity ??
          item?.stock ??
          item?.currentStock ??
          item?.availableQuantity ??
          0
      );

      const threshold = Number(
        item?.lowStockThreshold ??
          item?.minimumStock ??
          item?.reorderLevel ??
          5
      );

      return quantity <= threshold;
    });

    return {
      todaysOrders,
      todaysSales,
      pendingOrders,
      completedOrders,
      paidOrders,
      lowStock,
    };
  }, [orders, inventory]);

  // =========================================================
  // RECENT ORDERS
  // =========================================================

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b?.createdAt || 0) -
          new Date(a?.createdAt || 0)
      )
      .slice(0, 6);
  }, [orders]);

  // =========================================================
  // QUICK ACTIONS
  // =========================================================

  const quickActions = [
    {
      title: "Create Bill",
      description: "Create a new customer bill",
      icon: FaCashRegister,
      path: "/staff/billing",
      className: "staff-action-billing",
    },
    {
      title: "View Orders",
      description: "Manage today's orders",
      icon: FaClipboardList,
      path: "/staff/orders",
      className: "staff-action-orders",
    },
    {
      title: "Customers",
      description: "View customer records",
      icon: FaUsers,
      path: "/staff/customers",
      className: "staff-action-customers",
    },
    {
      title: "Sales Reports",
      description: "Review sales performance",
      icon: FaChartLine,
      path: "/staff/reports",
      className: "staff-action-reports",
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <section className="staff-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <motion.div
        className="staff-dashboard-header"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="staff-dashboard-header-copy">
          <span className="staff-dashboard-eyebrow">
            STAFF OVERVIEW
          </span>

          <h2>
            Welcome back, {staffName}
            <span className="staff-wave">👋</span>
          </h2>

          <p>
            Here's what's happening at your ice cream parlour today.
          </p>
        </div>

        <button
          type="button"
          className="staff-primary-button"
          onClick={() => navigate("/staff/billing")}
        >
          <FaCashRegister />
          Create New Bill
        </button>
      </motion.div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="staff-stat-grid">

        <motion.div
          className="staff-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="staff-stat-top">
            <div className="staff-stat-icon staff-stat-icon-sales">
              <FaReceipt />
            </div>

            <span className="staff-stat-tag">
              TODAY
            </span>
          </div>

          <strong className="staff-stat-number">
            {loading ? "—" : statistics.todaysOrders.length}
          </strong>

          <span className="staff-stat-label">
            Today's Orders
          </span>

          <div className="staff-stat-footer">
            <FaCheckCircle />
            <span>Orders received today</span>
          </div>
        </motion.div>

        <motion.div
          className="staff-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="staff-stat-top">
            <div className="staff-stat-icon staff-stat-icon-revenue">
              <FaChartLine />
            </div>

            <span className="staff-stat-tag">
              SALES
            </span>
          </div>

          <strong className="staff-stat-number staff-stat-currency">
            {loading
              ? "—"
              : formatCurrency(statistics.todaysSales)}
          </strong>

          <span className="staff-stat-label">
            Today's Sales
          </span>

          <div className="staff-stat-footer">
            <FaCheckCircle />
            <span>Recorded sales</span>
          </div>
        </motion.div>

        <motion.div
          className="staff-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="staff-stat-top">
            <div className="staff-stat-icon staff-stat-icon-orders">
              <FaClock />
            </div>

            <span className="staff-stat-tag staff-tag-warning">
              ACTIVE
            </span>
          </div>

          <strong className="staff-stat-number">
            {loading
              ? "—"
              : statistics.pendingOrders.length}
          </strong>

          <span className="staff-stat-label">
            Active Orders
          </span>

          <div className="staff-stat-footer">
            <FaClock />
            <span>Needs attention</span>
          </div>
        </motion.div>

        <motion.div
          className="staff-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="staff-stat-top">
            <div className="staff-stat-icon staff-stat-icon-customers">
              <FaUsers />
            </div>

            <span className="staff-stat-tag">
              CUSTOMERS
            </span>
          </div>

          <strong className="staff-stat-number">
            {loading ? "—" : customers.length}
          </strong>

          <span className="staff-stat-label">
            Customer Records
          </span>

          <div className="staff-stat-footer">
            <FaUsers />
            <span>Customer database</span>
          </div>
        </motion.div>

      </div>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="staff-dashboard-grid">

        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <motion.div
          className="staff-panel staff-quick-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="staff-panel-header">
            <div>
              <span className="staff-panel-eyebrow">
                WORKSPACE
              </span>

              <h3>Quick Actions</h3>
            </div>

            <div className="staff-panel-header-icon">
              <FaCashRegister />
            </div>
          </div>

          <div className="staff-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  className={`staff-quick-action ${action.className}`}
                  onClick={() => navigate(action.path)}
                >
                  <div className="staff-quick-action-icon">
                    <Icon />
                  </div>

                  <div className="staff-quick-action-copy">
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </div>

                  <FaArrowRight className="staff-quick-action-arrow" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ===================================================
            OPERATIONS
        =================================================== */}

        <motion.div
          className="staff-panel staff-operation-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="staff-panel-header">
            <div>
              <span className="staff-panel-eyebrow">
                OPERATIONS
              </span>

              <h3>Today's Activity</h3>
            </div>

            <div className="staff-live-status">
              <span />
              LIVE
            </div>
          </div>

          <div className="staff-operation-list">

            <div className="staff-operation-row">
              <div className="staff-operation-icon">
                <FaCheckCircle />
              </div>

              <div className="staff-operation-copy">
                <strong>Completed Orders</strong>
                <span>Successfully processed</span>
              </div>

              <strong className="staff-operation-value">
                {loading
                  ? "—"
                  : statistics.completedOrders.length}
              </strong>
            </div>

            <div className="staff-operation-row">
              <div className="staff-operation-icon staff-operation-warning">
                <FaClock />
              </div>

              <div className="staff-operation-copy">
                <strong>Pending Orders</strong>
                <span>Waiting for processing</span>
              </div>

              <strong className="staff-operation-value">
                {loading
                  ? "—"
                  : statistics.pendingOrders.length}
              </strong>
            </div>

            <div className="staff-operation-row">
              <div className="staff-operation-icon">
                <FaReceipt />
              </div>

              <div className="staff-operation-copy">
                <strong>Paid Orders</strong>
                <span>Payments completed</span>
              </div>

              <strong className="staff-operation-value">
                {loading
                  ? "—"
                  : statistics.paidOrders.length}
              </strong>
            </div>

          </div>
        </motion.div>

      </div>

      {/* =====================================================
          RECENT ORDERS
      ===================================================== */}

      <motion.div
        className="staff-panel staff-orders-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="staff-panel-header">
          <div>
            <span className="staff-panel-eyebrow">
              ORDERS
            </span>

            <h3>Recent Orders</h3>
          </div>

          <button
            type="button"
            className="staff-panel-link"
            onClick={() => navigate("/staff/orders")}
          >
            View all
            <FaArrowRight />
          </button>
        </div>

        {loading ? (
          <div className="staff-dashboard-empty">
            <div className="staff-loader" />
            <span>Loading recent orders...</span>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="staff-dashboard-empty">
            <div className="staff-empty-icon">
              <FaClipboardList />
            </div>

            <strong>No recent orders</strong>

            <span>
              New customer orders will appear here.
            </span>
          </div>
        ) : (
          <div className="staff-orders-table-wrapper">
            <table className="staff-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => {
                  const status = getOrderStatus(order);
                  const paymentStatus =
                    getPaymentStatus(order);

                  const customerName =
                    order?.customerSnapshot?.name ||
                    order?.customer?.name ||
                    order?.customerName ||
                    "Walk-in Customer";

                  const orderNumber =
                    order?.orderNumber ||
                    order?.billNumber ||
                    order?.id ||
                    order?._id ||
                    "—";

                  return (
                    <tr key={order?._id || order?.id || orderNumber}>
                      <td>
                        <strong className="staff-order-number">
                          {orderNumber}
                        </strong>
                      </td>

                      <td>
                        <div className="staff-customer-cell">
                          <div className="staff-customer-avatar">
                            {customerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span>{customerName}</span>
                        </div>
                      </td>

                      <td>
                        {formatDate(order?.createdAt)}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            getOrderAmount(order)
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`staff-payment-badge payment-${paymentStatus}`}
                        >
                          {paymentStatus}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`staff-status-badge status-${status}`}
                        >
                          <span />
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
      </motion.div>

      {/* =====================================================
          BOTTOM GRID
      ===================================================== */}

      <div className="staff-bottom-grid">

        {/* INVENTORY */}

        <motion.div
          className="staff-panel staff-inventory-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="staff-panel-header">
            <div>
              <span className="staff-panel-eyebrow">
                INVENTORY
              </span>

              <h3>Stock Overview</h3>
            </div>

            <button
              type="button"
              className="staff-panel-link"
              onClick={() => navigate("/admin/inventory")}
            >
              View inventory
              <FaArrowRight />
            </button>
          </div>

          {statistics.lowStock.length === 0 ? (
            <div className="staff-stock-healthy">
              <div>
                <FaCheckCircle />
              </div>

              <div>
                <strong>Inventory looks healthy</strong>
                <span>
                  No low-stock items require immediate attention.
                </span>
              </div>
            </div>
          ) : (
            <div className="staff-low-stock-list">
              {statistics.lowStock
                .slice(0, 4)
                .map((item, index) => {
                  const quantity = Number(
                    item?.quantity ??
                      item?.stock ??
                      item?.currentStock ??
                      0
                  );

                  const name =
                    item?.product?.name ||
                    item?.name ||
                    item?.productName ||
                    `Product ${index + 1}`;

                  return (
                    <div
                      className="staff-low-stock-row"
                      key={item?._id || item?.id || index}
                    >
                      <div className="staff-stock-product-icon">
                        <FaIceCream />
                      </div>

                      <div className="staff-stock-product-copy">
                        <strong>{name}</strong>
                        <span>Stock level</span>
                      </div>

                      <span className="staff-low-stock-value">
                        {quantity} left
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </motion.div>

        {/* SYSTEM SUMMARY */}

        <motion.div
          className="staff-panel staff-summary-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="staff-panel-header">
            <div>
              <span className="staff-panel-eyebrow">
                SYSTEM
              </span>

              <h3>Service Status</h3>
            </div>

            <div className="staff-live-status">
              <span />
              ONLINE
            </div>
          </div>

          <div className="staff-service-list">

            <div className="staff-service-row">
              <div className="staff-service-check">
                <FaCheckCircle />
              </div>

              <div>
                <strong>Billing System</strong>
                <span>POS services operational</span>
              </div>

              <b>Online</b>
            </div>

            <div className="staff-service-row">
              <div className="staff-service-check">
                <FaCheckCircle />
              </div>

              <div>
                <strong>Authentication</strong>
                <span>Secure session active</span>
              </div>

              <b>Secure</b>
            </div>

            <div className="staff-service-row">
              <div className="staff-service-check">
                <FaCheckCircle />
              </div>

              <div>
                <strong>Database</strong>
                <span>Data services connected</span>
              </div>

              <b>Connected</b>
            </div>

          </div>
        </motion.div>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="staff-dashboard-footer">
        <span>
          <FaIceCream />
          IceCream Billing System
        </span>

        <span>
          Staff Control Center
        </span>

        <span>
          © {new Date().getFullYear()} All rights reserved.
        </span>
      </div>

    </section>
  );
};

export default StaffDashboard;