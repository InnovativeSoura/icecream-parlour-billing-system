import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaCheck,
  FaClock,
  FaSpinner,
  FaShoppingBag,
  FaRupeeSign,
  FaUser,
  FaCalendarAlt,
  FaCreditCard,
  FaClipboardList,
  FaChevronDown,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./Orders.css";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
  "refunded",
];

const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalizeStatus = (status) => {
  const value = String(status || "pending")
    .trim()
    .toLowerCase();

  return value || "pending";
};

const normalizePaymentStatus = (status) => {
  const value = String(status || "pending")
    .trim()
    .toLowerCase();

  return value || "pending";
};

const getOrderId = (order) => order?.id || order?._id || order?.orderId || "";

const getOrderNumber = (order) =>
  order?.orderNumber ||
  order?.number ||
  `ORDER-${String(getOrderId(order)).slice(-6)}`;

const getCustomerName = (order) => {
  return (
    order?.customer?.name ||
    order?.customerSnapshot?.name ||
    order?.customerName ||
    "Walk-in Customer"
  );
};

const getCustomerPhone = (order) => {
  return (
    order?.customer?.phone ||
    order?.customerSnapshot?.phone ||
    order?.phone ||
    "—"
  );
};

const getCustomerEmail = (order) => {
  return (
    order?.customer?.email ||
    order?.customerSnapshot?.email ||
    order?.email ||
    "—"
  );
};

const getItemsCount = (order) => {
  if (!Array.isArray(order?.items)) {
    return 0;
  }

  return order.items.reduce(
    (total, item) => total + (Number(item?.quantity) || 0),
    0,
  );
};

const getOrderTotal = (order) => {
  return (
    Number(order?.totalAmount ?? order?.total ?? order?.grandTotal ?? 0) || 0
  );
};

const extractOrders = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.orders)) {
    return payload.orders;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};

const getStatusClass = (status) => {
  const normalized = normalizeStatus(status);

  return `status-${normalized}`;
};

const getPaymentClass = (status) => {
  const normalized = normalizePaymentStatus(status);

  return `payment-${normalized}`;
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/orders");

      setOrders(extractOrders(response));
    } catch (error) {
      console.error("Failed to load orders:", error);

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
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderNumber = getOrderNumber(order).toLowerCase();

      const customer = getCustomerName(order).toLowerCase();

      const phone = getCustomerPhone(order).toLowerCase();

      const status = normalizeStatus(order?.status);

      const paymentStatus = normalizePaymentStatus(order?.paymentStatus);

      const matchesSearch =
        !query ||
        orderNumber.includes(query) ||
        customer.includes(query) ||
        phone.includes(query);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesPayment =
        paymentFilter === "all" || paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const stats = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter(
      (order) => normalizeStatus(order?.status) === "pending",
    ).length;

    const processing = orders.filter((order) =>
      ["confirmed", "processing"].includes(normalizeStatus(order?.status)),
    ).length;

    const completed = orders.filter(
      (order) => normalizeStatus(order?.status) === "completed",
    ).length;

    const paidRevenue = orders
      .filter(
        (order) => normalizePaymentStatus(order?.paymentStatus) === "paid",
      )
      .reduce((sum, order) => sum + getOrderTotal(order), 0);

    return {
      total,
      pending,
      processing,
      completed,
      paidRevenue,
    };
  }, [orders]);

  const handleStatusChange = async (order, newStatus) => {
    const orderId = getOrderId(order);

    if (!orderId || !newStatus) {
      return;
    }

    const previousStatus = normalizeStatus(order?.status);

    if (previousStatus === newStatus) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);

      const response = await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      const updatedOrder =
        response?.data?.order || response?.data?.data || response?.data;

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          getOrderId(item) === orderId
            ? {
                ...item,
                ...(updatedOrder && typeof updatedOrder === "object"
                  ? updatedOrder
                  : {}),
                status: newStatus,
              }
            : item,
        ),
      );

      setSelectedOrder((current) =>
        current && getOrderId(current) === orderId
          ? {
              ...current,
              ...(updatedOrder && typeof updatedOrder === "object"
                ? updatedOrder
                : {}),
              status: newStatus,
            }
          : current,
      );

      toast.success(`Order marked as ${newStatus}.`);
    } catch (error) {
      console.error("Failed to update order:", error);

      toast.error(
        error?.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
  };

  return (
    <div className="admin-orders-page">
      <motion.section
        className="orders-hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <span className="orders-eyebrow">ORDER MANAGEMENT</span>

          <h2>Orders</h2>

          <p>
            Monitor customer orders, payments, and fulfilment status from one
            place.
          </p>
        </div>

        <button
          type="button"
          className="orders-refresh-button"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <FaSyncAlt className={refreshing ? "orders-spin" : ""} />

          {refreshing ? "Refreshing..." : "Refresh Orders"}
        </button>
      </motion.section>

      <section className="orders-stat-grid">
        <motion.div
          className="order-stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="order-stat-icon purple">
            <FaClipboardList />
          </div>

          <div className="order-stat-content">
            <span>Total Orders</span>
            <strong>{stats.total}</strong>
            <small>All recorded orders</small>
          </div>
        </motion.div>

        <motion.div
          className="order-stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="order-stat-icon orange">
            <FaClock />
          </div>

          <div className="order-stat-content">
            <span>Pending</span>
            <strong>{stats.pending}</strong>
            <small>Awaiting action</small>
          </div>
        </motion.div>

        <motion.div
          className="order-stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="order-stat-icon blue">
            <FaSpinner />
          </div>

          <div className="order-stat-content">
            <span>In Progress</span>
            <strong>{stats.processing}</strong>
            <small>Confirmed or processing</small>
          </div>
        </motion.div>

        <motion.div
          className="order-stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="order-stat-icon green">
            <FaRupeeSign />
          </div>

          <div className="order-stat-content">
            <span>Paid Revenue</span>
            <strong>{formatCurrency(stats.paidRevenue)}</strong>
            <small>From paid orders</small>
          </div>
        </motion.div>
      </section>

      <section className="orders-toolbar">
        <div className="orders-search">
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
              className="clear-search"
              onClick={() => setSearch("")}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="orders-filter">
          <FaFilter />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option value={status} key={status}>
                {status === "all"
                  ? "All Statuses"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <FaChevronDown className="select-arrow" />
        </div>

        <div className="orders-filter">
          <FaCreditCard />

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="all">All Payments</option>

            <option value="paid">Paid</option>

            <option value="pending">Pending</option>

            <option value="failed">Failed</option>

            <option value="cancelled">Cancelled</option>

            <option value="refunded">Refunded</option>
          </select>

          <FaChevronDown className="select-arrow" />
        </div>

        {(search || statusFilter !== "all" || paymentFilter !== "all") && (
          <button
            type="button"
            className="orders-reset-button"
            onClick={resetFilters}
          >
            Reset
          </button>
        )}
      </section>

      <section className="orders-table-card">
        <div className="orders-table-header">
          <div>
            <span className="orders-table-eyebrow">SALES RECORDS</span>

            <h3>All Orders</h3>
          </div>

          <span className="orders-result-count">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        {loading ? (
          <div className="orders-loading">
            <div className="orders-loader">
              <FaSpinner />
            </div>

            <strong>Loading orders...</strong>

            <span>Fetching the latest order records.</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty-icon">
              <FaShoppingBag />
            </div>

            <h3>No orders found</h3>

            <p>Try changing your search or filters.</p>

            {(search || statusFilter !== "all" || paymentFilter !== "all") && (
              <button type="button" onClick={resetFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
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
                {filteredOrders.map((order, index) => {
                  const orderId = getOrderId(order);

                  const status = normalizeStatus(order?.status);

                  const paymentStatus = normalizePaymentStatus(
                    order?.paymentStatus,
                  );

                  const isUpdating = updatingOrderId === orderId;

                  return (
                    <motion.tr
                      key={orderId || getOrderNumber(order)}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.025,
                      }}
                    >
                      <td>
                        <div className="order-number-cell">
                          <div className="order-number-icon">
                            <FaShoppingBag />
                          </div>

                          <div>
                            <strong>{getOrderNumber(order)}</strong>

                            <span>
                              {order?.orderType === "online"
                                ? "Online Order"
                                : "POS Order"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="customer-cell">
                          <div className="customer-mini-avatar">
                            {getCustomerName(order).slice(0, 1).toUpperCase()}
                          </div>

                          <div>
                            <strong>{getCustomerName(order)}</strong>

                            <span>{getCustomerPhone(order)}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="date-cell">
                          <strong>{formatDate(order?.createdAt)}</strong>

                          <span>
                            {new Date(
                              order?.createdAt || Date.now(),
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="items-count">
                          {getItemsCount(order)}
                          {getItemsCount(order) === 1 ? " item" : " items"}
                        </span>
                      </td>

                      <td>
                        <strong className="order-amount">
                          {formatCurrency(getOrderTotal(order))}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`payment-badge ${getPaymentClass(
                            paymentStatus,
                          )}`}
                        >
                          {paymentStatus}
                        </span>
                      </td>

                      <td>
                        <div className="status-select-wrapper">
                          <select
                            className={`order-status-select ${getStatusClass(
                              status,
                            )}`}
                            value={status}
                            disabled={isUpdating}
                            onChange={(event) =>
                              handleStatusChange(order, event.target.value)
                            }
                          >
                            {STATUS_OPTIONS.filter(
                              (item) => item !== "all",
                            ).map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {statusOption.charAt(0).toUpperCase() +
                                  statusOption.slice(1)}
                              </option>
                            ))}
                          </select>

                          {isUpdating && (
                            <FaSpinner className="status-spinner orders-spin" />
                          )}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="view-order-button"
                          onClick={() => setSelectedOrder(order)}
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
        )}
      </section>

      {!loading && filteredOrders.length > 0 && (
        <section className="orders-mobile-list">
          {filteredOrders.map((order) => {
            const orderId = getOrderId(order);

            const status = normalizeStatus(order?.status);

            const paymentStatus = normalizePaymentStatus(order?.paymentStatus);

            return (
              <div className="mobile-order-card" key={orderId}>
                <div className="mobile-order-top">
                  <div className="mobile-order-number">
                    <div className="order-number-icon">
                      <FaShoppingBag />
                    </div>

                    <div>
                      <strong>{getOrderNumber(order)}</strong>

                      <span>{formatDate(order?.createdAt)}</span>
                    </div>
                  </div>

                  <span
                    className={`payment-badge ${getPaymentClass(
                      paymentStatus,
                    )}`}
                  >
                    {paymentStatus}
                  </span>
                </div>

                <div className="mobile-order-customer">
                  <FaUser />

                  <span>{getCustomerName(order)}</span>
                </div>

                <div className="mobile-order-bottom">
                  <div>
                    <small>Total</small>

                    <strong>{formatCurrency(getOrderTotal(order))}</strong>
                  </div>

                  <button type="button" onClick={() => setSelectedOrder(order)}>
                    <FaEye />
                    View
                  </button>
                </div>

                <div className="mobile-order-status">
                  <span>Status</span>

                  <select
                    className={`order-status-select ${getStatusClass(status)}`}
                    value={status}
                    disabled={updatingOrderId === orderId}
                    onChange={(event) =>
                      handleStatusChange(order, event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.filter((item) => item !== "all").map(
                      (item) => (
                        <option value={item} key={item}>
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="order-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              className="order-modal"
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 20,
              }}
              transition={{
                duration: 0.22,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="order-modal-header">
                <div>
                  <span>ORDER DETAILS</span>

                  <h3>{getOrderNumber(selectedOrder)}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close order details"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="order-modal-summary">
                <div>
                  <span>Customer</span>
                  <strong>{getCustomerName(selectedOrder)}</strong>
                </div>

                <div>
                  <span>Order Date</span>
                  <strong>{formatDateTime(selectedOrder?.createdAt)}</strong>
                </div>

                <div>
                  <span>Payment</span>
                  <strong>
                    {normalizePaymentStatus(selectedOrder?.paymentStatus)}
                  </strong>
                </div>

                <div>
                  <span>Order Type</span>
                  <strong>
                    {selectedOrder?.orderType === "online" ? "Online" : "POS"}
                  </strong>
                </div>
              </div>

              <div className="order-customer-details">
                <div>
                  <FaUser />

                  <span>{getCustomerName(selectedOrder)}</span>
                </div>

                <div>
                  <FaCreditCard />

                  <span>{getCustomerPhone(selectedOrder)}</span>
                </div>

                <div>
                  <FaCalendarAlt />

                  <span>{getCustomerEmail(selectedOrder)}</span>
                </div>
              </div>

              <div className="order-items-section">
                <div className="modal-section-title">
                  <span>ORDER ITEMS</span>
                  <strong>{getItemsCount(selectedOrder)} items</strong>
                </div>

                {Array.isArray(selectedOrder?.items) &&
                selectedOrder.items.length > 0 ? (
                  <div className="order-items-list">
                    {selectedOrder.items.map((item, index) => {
                      const quantity = Number(item?.quantity) || 1;

                      const unitPrice = Number(item?.unitPrice) || 0;

                      const itemTotal =
                        Number(item?.total ?? unitPrice * quantity) || 0;

                      return (
                        <div
                          className="order-item-row"
                          key={item?.product || item?.sku || index}
                        >
                          <div className="order-item-image">
                            {item?.image ? (
                              <img
                                src={item.image}
                                alt={item?.name || "Product"}
                              />
                            ) : (
                              <FaShoppingBag />
                            )}
                          </div>

                          <div className="order-item-info">
                            <strong>{item?.name || "Ice Cream Item"}</strong>

                            <span>
                              {quantity} × {formatCurrency(unitPrice)}
                            </span>
                          </div>

                          <strong className="order-item-total">
                            {formatCurrency(itemTotal)}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-order-items">
                    No item details available.
                  </div>
                )}
              </div>

              <div className="order-total-box">
                <div>
                  <span>Subtotal</span>

                  <strong>{formatCurrency(selectedOrder?.subtotal)}</strong>
                </div>

                <div>
                  <span>Discount</span>

                  <strong>- {formatCurrency(selectedOrder?.discount)}</strong>
                </div>

                <div>
                  <span>Tax</span>

                  <strong>{formatCurrency(selectedOrder?.tax)}</strong>
                </div>

                <div className="grand-total">
                  <span>Total Amount</span>

                  <strong>
                    {formatCurrency(getOrderTotal(selectedOrder))}
                  </strong>
                </div>
              </div>

              <div className="order-modal-footer">
                <div className="modal-status-control">
                  <label>ORDER STATUS</label>

                  <div className="modal-status-select">
                    <select
                      value={normalizeStatus(selectedOrder?.status)}
                      disabled={updatingOrderId === getOrderId(selectedOrder)}
                      onChange={(event) =>
                        handleStatusChange(selectedOrder, event.target.value)
                      }
                    >
                      {STATUS_OPTIONS.filter((item) => item !== "all").map(
                        (item) => (
                          <option value={item} key={item}>
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                          </option>
                        ),
                      )}
                    </select>

                    <FaChevronDown />
                  </div>
                </div>

                <button
                  type="button"
                  className="close-modal-button"
                  onClick={() => setSelectedOrder(null)}
                >
                  <FaCheck />
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
