// frontend/src/pages/staff/StaffReports.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCloudDownloadAlt,
  FaCreditCard,
  FaFileCsv,
  FaMoneyBillWave,
  FaReceipt,
  FaRedoAlt,
  FaShoppingBag,
  FaSpinner,
  FaWallet,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./StaffReports.css";

const REPORT_PERIODS = [
  { value: "today", label: "Today", days: 1 },
  { value: "7days", label: "Last 7 Days", days: 7 },
  { value: "30days", label: "Last 30 Days", days: 30 },
];

const PAID_STATUSES = ["paid"];
const COMPLETED_STATUSES = ["completed"];

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
};

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

const formatShortDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeStatus = (value) => {
  return String(value || "pending").trim().toLowerCase();
};

const normalizePaymentStatus = (value) => {
  return String(value || "pending").trim().toLowerCase();
};

const getOrderTotal = (order) => {
  return Number(
    order?.totalAmount ??
      order?.total ??
      order?.grandTotal ??
      order?.amount ??
      0
  );
};

const getOrderDate = (order) => {
  return (
    order?.createdAt ||
    order?.orderDate ||
    order?.date ||
    order?.updatedAt ||
    null
  );
};

const getOrderNumber = (order) => {
  return (
    order?.orderNumber ||
    order?.invoiceNumber ||
    order?.number ||
    order?._id ||
    "—"
  );
};

const getCustomerName = (order) => {
  return (
    order?.customerSnapshot?.name ||
    order?.customer?.name ||
    order?.customerName ||
    "Walk-in Customer"
  );
};

const getPaymentMethod = (order) => {
  return String(
    order?.paymentMethod ||
      order?.payment?.method ||
      "unpaid"
  )
    .trim()
    .toLowerCase();
};

const getItems = (order) => {
  if (!Array.isArray(order?.items)) return [];
  return order.items;
};

const getProductName = (item) => {
  return (
    item?.name ||
    item?.product?.name ||
    item?.productName ||
    "Unknown Product"
  );
};

const getItemQuantity = (item) => {
  return Number(item?.quantity || item?.qty || 0);
};

const getItemTotal = (item) => {
  return Number(
    item?.total ??
      item?.lineTotal ??
      item?.subtotal ??
      item?.amount ??
      Number(item?.unitPrice || item?.price || 0) *
        getItemQuantity(item)
  );
};

const getPaymentLabel = (method) => {
  const labels = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    razorpay: "Razorpay",
    other: "Other",
    unpaid: "Unpaid",
  };

  return labels[method] || method || "Unpaid";
};

const isWithinPeriod = (orderDate, period) => {
  if (!orderDate) return false;

  const date = new Date(orderDate);

  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (period === "today") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const days = period === "7days" ? 7 : 30;

  const start = new Date(now);

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  return date >= start && date <= now;
};

const getDayKey = (date) => {
  const current = new Date(date);

  if (Number.isNaN(current.getTime())) return "";

  return [
    current.getFullYear(),
    String(current.getMonth() + 1).padStart(2, "0"),
    String(current.getDate()).padStart(2, "0"),
  ].join("-");
};

const getDayLabel = (date) => {
  const current = new Date(date);

  if (Number.isNaN(current.getTime())) return "—";

  return current.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const StaffReports = () => {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState("7days");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/orders");

      const data = response?.data;

      let nextOrders = [];

      if (Array.isArray(data)) {
        nextOrders = data;
      } else if (Array.isArray(data?.orders)) {
        nextOrders = data.orders;
      } else if (Array.isArray(data?.data)) {
        nextOrders = data.data;
      }

      setOrders(nextOrders);

      if (showRefresh) {
        toast.success("Reports refreshed");
      }
    } catch (err) {
      console.error("Staff reports error:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to load sales reports.";

      setError(message);

      if (showRefresh) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const periodOrders = useMemo(() => {
    return orders
      .filter((order) =>
        isWithinPeriod(getOrderDate(order), period)
      )
      .sort((a, b) => {
        const first = new Date(getOrderDate(a) || 0).getTime();
        const second = new Date(getOrderDate(b) || 0).getTime();

        return second - first;
      });
  }, [orders, period]);

  const reportStats = useMemo(() => {
    let grossSales = 0;
    let paidOrders = 0;
    let completedOrders = 0;

    periodOrders.forEach((order) => {
      const total = getOrderTotal(order);
      const paymentStatus = normalizePaymentStatus(
        order?.paymentStatus
      );
      const status = normalizeStatus(order?.status);

      grossSales += total;

      if (PAID_STATUSES.includes(paymentStatus)) {
        paidOrders += 1;
      }

      if (COMPLETED_STATUSES.includes(status)) {
        completedOrders += 1;
      }
    });

    const totalOrders = periodOrders.length;

    const averageOrderValue =
      totalOrders > 0 ? grossSales / totalOrders : 0;

    const collectionRate =
      totalOrders > 0
        ? Math.round((paidOrders / totalOrders) * 100)
        : 0;

    return {
      grossSales,
      totalOrders,
      averageOrderValue,
      paidOrders,
      completedOrders,
      collectionRate,
    };
  }, [periodOrders]);

  const previousPeriodStats = useMemo(() => {
    const days = period === "today" ? 1 : period === "7days" ? 7 : 30;

    const now = new Date();

    const currentStart = new Date(now);
    currentStart.setHours(0, 0, 0, 0);
    currentStart.setDate(
      currentStart.getDate() - (days - 1)
    );

    const previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);

    const previousStart = new Date(previousEnd);
    previousStart.setHours(0, 0, 0, 0);
    previousStart.setDate(
      previousStart.getDate() - (days - 1)
    );

    let sales = 0;
    let ordersCount = 0;

    orders.forEach((order) => {
      const date = new Date(getOrderDate(order) || 0);

      if (Number.isNaN(date.getTime())) return;

      if (date >= previousStart && date <= previousEnd) {
        sales += getOrderTotal(order);
        ordersCount += 1;
      }
    });

    return {
      sales,
      orders: ordersCount,
    };
  }, [orders, period]);

  const salesGrowth = useMemo(() => {
    const previous = previousPeriodStats.sales;
    const current = reportStats.grossSales;

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }, [previousPeriodStats.sales, reportStats.grossSales]);

  const orderGrowth = useMemo(() => {
    const previous = previousPeriodStats.orders;
    const current = reportStats.totalOrders;

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }, [previousPeriodStats.orders, reportStats.totalOrders]);

  const dailySales = useMemo(() => {
    const map = new Map();

    periodOrders.forEach((order) => {
      const date = getOrderDate(order);

      if (!date) return;

      const key = getDayKey(date);

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          key,
          date,
          sales: 0,
          orders: 0,
        });
      }

      const entry = map.get(key);

      entry.sales += getOrderTotal(order);
      entry.orders += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );
  }, [periodOrders]);

  const paymentBreakdown = useMemo(() => {
    const map = new Map();

    periodOrders.forEach((order) => {
      const method = getPaymentMethod(order);
      const total = getOrderTotal(order);

      if (!map.has(method)) {
        map.set(method, {
          method,
          orders: 0,
          amount: 0,
        });
      }

      const entry = map.get(method);

      entry.orders += 1;
      entry.amount += total;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.amount - a.amount
    );
  }, [periodOrders]);

  const statusBreakdown = useMemo(() => {
    const map = new Map();

    periodOrders.forEach((order) => {
      const status = normalizeStatus(order?.status);

      if (!map.has(status)) {
        map.set(status, 0);
      }

      map.set(status, map.get(status) + 1);
    });

    return Array.from(map.entries())
      .map(([status, count]) => ({
        status,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [periodOrders]);

  const topProducts = useMemo(() => {
    const map = new Map();

    periodOrders.forEach((order) => {
      getItems(order).forEach((item) => {
        const name = getProductName(item);
        const quantity = getItemQuantity(item);
        const total = getItemTotal(item);

        if (!map.has(name)) {
          map.set(name, {
            name,
            quantity: 0,
            sales: 0,
          });
        }

        const entry = map.get(name);

        entry.quantity += quantity;
        entry.sales += total;
      });
    });

    return Array.from(map.values())
      .sort((a, b) => {
        if (b.quantity !== a.quantity) {
          return b.quantity - a.quantity;
        }

        return b.sales - a.sales;
      })
      .slice(0, 6);
  }, [periodOrders]);

  const chartMax = useMemo(() => {
    return Math.max(
      ...dailySales.map((entry) => entry.sales),
      1
    );
  }, [dailySales]);

  const paymentMax = useMemo(() => {
    return Math.max(
      ...paymentBreakdown.map((entry) => entry.amount),
      1
    );
  }, [paymentBreakdown]);

  const exportCSV = () => {
    if (!periodOrders.length) {
      toast.info("There are no orders to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Date",
      "Customer",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Total Amount",
    ];

    const rows = periodOrders.map((order) => [
      getOrderNumber(order),
      getOrderDate(order)
        ? new Date(getOrderDate(order)).toISOString()
        : "",
      getCustomerName(order),
      normalizeStatus(order?.status),
      normalizePaymentStatus(order?.paymentStatus),
      getPaymentLabel(getPaymentMethod(order)),
      getOrderTotal(order).toFixed(2),
    ]);

    const escapeCSV = (value) => {
      const text = String(value ?? "");

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `icecream-sales-report-${period}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    toast.success("Sales report exported");
  };

  const getGrowthClass = (value) => {
    if (value > 0) return "staff-report-growth positive";
    if (value < 0) return "staff-report-growth negative";
    return "staff-report-growth neutral";
  };

  const getStatusClass = (status) => {
    return `staff-report-status status-${status}`;
  };

  return (
    <section className="staff-reports-page">
      <div className="staff-reports-header">
        <div className="staff-reports-header-copy">
          <span className="staff-reports-eyebrow">
            <FaChartLine />
            Sales Intelligence
          </span>

          <h2>Reports & Analytics</h2>

          <p>
            Monitor sales performance, payment collections,
            order activity, and your best-selling products.
          </p>
        </div>

        <div className="staff-reports-header-actions">
          <button
            type="button"
            className="staff-report-refresh-button"
            onClick={() => fetchOrders(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? (
              <FaSpinner className="staff-report-spin" />
            ) : (
              <FaRedoAlt />
            )}

            <span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            className="staff-report-export-button"
            onClick={exportCSV}
            disabled={loading || !periodOrders.length}
          >
            <FaFileCsv />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="staff-report-period-bar">
        <div className="staff-report-period-copy">
          <span>Report period</span>
          <strong>
            {REPORT_PERIODS.find(
              (item) => item.value === period
            )?.label || "Last 7 Days"}
          </strong>
        </div>

        <div className="staff-report-period-options">
          {REPORT_PERIODS.map((item) => (
            <button
              type="button"
              key={item.value}
              className={
                period === item.value
                  ? "active"
                  : ""
              }
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="staff-report-error">
          <div className="staff-report-error-icon">
            !
          </div>

          <div>
            <strong>Unable to load reports</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders()}
          >
            Try Again
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="staff-report-loading">
          <FaSpinner className="staff-report-spin" />
          <span>Loading sales analytics...</span>
        </div>
      ) : (
        <>
          <div className="staff-report-stat-grid">
            <article className="staff-report-stat-card sales">
              <div className="staff-report-stat-top">
                <div className="staff-report-stat-icon">
                  <FaMoneyBillWave />
                </div>

                <span className="staff-report-stat-caption">
                  Gross Sales
                </span>
              </div>

              <strong className="staff-report-stat-number">
                {formatCurrency(
                  reportStats.grossSales
                )}
              </strong>

              <div className="staff-report-stat-bottom">
                <span className={getGrowthClass(salesGrowth)}>
                  {salesGrowth >= 0 ? (
                    <FaArrowUp />
                  ) : (
                    <FaArrowDown />
                  )}

                  {Math.abs(salesGrowth).toFixed(1)}%
                </span>

                <span>vs previous period</span>
              </div>
            </article>

            <article className="staff-report-stat-card orders">
              <div className="staff-report-stat-top">
                <div className="staff-report-stat-icon">
                  <FaReceipt />
                </div>

                <span className="staff-report-stat-caption">
                  Total Orders
                </span>
              </div>

              <strong className="staff-report-stat-number">
                {formatNumber(
                  reportStats.totalOrders
                )}
              </strong>

              <div className="staff-report-stat-bottom">
                <span className={getGrowthClass(orderGrowth)}>
                  {orderGrowth >= 0 ? (
                    <FaArrowUp />
                  ) : (
                    <FaArrowDown />
                  )}

                  {Math.abs(orderGrowth).toFixed(1)}%
                </span>

                <span>vs previous period</span>
              </div>
            </article>

            <article className="staff-report-stat-card average">
              <div className="staff-report-stat-top">
                <div className="staff-report-stat-icon">
                  <FaShoppingBag />
                </div>

                <span className="staff-report-stat-caption">
                  Average Order
                </span>
              </div>

              <strong className="staff-report-stat-number">
                {formatCurrency(
                  reportStats.averageOrderValue
                )}
              </strong>

              <div className="staff-report-stat-bottom">
                <span className="staff-report-stat-neutral">
                  Per transaction
                </span>
              </div>
            </article>

            <article className="staff-report-stat-card collection">
              <div className="staff-report-stat-top">
                <div className="staff-report-stat-icon">
                  <FaCheckCircle />
                </div>

                <span className="staff-report-stat-caption">
                  Paid Orders
                </span>
              </div>

              <strong className="staff-report-stat-number">
                {formatNumber(
                  reportStats.paidOrders
                )}
              </strong>

              <div className="staff-report-stat-bottom">
                <span className="staff-report-stat-success">
                  {reportStats.collectionRate}%
                </span>

                <span>collection rate</span>
              </div>
            </article>
          </div>

          <div className="staff-report-main-grid">
            <section className="staff-report-panel staff-report-sales-panel">
              <div className="staff-report-panel-header">
                <div>
                  <span className="staff-report-panel-eyebrow">
                    Performance
                  </span>

                  <h3>Sales Trend</h3>
                </div>

                <div className="staff-report-panel-icon">
                  <FaChartLine />
                </div>
              </div>

              {dailySales.length ? (
                <div className="staff-report-chart">
                  <div className="staff-report-chart-y">
                    <span>
                      {formatCurrency(chartMax)}
                    </span>

                    <span>
                      {formatCurrency(chartMax / 2)}
                    </span>

                    <span>₹0</span>
                  </div>

                  <div className="staff-report-chart-area">
                    <div className="staff-report-chart-grid-line top" />
                    <div className="staff-report-chart-grid-line middle" />
                    <div className="staff-report-chart-grid-line bottom" />

                    <div className="staff-report-bars">
                      {dailySales.map((entry) => {
                        const height =
                          (entry.sales / chartMax) * 100;

                        return (
                          <div
                            className="staff-report-bar-column"
                            key={entry.key}
                          >
                            <div className="staff-report-bar-value">
                              {formatCurrency(
                                entry.sales
                              )}
                            </div>

                            <div className="staff-report-bar-track">
                              <div
                                className="staff-report-bar"
                                style={{
                                  height: `${Math.max(
                                    height,
                                    3
                                  )}%`,
                                }}
                              />
                            </div>

                            <span>
                              {getDayLabel(
                                entry.date
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="staff-report-empty-inline">
                  <FaChartLine />
                  <strong>No sales data</strong>
                  <span>
                    There are no orders in this period.
                  </span>
                </div>
              )}
            </section>

            <section className="staff-report-panel staff-report-payment-panel">
              <div className="staff-report-panel-header">
                <div>
                  <span className="staff-report-panel-eyebrow">
                    Collections
                  </span>

                  <h3>Payment Methods</h3>
                </div>

                <div className="staff-report-panel-icon">
                  <FaWallet />
                </div>
              </div>

              {paymentBreakdown.length ? (
                <div className="staff-report-payment-list">
                  {paymentBreakdown.map((item) => {
                    const percentage =
                      reportStats.grossSales > 0
                        ? Math.round(
                            (item.amount /
                              reportStats.grossSales) *
                              100
                          )
                        : 0;

                    const width =
                      (item.amount /
                        paymentMax) *
                      100;

                    return (
                      <div
                        className="staff-report-payment-row"
                        key={item.method}
                      >
                        <div className="staff-report-payment-top">
                          <div className="staff-report-payment-name">
                            <span className="staff-report-payment-dot" />

                            <strong>
                              {getPaymentLabel(
                                item.method
                              )}
                            </strong>
                          </div>

                          <div className="staff-report-payment-amount">
                            <strong>
                              {formatCurrency(
                                item.amount
                              )}
                            </strong>

                            <span>
                              {percentage}%
                            </span>
                          </div>
                        </div>

                        <div className="staff-report-progress">
                          <div
                            style={{
                              width: `${Math.max(
                                width,
                                2
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="staff-report-payment-orders">
                          {formatNumber(item.orders)}{" "}
                          orders
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="staff-report-empty-inline">
                  <FaCreditCard />
                  <strong>No payment data</strong>
                  <span>
                    Payment information will appear here.
                  </span>
                </div>
              )}
            </section>
          </div>

          <div className="staff-report-secondary-grid">
            <section className="staff-report-panel">
              <div className="staff-report-panel-header">
                <div>
                  <span className="staff-report-panel-eyebrow">
                    Products
                  </span>

                  <h3>Top Selling Products</h3>
                </div>

                <div className="staff-report-panel-icon">
                  <FaShoppingBag />
                </div>
              </div>

              {topProducts.length ? (
                <div className="staff-report-products-list">
                  {topProducts.map((product, index) => (
                    <div
                      className="staff-report-product-row"
                      key={product.name}
                    >
                      <div className="staff-report-product-rank">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="staff-report-product-copy">
                        <strong>{product.name}</strong>

                        <span>
                          {formatNumber(
                            product.quantity
                          )}{" "}
                          units sold
                        </span>
                      </div>

                      <strong className="staff-report-product-sales">
                        {formatCurrency(product.sales)}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="staff-report-empty-inline">
                  <FaShoppingBag />
                  <strong>No product sales</strong>
                  <span>
                    Product performance will appear here.
                  </span>
                </div>
              )}
            </section>

            <section className="staff-report-panel">
              <div className="staff-report-panel-header">
                <div>
                  <span className="staff-report-panel-eyebrow">
                    Order Flow
                  </span>

                  <h3>Order Status</h3>
                </div>

                <div className="staff-report-panel-icon">
                  <FaClock />
                </div>
              </div>

              {statusBreakdown.length ? (
                <div className="staff-report-status-list">
                  {statusBreakdown.map((item) => {
                    const percentage =
                      reportStats.totalOrders > 0
                        ? Math.round(
                            (item.count /
                              reportStats.totalOrders) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        className="staff-report-status-row"
                        key={item.status}
                      >
                        <div className="staff-report-status-top">
                          <span
                            className={getStatusClass(
                              item.status
                            )}
                          >
                            {item.status}
                          </span>

                          <strong>
                            {formatNumber(
                              item.count
                            )}
                          </strong>
                        </div>

                        <div className="staff-report-progress">
                          <div
                            style={{
                              width: `${Math.max(
                                percentage,
                                2
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="staff-report-status-percent">
                          {percentage}% of orders
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="staff-report-empty-inline">
                  <FaClock />
                  <strong>No order activity</strong>
                  <span>
                    Order statuses will appear here.
                  </span>
                </div>
              )}
            </section>
          </div>

          <section className="staff-report-panel staff-report-recent-panel">
            <div className="staff-report-panel-header">
              <div>
                <span className="staff-report-panel-eyebrow">
                  Transactions
                </span>

                <h3>Recent Sales</h3>
              </div>

              <div className="staff-report-recent-summary">
                <span>
                  {formatNumber(
                    periodOrders.length
                  )}{" "}
                  orders
                </span>

                <strong>
                  {formatCurrency(
                    reportStats.grossSales
                  )}
                </strong>
              </div>
            </div>

            {periodOrders.length ? (
              <div className="staff-report-table-wrapper">
                <table className="staff-report-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th className="align-right">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {periodOrders
                      .slice(0, 10)
                      .map((order) => {
                        const paymentStatus =
                          normalizePaymentStatus(
                            order?.paymentStatus
                          );

                        const status =
                          normalizeStatus(
                            order?.status
                          );

                        return (
                          <tr key={order?._id || getOrderNumber(order)}>
                            <td>
                              <strong className="staff-report-order-number">
                                {getOrderNumber(order)}
                              </strong>
                            </td>

                            <td>
                              <div className="staff-report-customer">
                                <div className="staff-report-customer-avatar">
                                  {getCustomerName(
                                    order
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <span>
                                  {getCustomerName(
                                    order
                                  )}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="staff-report-date">
                                <strong>
                                  {formatShortDate(
                                    getOrderDate(
                                      order
                                    )
                                  )}
                                </strong>

                                <span>
                                  {formatTime(
                                    getOrderDate(
                                      order
                                    )
                                  )}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="staff-report-payment-cell">
                                <strong>
                                  {getPaymentLabel(
                                    getPaymentMethod(
                                      order
                                    )
                                  )}
                                </strong>

                                <span
                                  className={`payment-${paymentStatus}`}
                                >
                                  {paymentStatus}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={getStatusClass(
                                  status
                                )}
                              >
                                {status}
                              </span>
                            </td>

                            <td className="align-right">
                              <strong className="staff-report-amount">
                                {formatCurrency(
                                  getOrderTotal(
                                    order
                                  )
                                )}
                              </strong>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="staff-report-empty">
                <div className="staff-report-empty-icon">
                  <FaReceipt />
                </div>

                <h3>No sales found</h3>

                <p>
                  There are no orders available for the
                  selected reporting period.
                </p>
              </div>
            )}
          </section>

          <div className="staff-report-footer">
            <div>
              <FaCloudDownloadAlt />

              <span>
                Reports are calculated from the order
                records available to your staff account.
              </span>
            </div>

            <strong>
              Generated {formatDate(new Date())}
            </strong>
          </div>
        </>
      )}
    </section>
  );
};

export default StaffReports;