import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaReceipt,
  FaUser,
  FaPhone,
  FaCalendarDays,
  FaCreditCard,
  FaMoneyBillWave,
  FaMobileAlt,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaBoxOpen,
  FaUndo,
  FaExclamationCircle,
  FaIceCream,
} from "react-icons/fa";

import api from "../../api/api";
import "./StaffOrders.css";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
  "refunded",
];

const PAYMENT_OPTIONS = [
  "all",
  "paid",
  "pending",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
];

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

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

const getCustomerName = (order) =>
  order?.customer?.name ||
  order?.customerSnapshot?.name ||
  order?.customerName ||
  "Walk-in Customer";

const getCustomerPhone = (order) =>
  order?.customer?.phone ||
  order?.customerSnapshot?.phone ||
  order?.phone ||
  "";

const getOrderTotal = (order) =>
  Number(order?.totalAmount ?? order?.total ?? order?.grandTotal ?? 0);

const getOrderItems = (order) =>
  Array.isArray(order?.items) ? order.items : [];

const getPaymentMethod = (order) =>
  String(order?.paymentMethod || "unpaid").toLowerCase();

const getOrderNumber = (order) =>
  order?.orderNumber || order?._id || "Unknown Order";

const getOrderDate = (order) =>
  order?.createdAt || order?.orderDate || order?.created_on || null;

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return FaCheckCircle;
    case "processing":
      return FaSpinner;
    case "cancelled":
      return FaTimes;
    case "refunded":
      return FaUndo;
    default:
      return FaClock;
  }
};

const getPaymentIcon = (method) => {
  switch (method) {
    case "cash":
      return FaMoneyBillWave;
    case "upi":
      return FaMobileAlt;
    case "card":
      return FaCreditCard;
    default:
      return FaReceipt;
  }
};

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await api.get("/orders");

      const data =
        response?.data?.orders || response?.data?.data || response?.data || [];

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load staff orders:", error);

      toast.error(error?.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = orders.filter((order) => {
      const orderNumber = getOrderNumber(order).toLowerCase();

      const customerName = getCustomerName(order).toLowerCase();

      const phone = getCustomerPhone(order).toLowerCase();

      const status = normalizeStatus(order?.status);

      const paymentStatus = normalizePaymentStatus(order?.paymentStatus);

      const paymentMethod = getPaymentMethod(order);

      const matchesSearch =
        !keyword ||
        orderNumber.includes(keyword) ||
        customerName.includes(keyword) ||
        phone.includes(keyword);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesPayment =
        paymentFilter === "all" || paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });

    return result.sort((a, b) => {
      const dateA = new Date(getOrderDate(a) || 0).getTime();

      const dateB = new Date(getOrderDate(b) || 0).getTime();

      if (sortBy === "oldest") {
        return dateA - dateB;
      }

      if (sortBy === "highest") {
        return getOrderTotal(b) - getOrderTotal(a);
      }

      if (sortBy === "lowest") {
        return getOrderTotal(a) - getOrderTotal(b);
      }

      return dateB - dateA;
    });
  }, [orders, search, statusFilter, paymentFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, paymentFilter, sortBy]);

  const stats = useMemo(() => {
    const total = orders.length;

    const completed = orders.filter(
      (order) => normalizeStatus(order?.status) === "completed",
    ).length;

    const pending = orders.filter((order) =>
      ["pending", "confirmed", "processing"].includes(
        normalizeStatus(order?.status),
      ),
    ).length;

    const paid = orders.filter(
      (order) => normalizePaymentStatus(order?.paymentStatus) === "paid",
    ).length;

    const revenue = orders
      .filter(
        (order) => normalizePaymentStatus(order?.paymentStatus) === "paid",
      )
      .reduce((sum, order) => sum + getOrderTotal(order), 0);

    return {
      total,
      completed,
      pending,
      paid,
      revenue,
    };
  }, [orders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;

    try {
      setUpdatingOrderId(orderId);

      const response = await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      const updatedOrder = response?.data?.order || response?.data?.data;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order?._id) === String(orderId)
            ? updatedOrder || {
                ...order,
                status: newStatus,
              }
            : order,
        ),
      );

      if (selectedOrder && String(selectedOrder?._id) === String(orderId)) {
        setSelectedOrder(
          updatedOrder || {
            ...selectedOrder,
            status: newStatus,
          },
        );
      }

      toast.success(`Order status updated to ${newStatus}.`);
    } catch (error) {
      console.error("Failed to update order status:", error);

      toast.error(
        error?.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const cancelOrder = async (order) => {
    if (!order?._id) return;

    const paymentStatus = normalizePaymentStatus(order?.paymentStatus);

    if (paymentStatus === "paid") {
      toast.warning("Paid orders cannot be cancelled directly.");
      return;
    }

    const confirmed = window.confirm(`Cancel ${getOrderNumber(order)}?`);

    if (!confirmed) return;

    try {
      setUpdatingOrderId(order._id);

      const response = await api.patch(`/orders/${order._id}/cancel`);

      const updatedOrder = response?.data?.order || response?.data?.data;

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          String(item?._id) === String(order._id)
            ? updatedOrder || {
                ...item,
                status: "cancelled",
                paymentStatus: "cancelled",
              }
            : item,
        ),
      );

      if (selectedOrder && String(selectedOrder?._id) === String(order._id)) {
        setSelectedOrder(
          updatedOrder || {
            ...selectedOrder,
            status: "cancelled",
            paymentStatus: "cancelled",
          },
        );
      }

      toast.success("Order cancelled.");
    } catch (error) {
      console.error("Failed to cancel order:", error);

      toast.error(error?.response?.data?.message || "Unable to cancel order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const renderStatusDropdown = (order) => {
    const status = normalizeStatus(order?.status);
    const orderId = order?._id;

    return (
      <div className="staff-order-status-select">
        <select
          value={status}
          disabled={updatingOrderId === orderId}
          onChange={(event) => updateOrderStatus(orderId, event.target.value)}
          aria-label={`Update ${getOrderNumber(order)} status`}
        >
          {STATUS_OPTIONS.filter((value) => value !== "all").map((value) => (
            <option key={value} value={value}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>

        {updatingOrderId === orderId ? (
          <FaSpinner className="spin" />
        ) : (
          <FaChevronDown />
        )}
      </div>
    );
  };

  const renderPaymentBadge = (order) => {
    const paymentStatus = normalizePaymentStatus(order?.paymentStatus);

    const method = getPaymentMethod(order);
    const Icon = getPaymentIcon(method);

    return (
      <div className={`staff-order-payment-badge payment-${paymentStatus}`}>
        <Icon />

        <span>
          {paymentStatus === "partially_refunded"
            ? "Partial Refund"
            : paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </span>
      </div>
    );
  };

  const openOrder = (order) => {
    setSelectedOrder(order);
  };

  const closeOrder = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="staff-orders-page">
      <div className="staff-orders-header">
        <div>
          <span className="staff-orders-eyebrow">SALES MANAGEMENT</span>

          <h1>
            <FaReceipt />
            Orders
          </h1>

          <p>Manage POS orders, payments and order status from one place.</p>
        </div>

        <button
          type="button"
          className="staff-orders-refresh"
          onClick={() => fetchOrders(false)}
          disabled={refreshing}
        >
          <FaUndo className={refreshing ? "spin" : ""} />

          {refreshing ? "Refreshing..." : "Refresh Orders"}
        </button>
      </div>

      <div className="staff-orders-stat-grid">
        <motion.div className="staff-orders-stat-card" whileHover={{ y: -3 }}>
          <div className="staff-orders-stat-icon orders">
            <FaReceipt />
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{stats.total}</strong>
          </div>
        </motion.div>

        <motion.div className="staff-orders-stat-card" whileHover={{ y: -3 }}>
          <div className="staff-orders-stat-icon pending">
            <FaClock />
          </div>

          <div>
            <span>Active Orders</span>
            <strong>{stats.pending}</strong>
          </div>
        </motion.div>

        <motion.div className="staff-orders-stat-card" whileHover={{ y: -3 }}>
          <div className="staff-orders-stat-icon paid">
            <FaCheckCircle />
          </div>

          <div>
            <span>Paid Orders</span>
            <strong>{stats.paid}</strong>
          </div>
        </motion.div>

        <motion.div className="staff-orders-stat-card" whileHover={{ y: -3 }}>
          <div className="staff-orders-stat-icon revenue">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Collected Revenue</span>
            <strong>{formatCurrency(stats.revenue)}</strong>
          </div>
        </motion.div>
      </div>

      <section className="staff-orders-panel">
        <div className="staff-orders-toolbar">
          <div className="staff-orders-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search order number, customer or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="staff-orders-toolbar-actions">
            <button
              type="button"
              className={`staff-filter-toggle ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters((value) => !value)}
            >
              <FaFilter />
              Filters
              {(statusFilter !== "all" || paymentFilter !== "all") && (
                <span>!</span>
              )}
            </button>

            <div className="staff-order-sort">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>

              <FaChevronDown />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="staff-orders-filters"
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
            >
              <div className="staff-filter-group">
                <label>
                  <FaFilter />
                  Order Status
                </label>

                <div className="staff-filter-pills">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      type="button"
                      key={status}
                      className={statusFilter === status ? "active" : ""}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "all"
                        ? "All"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="staff-filter-group">
                <label>
                  <FaCreditCard />
                  Payment
                </label>

                <div className="staff-filter-pills">
                  {PAYMENT_OPTIONS.map((payment) => (
                    <button
                      type="button"
                      key={payment}
                      className={paymentFilter === payment ? "active" : ""}
                      onClick={() => setPaymentFilter(payment)}
                    >
                      {payment === "all"
                        ? "All"
                        : payment === "partially_refunded"
                          ? "Partial Refund"
                          : payment.charAt(0).toUpperCase() + payment.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="staff-reset-filters"
                onClick={resetFilters}
              >
                Reset
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="staff-orders-loading">
            <FaSpinner className="spin" />
            <span>Loading orders...</span>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="staff-orders-empty">
            <div className="staff-orders-empty-icon">
              <FaBoxOpen />
            </div>

            <h3>No orders found</h3>

            <p>No orders match your current search or filters.</p>

            <button type="button" onClick={resetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="staff-orders-table-wrapper">
              <table className="staff-orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    const status = normalizeStatus(order?.status);

                    const StatusIcon = getStatusIcon(status);

                    return (
                      <motion.tr
                        key={order?._id}
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                      >
                        <td>
                          <div className="staff-order-number-cell">
                            <span className="staff-order-receipt-icon">
                              <FaReceipt />
                            </span>

                            <div>
                              <strong>{getOrderNumber(order)}</strong>

                              <span>
                                {order?.orderType === "online"
                                  ? "Online"
                                  : "POS"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="staff-order-customer">
                            <div className="staff-order-avatar">
                              {getCustomerName(order).charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <strong>{getCustomerName(order)}</strong>

                              <span>
                                {getCustomerPhone(order) || "No phone"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="staff-order-date">
                            <span>{formatDate(getOrderDate(order))}</span>

                            <small>
                              {new Date(
                                getOrderDate(order) || 0,
                              ).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="staff-order-items-count">
                            {getOrderItems(order).reduce(
                              (sum, item) => sum + Number(item?.quantity || 0),
                              0,
                            )}
                          </span>
                        </td>

                        <td>
                          <strong className="staff-order-amount">
                            {formatCurrency(getOrderTotal(order))}
                          </strong>
                        </td>

                        <td>{renderPaymentBadge(order)}</td>

                        <td>
                          <div
                            className={`staff-order-status-badge status-${status}`}
                          >
                            <StatusIcon
                              className={
                                status === "processing" ? "status-spin" : ""
                              }
                            />

                            <span>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="staff-view-order-btn"
                            onClick={() => openOrder(order)}
                            aria-label={`View ${getOrderNumber(order)}`}
                          >
                            <FaEye />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="staff-orders-mobile-list">
              {paginatedOrders.map((order) => {
                const status = normalizeStatus(order?.status);

                const StatusIcon = getStatusIcon(status);

                return (
                  <motion.article
                    key={order?._id}
                    className="staff-mobile-order-card"
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >
                    <div className="staff-mobile-order-top">
                      <div>
                        <span>{getOrderNumber(order)}</span>

                        <small>{formatDate(getOrderDate(order))}</small>
                      </div>

                      <strong>{formatCurrency(getOrderTotal(order))}</strong>
                    </div>

                    <div className="staff-mobile-order-customer">
                      <div className="staff-order-avatar">
                        {getCustomerName(order).charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{getCustomerName(order)}</strong>

                        <span>{getCustomerPhone(order) || "No phone"}</span>
                      </div>
                    </div>

                    <div className="staff-mobile-order-meta">
                      {renderPaymentBadge(order)}

                      <div
                        className={`staff-order-status-badge status-${status}`}
                      >
                        <StatusIcon />

                        <span>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="staff-mobile-view-btn"
                      onClick={() => openOrder(order)}
                    >
                      <FaEye />
                      View Order
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="staff-orders-pagination">
            <span>
              Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> –{" "}
              <strong>
                {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}
              </strong>{" "}
              of <strong>{filteredOrders.length}</strong>
            </span>

            <div>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <FaChevronLeft />
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) => index + 1,
              )
                .filter((page) => {
                  if (totalPages <= 5) return true;

                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={currentPage === page ? "active" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="staff-order-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeOrder}
          >
            <motion.div
              className="staff-order-modal"
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 18,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 18,
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="staff-order-modal-header">
                <div>
                  <span>ORDER DETAILS</span>

                  <h2>{getOrderNumber(selectedOrder)}</h2>
                </div>

                <button
                  type="button"
                  onClick={closeOrder}
                  aria-label="Close order details"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="staff-order-modal-summary">
                <div>
                  <span>Status</span>

                  <div
                    className={`staff-order-status-badge status-${normalizeStatus(
                      selectedOrder?.status,
                    )}`}
                  >
                    {(() => {
                      const Icon = getStatusIcon(
                        normalizeStatus(selectedOrder?.status),
                      );

                      return <Icon />;
                    })()}

                    <span>
                      {normalizeStatus(selectedOrder?.status)
                        .charAt(0)
                        .toUpperCase() +
                        normalizeStatus(selectedOrder?.status).slice(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <span>Payment</span>

                  {renderPaymentBadge(selectedOrder)}
                </div>

                <div>
                  <span>Order Date</span>

                  <strong>{formatDateTime(getOrderDate(selectedOrder))}</strong>
                </div>
              </div>

              <div className="staff-order-detail-section">
                <div className="staff-order-detail-title">
                  <FaUser />
                  <span>Customer</span>
                </div>

                <div className="staff-order-detail-customer">
                  <div className="staff-detail-avatar">
                    {getCustomerName(selectedOrder).charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{getCustomerName(selectedOrder)}</strong>

                    {getCustomerPhone(selectedOrder) && (
                      <span>
                        <FaPhone />
                        {getCustomerPhone(selectedOrder)}
                      </span>
                    )}

                    {selectedOrder?.customer?.email && (
                      <span>{selectedOrder.customer.email}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="staff-order-detail-section">
                <div className="staff-order-detail-title">
                  <FaIceCream />
                  <span>Order Items</span>
                </div>

                <div className="staff-order-detail-items">
                  {getOrderItems(selectedOrder).length === 0 ? (
                    <div className="staff-detail-empty">
                      No item details available.
                    </div>
                  ) : (
                    getOrderItems(selectedOrder).map((item, index) => (
                      <div
                        className="staff-detail-item"
                        key={
                          item?._id ||
                          item?.product?._id ||
                          item?.product ||
                          index
                        }
                      >
                        <div className="staff-detail-item-icon">
                          <FaIceCream />
                        </div>

                        <div className="staff-detail-item-copy">
                          <strong>
                            {item?.name || item?.product?.name || "Ice Cream"}
                          </strong>

                          <span>
                            {item?.sku ? `SKU: ${item.sku} · ` : ""}
                            Qty: {item?.quantity || 0}
                          </span>
                        </div>

                        <strong className="staff-detail-item-price">
                          {formatCurrency(
                            item?.total ??
                              item?.lineTotal ??
                              Number(item?.unitPrice || item?.price || 0) *
                                Number(item?.quantity || 0),
                          )}
                        </strong>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="staff-order-detail-totals">
                <div>
                  <span>Subtotal</span>

                  <strong>{formatCurrency(selectedOrder?.subtotal)}</strong>
                </div>

                <div>
                  <span>Discount</span>

                  <strong>{formatCurrency(selectedOrder?.discount)}</strong>
                </div>

                <div>
                  <span>Tax</span>

                  <strong>
                    {formatCurrency(
                      selectedOrder?.tax ?? selectedOrder?.taxAmount,
                    )}
                  </strong>
                </div>

                <div className="grand">
                  <span>Total</span>

                  <strong>
                    {formatCurrency(getOrderTotal(selectedOrder))}
                  </strong>
                </div>
              </div>

              <div className="staff-order-modal-actions">
                {["pending", "confirmed"].includes(
                  normalizeStatus(selectedOrder?.status),
                ) &&
                  normalizePaymentStatus(selectedOrder?.paymentStatus) !==
                    "paid" && (
                    <button
                      type="button"
                      className="danger"
                      disabled={updatingOrderId === selectedOrder?._id}
                      onClick={() => cancelOrder(selectedOrder)}
                    >
                      {updatingOrderId === selectedOrder?._id ? (
                        <FaSpinner className="spin" />
                      ) : (
                        <FaTimes />
                      )}
                      Cancel Order
                    </button>
                  )}

                <button type="button" className="close" onClick={closeOrder}>
                  Close
                </button>
              </div>

              {selectedOrder?.notes && (
                <div className="staff-order-notes">
                  <FaCircleExclamation />

                  <div>
                    <strong>Order Note</strong>

                    <p>{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffOrders;
