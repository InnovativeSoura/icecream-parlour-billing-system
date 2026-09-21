import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaRupeeSign,
  FaShoppingBag,
  FaUsers,
  FaBoxes,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCreditCard,
  FaSyncAlt,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./Reports.css";

const extractArray = (response, keys = []) => {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};

const normalizeStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  return status || "pending";
};

const normalizePaymentStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  return status || "pending";
};

const getOrderTotal = (order) =>
  Number(order?.totalAmount ?? order?.total ?? order?.grandTotal ?? 0) || 0;

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatShortCurrency = (value) => {
  const amount = Number(value) || 0;

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(amount)}`;
};

const formatDay = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
  }).format(date);
};

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        ordersResponse,
        productsResponse,
        inventoryResponse,
        customersResponse,
      ] = await Promise.all([
        api.get("/orders"),
        api.get("/products"),
        api.get("/inventory"),
        api.get("/customers"),
      ]);

      setOrders(extractArray(ordersResponse, ["orders"]));

      setProducts(extractArray(productsResponse, ["products"]));

      setInventory(extractArray(inventoryResponse, ["inventory", "items"]));

      setCustomers(extractArray(customersResponse, ["customers"]));
    } catch (error) {
      console.error("Failed to load reports:", error);

      toast.error(
        error?.response?.data?.message || "Unable to load report data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const analytics = useMemo(() => {
    const totalOrders = orders.length;

    const paidOrders = orders.filter(
      (order) => normalizePaymentStatus(order?.paymentStatus) === "paid",
    );

    const pendingOrders = orders.filter(
      (order) => normalizeStatus(order?.status) === "pending",
    );

    const completedOrders = orders.filter(
      (order) => normalizeStatus(order?.status) === "completed",
    );

    const cancelledOrders = orders.filter(
      (order) => normalizeStatus(order?.status) === "cancelled",
    );

    const revenue = paidOrders.reduce(
      (sum, order) => sum + getOrderTotal(order),
      0,
    );

    const averageOrderValue =
      paidOrders.length > 0 ? revenue / paidOrders.length : 0;

    const onlineOrders = orders.filter(
      (order) => String(order?.orderType || "").toLowerCase() === "online",
    ).length;

    const posOrders = orders.filter(
      (order) => String(order?.orderType || "").toLowerCase() === "pos",
    ).length;

    const paymentMethods = {
      razorpay: 0,
      cash: 0,
      upi: 0,
      card: 0,
      other: 0,
    };

    paidOrders.forEach((order) => {
      const method = String(order?.paymentMethod || "other").toLowerCase();

      if (Object.prototype.hasOwnProperty.call(paymentMethods, method)) {
        paymentMethods[method] += 1;
      } else {
        paymentMethods.other += 1;
      }
    });

    const lowStockItems = inventory.filter((item) => {
      const quantity = Number(
        item?.quantity ?? item?.stock ?? item?.currentStock ?? 0,
      );

      const threshold = Number(
        item?.lowStockThreshold ?? item?.reorderLevel ?? 5,
      );

      return quantity <= threshold;
    }).length;

    return {
      totalOrders,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      revenue,
      averageOrderValue,
      onlineOrders,
      posOrders,
      paymentMethods,
      lowStockItems,
    };
  }, [orders, inventory]);

  const dailySales = useMemo(() => {
    const days = [];

    for (let index = 6; index >= 0; index--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);

      const dateKey = date.toISOString().split("T")[0];

      const dayOrders = orders.filter((order) => {
        if (normalizePaymentStatus(order?.paymentStatus) !== "paid") {
          return false;
        }

        if (!order?.createdAt) {
          return false;
        }

        const orderDate = new Date(order.createdAt);

        return orderDate.toISOString().split("T")[0] === dateKey;
      });

      const sales = dayOrders.reduce(
        (sum, order) => sum + getOrderTotal(order),
        0,
      );

      days.push({
        date,
        label: formatDay(date),
        sales,
        orders: dayOrders.length,
      });
    }

    return days;
  }, [orders]);

  const maxDailySales = Math.max(...dailySales.map((day) => day.sales), 1);

  const topProducts = useMemo(() => {
    const productMap = {};

    orders
      .filter(
        (order) => normalizePaymentStatus(order?.paymentStatus) === "paid",
      )
      .forEach((order) => {
        if (!Array.isArray(order?.items)) {
          return;
        }

        order.items.forEach((item) => {
          const name = item?.name || "Unknown Product";

          const quantity = Number(item?.quantity) || 0;

          const total =
            Number(
              item?.total ??
                item?.totalAmount ??
                (Number(item?.unitPrice) || 0) * quantity,
            ) || 0;

          if (!productMap[name]) {
            productMap[name] = {
              name,
              quantity: 0,
              revenue: 0,
            };
          }

          productMap[name].quantity += quantity;

          productMap[name].revenue += total;
        });
      });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const revenueByPayment = useMemo(() => {
    const result = {};

    orders
      .filter(
        (order) => normalizePaymentStatus(order?.paymentStatus) === "paid",
      )
      .forEach((order) => {
        const method = String(order?.paymentMethod || "other").toLowerCase();

        const amount = getOrderTotal(order);

        result[method] = (result[method] || 0) + amount;
      });

    return Object.entries(result).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const exportReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Orders", analytics.totalOrders],
      ["Paid Orders", analytics.paidOrders],
      ["Pending Orders", analytics.pendingOrders],
      ["Completed Orders", analytics.completedOrders],
      ["Cancelled Orders", analytics.cancelledOrders],
      ["Total Revenue", analytics.revenue],
      ["Average Order Value", analytics.averageOrderValue],
      ["Online Orders", analytics.onlineOrders],
      ["POS Orders", analytics.posOrders],
      ["Products", products.length],
      ["Customers", customers.length],
      ["Inventory Items", inventory.length],
      ["Low Stock Items", analytics.lowStockItems],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "").replace(/"/g, '""');

            return `"${value}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `icecream-sales-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Report exported successfully.");
  };

  if (loading) {
    return (
      <div className="reports-loading-page">
        <div className="reports-loading-icon">
          <FaChartLine />
        </div>

        <strong>Preparing reports...</strong>

        <span>Collecting sales and business data.</span>
      </div>
    );
  }

  return (
    <div className="admin-reports-page">
      <motion.section
        className="reports-hero"
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        <div>
          <span className="reports-eyebrow">BUSINESS ANALYTICS</span>

          <h2>Reports</h2>

          <p>
            Understand sales performance, customer activity, and inventory
            health.
          </p>
        </div>

        <div className="reports-actions">
          <button
            type="button"
            className="reports-refresh"
            onClick={() => fetchReports(true)}
            disabled={refreshing}
          >
            <FaSyncAlt className={refreshing ? "reports-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="reports-export"
            onClick={exportReport}
          >
            Export Report
          </button>
        </div>
      </motion.section>

      <section className="reports-kpi-grid">
        <div className="report-kpi-card">
          <div className="report-kpi-icon revenue">
            <FaRupeeSign />
          </div>

          <div>
            <span>Total Revenue</span>

            <strong>{formatCurrency(analytics.revenue)}</strong>

            <small>From paid orders</small>
          </div>
        </div>

        <div className="report-kpi-card">
          <div className="report-kpi-icon orders">
            <FaShoppingBag />
          </div>

          <div>
            <span>Total Orders</span>

            <strong>{analytics.totalOrders}</strong>

            <small>{analytics.paidOrders} paid</small>
          </div>
        </div>

        <div className="report-kpi-card">
          <div className="report-kpi-icon average">
            <FaChartLine />
          </div>

          <div>
            <span>Average Order</span>

            <strong>{formatCurrency(analytics.averageOrderValue)}</strong>

            <small>Per paid order</small>
          </div>
        </div>

        <div className="report-kpi-card">
          <div className="report-kpi-icon customers">
            <FaUsers />
          </div>

          <div>
            <span>Customers</span>

            <strong>{customers.length}</strong>

            <small>Registered records</small>
          </div>
        </div>
      </section>

      <section className="reports-main-grid">
        <div className="report-panel sales-panel">
          <div className="report-panel-header">
            <div>
              <span>LAST 7 DAYS</span>
              <h3>Sales Overview</h3>
            </div>

            <div className="sales-total">
              {formatShortCurrency(
                dailySales.reduce((sum, day) => sum + day.sales, 0),
              )}
            </div>
          </div>

          <div className="sales-chart">
            {dailySales.map((day) => {
              const height =
                day.sales > 0
                  ? Math.max(10, (day.sales / maxDailySales) * 100)
                  : 5;

              return (
                <div
                  className="sales-chart-column"
                  key={day.date.toISOString()}
                >
                  <div className="sales-chart-value">
                    {day.sales > 0 ? formatShortCurrency(day.sales) : "—"}
                  </div>

                  <div className="sales-bar-area">
                    <motion.div
                      className="sales-bar"
                      initial={{
                        height: 0,
                      }}
                      animate={{
                        height: `${height}%`,
                      }}
                      transition={{
                        duration: 0.65,
                        delay: dailySales.indexOf(day) * 0.05,
                      }}
                    />
                  </div>

                  <span>{day.label}</span>

                  <small>
                    {day.orders} {day.orders === 1 ? "order" : "orders"}
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="report-panel">
          <div className="report-panel-header">
            <div>
              <span>ORDER HEALTH</span>
              <h3>Order Status</h3>
            </div>
          </div>

          <div className="status-report-list">
            <div className="status-report-row">
              <div className="status-report-icon completed">
                <FaCheckCircle />
              </div>

              <div>
                <strong>Completed</strong>
                <span>Successfully fulfilled</span>
              </div>

              <b>{analytics.completedOrders}</b>
            </div>

            <div className="status-report-row">
              <div className="status-report-icon pending">
                <FaClock />
              </div>

              <div>
                <strong>Pending</strong>
                <span>Awaiting action</span>
              </div>

              <b>{analytics.pendingOrders}</b>
            </div>

            <div className="status-report-row">
              <div className="status-report-icon cancelled">
                <FaTimesCircle />
              </div>

              <div>
                <strong>Cancelled</strong>
                <span>Cancelled orders</span>
              </div>

              <b>{analytics.cancelledOrders}</b>
            </div>
          </div>
        </div>
      </section>

      <section className="reports-lower-grid">
        <div className="report-panel">
          <div className="report-panel-header">
            <div>
              <span>PRODUCT PERFORMANCE</span>
              <h3>Top Products</h3>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="report-empty">No paid product sales available.</div>
          ) : (
            <div className="top-products-list">
              {topProducts.map((product, index) => (
                <div className="top-product-row" key={product.name}>
                  <div className="product-rank">{index + 1}</div>

                  <div className="top-product-info">
                    <strong>{product.name}</strong>

                    <span>{product.quantity} units sold</span>
                  </div>

                  <strong className="top-product-revenue">
                    {formatShortCurrency(product.revenue)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="report-panel">
          <div className="report-panel-header">
            <div>
              <span>PAYMENT ANALYTICS</span>
              <h3>Revenue by Payment</h3>
            </div>
          </div>

          {revenueByPayment.length === 0 ? (
            <div className="report-empty">
              No paid payment records available.
            </div>
          ) : (
            <div className="payment-report-list">
              {revenueByPayment.map(([method, amount]) => {
                const percentage =
                  analytics.revenue > 0
                    ? (amount / analytics.revenue) * 100
                    : 0;

                return (
                  <div className="payment-report-row" key={method}>
                    <div className="payment-report-top">
                      <span>
                        <FaCreditCard />
                        {method}
                      </span>

                      <strong>{formatShortCurrency(amount)}</strong>
                    </div>

                    <div className="payment-progress">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <small>{percentage.toFixed(1)}% of revenue</small>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="report-panel snapshot-panel">
        <div className="report-panel-header">
          <div>
            <span>BUSINESS SNAPSHOT</span>
            <h3>System Performance</h3>
          </div>
        </div>

        <div className="snapshot-grid">
          <div className="snapshot-card">
            <div className="snapshot-icon">
              <FaBoxes />
            </div>

            <div>
              <strong>{products.length}</strong>

              <span>Active Products</span>
            </div>
          </div>

          <div className="snapshot-card">
            <div className="snapshot-icon">
              <FaBoxes />
            </div>

            <div>
              <strong>{inventory.length}</strong>

              <span>Inventory Records</span>
            </div>
          </div>

          <div className="snapshot-card">
            <div className="snapshot-icon success">
              <FaArrowUp />
            </div>

            <div>
              <strong>{analytics.onlineOrders}</strong>

              <span>Online Orders</span>
            </div>
          </div>

          <div className="snapshot-card">
            <div className="snapshot-icon warning">
              <FaArrowDown />
            </div>

            <div>
              <strong>{analytics.lowStockItems}</strong>

              <span>Low Stock Items</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Reports;
