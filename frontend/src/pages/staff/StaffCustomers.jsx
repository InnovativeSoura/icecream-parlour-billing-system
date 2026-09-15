import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaCircleNotch,
  FaEnvelope,
  FaEye,
  FaFilter,
  FaHistory,
  FaPhone,
  FaPlus,
  FaSearch,
  FaShoppingBag,
  FaTimes,
  FaUser,
  FaUserCheck,
  FaUserPlus,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./StaffCustomers.css";

const PAGE_SIZE = 8;

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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

const getCustomerName = (customer) =>
  customer?.name ||
  customer?.customerName ||
  customer?.user?.name ||
  "Walk-in Customer";

const getCustomerEmail = (customer) =>
  customer?.email || customer?.user?.email || "No email";

const getCustomerPhone = (customer) =>
  customer?.phone || customer?.user?.phone || "No phone";

const getCustomerType = (customer) => {
  const value = String(
    customer?.customerType || customer?.type || ""
  ).toLowerCase();

  if (value === "walk-in" || value === "walkin") return "walk-in";

  return "registered";
};

const getOrderCount = (customer) =>
  Number(
    customer?.totalOrders ??
      customer?.ordersCount ??
      customer?.orderCount ??
      0
  );

const getTotalSpent = (customer) =>
  Number(
    customer?.totalSpent ??
      customer?.spent ??
      customer?.totalPurchase ??
      0
  );

const getLastOrderDate = (customer) =>
  customer?.lastOrderAt ||
  customer?.lastOrderDate ||
  customer?.updatedAt ||
  null;

const getCustomerInitials = (name) => {
  const words = String(name || "Customer")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "CU";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const getCustomerId = (customer) =>
  customer?._id || customer?.id || customer?.customerId || "";

const StaffCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [page, setPage] = useState(1);

  const fetchCustomers = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/customers");

      const data = response?.data;

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.customers)) {
        list = data.customers;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      }

      setCustomers(list);
    } catch (error) {
      console.error("Staff customers fetch error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to load customers."
      );

      setCustomers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = customers.length;

    const registered = customers.filter(
      (customer) => getCustomerType(customer) === "registered"
    ).length;

    const walkIn = customers.filter(
      (customer) => getCustomerType(customer) === "walk-in"
    ).length;

    const active = customers.filter(
      (customer) => customer?.isActive !== false
    ).length;

    const totalRevenue = customers.reduce(
      (sum, customer) => sum + getTotalSpent(customer),
      0
    );

    const totalOrders = customers.reduce(
      (sum, customer) => sum + getOrderCount(customer),
      0
    );

    return {
      total,
      registered,
      walkIn,
      active,
      totalRevenue,
      totalOrders,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = customers.filter((customer) => {
      const name = getCustomerName(customer).toLowerCase();
      const email = getCustomerEmail(customer).toLowerCase();
      const phone = getCustomerPhone(customer).toLowerCase();
      const id = String(getCustomerId(customer)).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        id.includes(query);

      const type = getCustomerType(customer);

      const matchesType =
        typeFilter === "all" || type === typeFilter;

      const isActive = customer?.isActive !== false;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesType && matchesStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return getCustomerName(a).localeCompare(
            getCustomerName(b)
          );

        case "name-desc":
          return getCustomerName(b).localeCompare(
            getCustomerName(a)
          );

        case "orders":
          return getOrderCount(b) - getOrderCount(a);

        case "spent":
          return getTotalSpent(b) - getTotalSpent(a);

        case "oldest":
          return (
            new Date(getLastOrderDate(a) || 0).getTime() -
            new Date(getLastOrderDate(b) || 0).getTime()
          );

        case "recent":
        default:
          return (
            new Date(getLastOrderDate(b) || 0).getTime() -
            new Date(getLastOrderDate(a) || 0).getTime()
          );
      }
    });

    return result;
  }, [
    customers,
    search,
    typeFilter,
    statusFilter,
    sortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE)
  );

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredCustomers.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredCustomers, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const activeFilterCount = [
    typeFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setSearch("");
    setSortBy("recent");
  };

  const fetchCustomerOrders = async (customer) => {
    const customerId = getCustomerId(customer);

    if (!customerId) {
      toast.info("Customer ID is unavailable.");
      return;
    }

    try {
      setSelectedCustomer(customer);
      setOrdersLoading(true);
      setCustomerOrders([]);

      const response = await api.get("/orders", {
        params: {
          customer: customerId,
        },
      });

      const data = response?.data;

      let orders = [];

      if (Array.isArray(data)) {
        orders = data;
      } else if (Array.isArray(data?.orders)) {
        orders = data.orders;
      } else if (Array.isArray(data?.data)) {
        orders = data.data;
      }

      setCustomerOrders(orders);
    } catch (error) {
      console.error("Customer order history error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to load customer order history."
      );

      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const closeCustomerModal = () => {
    setSelectedCustomer(null);
    setCustomerOrders([]);
  };

  const handleRefresh = () => {
    fetchCustomers(true);
  };

  const renderStatus = (customer) => {
    const active = customer?.isActive !== false;

    return (
      <span
        className={`staff-customer-status ${
          active ? "active" : "inactive"
        }`}
      >
        <span className="staff-status-dot" />
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  if (loading) {
    return (
      <section className="staff-customers-page">
        <div className="staff-customers-loading">
          <FaCircleNotch className="spin" />
          <span>Loading customers...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="staff-customers-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="staff-customers-header">
        <div>
          <span className="staff-customers-eyebrow">
            CUSTOMER MANAGEMENT
          </span>

          <h1>
            <FaUsers />
            Customers
          </h1>

          <p>
            Manage customer profiles, order history, and
            spending activity.
          </p>
        </div>

        <button
          type="button"
          className="staff-customers-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaHistory className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* =====================================================
          STATS
          ===================================================== */}

      <div className="staff-customers-stat-grid">
        <article className="staff-customers-stat-card">
          <div className="staff-customers-stat-icon customers">
            <FaUsers />
          </div>

          <div>
            <span>Total Customers</span>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="staff-customers-stat-card">
          <div className="staff-customers-stat-icon registered">
            <FaUserCheck />
          </div>

          <div>
            <span>Registered</span>
            <strong>{stats.registered}</strong>
          </div>
        </article>

        <article className="staff-customers-stat-card">
          <div className="staff-customers-stat-icon walkin">
            <FaUserPlus />
          </div>

          <div>
            <span>Walk-in</span>
            <strong>{stats.walkIn}</strong>
          </div>
        </article>

        <article className="staff-customers-stat-card">
          <div className="staff-customers-stat-icon revenue">
            <FaWallet />
          </div>

          <div>
            <span>Total Sales</span>
            <strong>{formatCurrency(stats.totalRevenue)}</strong>
          </div>
        </article>
      </div>

      {/* =====================================================
          MAIN PANEL
          ===================================================== */}

      <div className="staff-customers-panel">
        {/* TOOLBAR */}

        <div className="staff-customers-toolbar">
          <div className="staff-customers-search">
            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, phone, email..."
              aria-label="Search customers"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="staff-customers-toolbar-actions">
            <button
              type="button"
              className={`staff-customer-filter-toggle ${
                showFilters ? "active" : ""
              }`}
              onClick={() => setShowFilters((value) => !value)}
            >
              <FaFilter />
              Filters

              {activeFilterCount > 0 && (
                <span>{activeFilterCount}</span>
              )}
            </button>

            <label className="staff-customer-sort">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                aria-label="Sort customers"
              >
                <option value="recent">
                  Most Recent
                </option>
                <option value="oldest">
                  Oldest Activity
                </option>
                <option value="name-asc">
                  Name A–Z
                </option>
                <option value="name-desc">
                  Name Z–A
                </option>
                <option value="orders">
                  Most Orders
                </option>
                <option value="spent">
                  Highest Spending
                </option>
              </select>
            </label>
          </div>
        </div>

        {/* FILTERS */}

        {showFilters && (
          <div className="staff-customers-filters">
            <div className="staff-customer-filter-group">
              <label>
                <FaUsers />
                Customer Type
              </label>

              <div className="staff-customer-filter-pills">
                {[
                  ["all", "All"],
                  ["registered", "Registered"],
                  ["walk-in", "Walk-in"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      typeFilter === value ? "active" : ""
                    }
                    onClick={() =>
                      setTypeFilter(value)
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="staff-customer-filter-group">
              <label>
                <FaCheckCircle />
                Account Status
              </label>

              <div className="staff-customer-filter-pills">
                {[
                  ["all", "All"],
                  ["active", "Active"],
                  ["inactive", "Inactive"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      statusFilter === value ? "active" : ""
                    }
                    onClick={() =>
                      setStatusFilter(value)
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="staff-customers-reset"
                onClick={clearFilters}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* RESULT SUMMARY */}

        <div className="staff-customers-result-bar">
          <span>
            Showing{" "}
            <strong>
              {filteredCustomers.length === 0
                ? 0
                : (page - 1) * PAGE_SIZE + 1}
              –
              {Math.min(
                page * PAGE_SIZE,
                filteredCustomers.length
              )}
            </strong>{" "}
            of <strong>{filteredCustomers.length}</strong>{" "}
            customers
          </span>

          <span className="staff-customers-order-summary">
            <FaShoppingBag />
            {stats.totalOrders} total orders
          </span>
        </div>

        {/* DESKTOP TABLE */}

        {paginatedCustomers.length > 0 ? (
          <>
            <div className="staff-customers-table-wrapper">
              <table className="staff-customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Last Order</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCustomers.map((customer) => {
                    const name = getCustomerName(customer);
                    const email = getCustomerEmail(customer);
                    const phone = getCustomerPhone(customer);
                    const type = getCustomerType(customer);

                    return (
                      <tr
                        key={
                          getCustomerId(customer) ||
                          `${name}-${phone}`
                        }
                      >
                        <td>
                          <div className="staff-customer-name-cell">
                            <div className="staff-customer-avatar">
                              {getCustomerInitials(name)}
                            </div>

                            <div>
                              <strong>{name}</strong>

                              <span>
                                ID:{" "}
                                {String(
                                  getCustomerId(customer) ||
                                    "—"
                                ).slice(-8)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="staff-customer-contact">
                            <span>
                              <FaPhone />
                              {phone}
                            </span>

                            <span>
                              <FaEnvelope />
                              {email}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`staff-customer-type ${
                              type === "registered"
                                ? "registered"
                                : "walkin"
                            }`}
                          >
                            {type === "registered" ? (
                              <FaUserCheck />
                            ) : (
                              <FaUserPlus />
                            )}

                            {type === "registered"
                              ? "Registered"
                              : "Walk-in"}
                          </span>
                        </td>

                        <td>
                          <span className="staff-customer-orders-count">
                            {getOrderCount(customer)}
                          </span>
                        </td>

                        <td>
                          <strong className="staff-customer-spent">
                            {formatCurrency(
                              getTotalSpent(customer)
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="staff-customer-last-order">
                            <span>
                              {formatDate(
                                getLastOrderDate(customer)
                              )}
                            </span>

                            <small>
                              {getOrderCount(customer) > 0
                                ? "Purchase activity"
                                : "No orders yet"}
                            </small>
                          </div>
                        </td>

                        <td>{renderStatus(customer)}</td>

                        <td>
                          <button
                            type="button"
                            className="staff-view-customer-btn"
                            onClick={() =>
                              fetchCustomerOrders(customer)
                            }
                          >
                            <FaEye />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="staff-customers-mobile-list">
              {paginatedCustomers.map((customer) => {
                const name = getCustomerName(customer);
                const type = getCustomerType(customer);

                return (
                  <article
                    className="staff-mobile-customer-card"
                    key={
                      getCustomerId(customer) ||
                      `${name}-${getCustomerPhone(customer)}`
                    }
                  >
                    <div className="staff-mobile-customer-top">
                      <div className="staff-customer-avatar">
                        {getCustomerInitials(name)}
                      </div>

                      <div>
                        <strong>{name}</strong>
                        <span>
                          {type === "registered"
                            ? "Registered Customer"
                            : "Walk-in Customer"}
                        </span>
                      </div>

                      {renderStatus(customer)}
                    </div>

                    <div className="staff-mobile-customer-contact">
                      <span>
                        <FaPhone />
                        {getCustomerPhone(customer)}
                      </span>

                      <span>
                        <FaEnvelope />
                        {getCustomerEmail(customer)}
                      </span>
                    </div>

                    <div className="staff-mobile-customer-stats">
                      <div>
                        <span>Orders</span>
                        <strong>
                          {getOrderCount(customer)}
                        </strong>
                      </div>

                      <div>
                        <span>Spent</span>
                        <strong>
                          {formatCurrency(
                            getTotalSpent(customer)
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Last Order</span>
                        <strong>
                          {formatDate(
                            getLastOrderDate(customer)
                          )}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="staff-mobile-view-customer-btn"
                      onClick={() =>
                        fetchCustomerOrders(customer)
                      }
                    >
                      <FaEye />
                      View Customer
                    </button>
                  </article>
                );
              })}
            </div>

            {/* PAGINATION */}

            <div className="staff-customers-pagination">
              <span>
                Page <strong>{page}</strong> of{" "}
                <strong>{totalPages}</strong>
              </span>

              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  aria-label="Previous page"
                >
                  <FaChevronLeft />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .slice(
                    Math.max(0, page - 3),
                    Math.min(totalPages, page + 2)
                  )
                  .map((pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      className={
                        page === pageNumber ? "active" : ""
                      }
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  aria-label="Next page"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="staff-customers-empty">
            <div className="staff-customers-empty-icon">
              <FaUsers />
            </div>

            <h3>
              {customers.length === 0
                ? "No customers yet"
                : "No customers found"}
            </h3>

            <p>
              {customers.length === 0
                ? "Customer records will appear here as orders and registrations are created."
                : "Try changing your search or filter settings."}
            </p>

            {customers.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          CUSTOMER DETAIL MODAL
          ===================================================== */}

      {selectedCustomer && (
        <div
          className="staff-customer-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCustomerModal();
            }
          }}
        >
          <div className="staff-customer-modal">
            <div className="staff-customer-modal-header">
              <div>
                <span>CUSTOMER PROFILE</span>

                <h2>
                  {getCustomerName(selectedCustomer)}
                </h2>

                <p>
                  Customer since{" "}
                  {formatDate(
                    selectedCustomer.createdAt
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCustomerModal}
                aria-label="Close customer details"
              >
                <FaTimes />
              </button>
            </div>

            <div className="staff-customer-profile-summary">
              <div className="staff-detail-customer-avatar">
                {getCustomerInitials(
                  getCustomerName(selectedCustomer)
                )}
              </div>

              <div className="staff-detail-customer-copy">
                <strong>
                  {getCustomerName(selectedCustomer)}
                </strong>

                <span>
                  <FaPhone />
                  {getCustomerPhone(selectedCustomer)}
                </span>

                <span>
                  <FaEnvelope />
                  {getCustomerEmail(selectedCustomer)}
                </span>
              </div>

              <div>
                {renderStatus(selectedCustomer)}
              </div>
            </div>

            <div className="staff-customer-detail-stats">
              <div>
                <FaShoppingBag />

                <span>Total Orders</span>

                <strong>
                  {getOrderCount(selectedCustomer)}
                </strong>
              </div>

              <div>
                <FaWallet />

                <span>Total Spent</span>

                <strong>
                  {formatCurrency(
                    getTotalSpent(selectedCustomer)
                  )}
                </strong>
              </div>

              <div>
                <FaCalendarAlt />

                <span>Last Order</span>

                <strong>
                  {formatDate(
                    getLastOrderDate(selectedCustomer)
                  )}
                </strong>
              </div>
            </div>

            <div className="staff-customer-modal-section">
              <div className="staff-customer-modal-section-title">
                <FaHistory />
                <span>Order History</span>
              </div>

              {ordersLoading ? (
                <div className="staff-customer-orders-loading">
                  <FaCircleNotch className="spin" />
                  Loading order history...
                </div>
              ) : customerOrders.length > 0 ? (
                <div className="staff-customer-order-list">
                  {customerOrders.map((order, index) => {
                    const orderNumber =
                      order?.orderNumber ||
                      order?.orderId ||
                      `Order #${index + 1}`;

                    const amount = Number(
                      order?.totalAmount ??
                        order?.total ??
                        order?.amount ??
                        0
                    );

                    const paymentStatus =
                      String(
                        order?.paymentStatus || "pending"
                      ).toLowerCase();

                    const orderStatus =
                      String(
                        order?.status || "pending"
                      ).toLowerCase();

                    return (
                      <div
                        className="staff-customer-order-row"
                        key={
                          order?._id ||
                          order?.id ||
                          `${orderNumber}-${index}`
                        }
                      >
                        <div className="staff-order-history-icon">
                          <FaShoppingBag />
                        </div>

                        <div className="staff-order-history-copy">
                          <strong>{orderNumber}</strong>

                          <span>
                            {formatDateTime(
                              order?.createdAt ||
                                order?.orderDate
                            )}
                          </span>
                        </div>

                        <div className="staff-order-history-status">
                          <span
                            className={`staff-history-status ${
                              orderStatus
                                .replace(/\s+/g, "-")
                            }`}
                          >
                            {orderStatus}
                          </span>

                          <span
                            className={`staff-history-payment ${
                              paymentStatus
                                .replace(/\s+/g, "-")
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </div>

                        <strong className="staff-order-history-amount">
                          {formatCurrency(amount)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="staff-customer-no-orders">
                  <div>
                    <FaShoppingBag />
                  </div>

                  <strong>No orders yet</strong>

                  <span>
                    This customer has no recorded orders.
                  </span>
                </div>
              )}
            </div>

            <div className="staff-customer-modal-footer">
              <button
                type="button"
                onClick={closeCustomerModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StaffCustomers;