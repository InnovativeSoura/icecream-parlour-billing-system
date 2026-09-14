// frontend/src/pages/admin/AdminDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

import {
  FaIceCream,
  FaUsers,
  FaBoxes,
  FaExclamationTriangle,
  FaArrowRight,
  FaCheckCircle,
  FaSpinner,
  FaBoxOpen,
} from "react-icons/fa";

import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // USER DATA
  // =====================================================

  const userName =
    user?.name?.trim() ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const firstName =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] || "Administrator";

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          api.get("/products"),
          api.get("/inventory"),
          api.get("/customers"),
        ]);

        if (!mounted) {
          return;
        }

        const productResponse = results[0];
        const inventoryResponse = results[1];
        const customerResponse = results[2];

        // -------------------------------------------------
        // PRODUCTS
        // -------------------------------------------------

        if (productResponse.status === "fulfilled") {
          const data = productResponse.value?.data;

          setProducts(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.products)
              ? data.products
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        } else {
          console.error(
            "Failed to load products:",
            productResponse.reason
          );
        }

        // -------------------------------------------------
        // INVENTORY
        // -------------------------------------------------

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
        } else {
          console.error(
            "Failed to load inventory:",
            inventoryResponse.reason
          );
        }

        // -------------------------------------------------
        // CUSTOMERS
        // -------------------------------------------------

        if (customerResponse.status === "fulfilled") {
          const data = customerResponse.value?.data;

          setCustomers(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.customers)
              ? data.customers
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        } else {
          console.error(
            "Failed to load customers:",
            customerResponse.reason
          );
        }
      } catch (error) {
        console.error(
          "Dashboard data error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // PRODUCT / INVENTORY HELPERS
  // =====================================================

  const isProductActive = (product) => {
    if (typeof product?.isActive === "boolean") {
      return product.isActive;
    }

    if (typeof product?.active === "boolean") {
      return product.active;
    }

    return true;
  };

  const getInventoryQuantity = (item) => {
    const values = [
      item?.quantity,
      item?.currentStock,
      item?.stock,
      item?.availableQuantity,
    ];

    for (const value of values) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }

    return 0;
  };

  const getMinimumStock = (item) => {
    const values = [
      item?.reorderLevel,
      item?.minStock,
      item?.minimumStock,
      item?.minimumQuantity,
    ];

    for (const value of values) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }

    return 5;
  };

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    const activeProducts =
      products.filter(isProductActive);

    const lowStockCount = inventory.reduce(
      (count, item) => {
        const quantity =
          getInventoryQuantity(item);

        const minimum =
          getMinimumStock(item);

        return quantity <= minimum
          ? count + 1
          : count;
      },
      0
    );

    return {
      products: activeProducts.length,
      customers: customers.length,
      inventory: inventory.length,
      lowStock: lowStockCount,
    };
  }, [products, inventory, customers]);

  // =====================================================
  // LOW STOCK ITEMS
  // =====================================================

  const lowStockItems = useMemo(() => {
    return inventory
      .map((item) => {
        const quantity =
          getInventoryQuantity(item);

        const minimum =
          getMinimumStock(item);

        return {
          ...item,
          calculatedQuantity: quantity,
          calculatedMinimum: minimum,
        };
      })
      .filter(
        (item) =>
          item.calculatedQuantity <=
          item.calculatedMinimum
      )
      .sort(
        (a, b) =>
          a.calculatedQuantity -
          b.calculatedQuantity
      )
      .slice(0, 5);
  }, [inventory]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-dashboard-content">

      {/* =================================================
          BACKGROUND DECORATION
      ================================================= */}

      <div className="admin-dashboard-glow glow-one" />
      <div className="admin-dashboard-glow glow-two" />
      <div className="admin-dashboard-glow glow-three" />

      <section className="dashboard-content">

        {/* =================================================
            WELCOME SECTION
        ================================================= */}

        <div className="welcome-section">

          <div className="welcome-copy">

            <span className="welcome-label">
              OVERVIEW
            </span>

            <h2>
              Welcome back, {firstName}
              <span className="welcome-wave">
                👋
              </span>
            </h2>

            <p>
              Here's what's happening with your
              ice cream parlour today.
            </p>

          </div>

          <button
            type="button"
            className="primary-dashboard-button"
            onClick={() =>
              navigate("/products")
            }
          >
            <FaIceCream />

            <span>
              Manage Products
            </span>

            <FaArrowRight />
          </button>

        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="dashboard-stat-grid">

          {/* PRODUCTS */}

          <article className="dashboard-stat-card">

            <div className="stat-card-top">

              <div className="stat-icon stat-icon-products">
                <FaIceCream />
              </div>

              <span className="stat-status">
                ACTIVE
              </span>

            </div>

            <div className="stat-number">
              {loading ? (
                <FaSpinner className="dashboard-spinner" />
              ) : (
                stats.products
              )}
            </div>

            <div className="stat-label">
              Total Products
            </div>

            <div className="stat-footer">
              <span className="stat-trend">
                ●
              </span>

              Available in catalogue
            </div>

          </article>

          {/* CUSTOMERS */}

          <article className="dashboard-stat-card">

            <div className="stat-card-top">

              <div className="stat-icon stat-icon-customers">
                <FaUsers />
              </div>

              <span className="stat-status">
                USERS
              </span>

            </div>

            <div className="stat-number">
              {loading ? (
                <FaSpinner className="dashboard-spinner" />
              ) : (
                stats.customers
              )}
            </div>

            <div className="stat-label">
              Registered Customers
            </div>

            <div className="stat-footer">
              <span className="stat-trend">
                ●
              </span>

              Customer database
            </div>

          </article>

          {/* INVENTORY */}

          <article className="dashboard-stat-card">

            <div className="stat-card-top">

              <div className="stat-icon stat-icon-inventory">
                <FaBoxes />
              </div>

              <span className="stat-status">
                STOCK
              </span>

            </div>

            <div className="stat-number">
              {loading ? (
                <FaSpinner className="dashboard-spinner" />
              ) : (
                stats.inventory
              )}
            </div>

            <div className="stat-label">
              Inventory Items
            </div>

            <div className="stat-footer">
              <span className="stat-trend">
                ●
              </span>

              Stock records
            </div>

          </article>

          {/* LOW STOCK */}

          <article className="dashboard-stat-card">

            <div className="stat-card-top">

              <div className="stat-icon stat-icon-warning">
                <FaExclamationTriangle />
              </div>

              <span className="stat-status warning">
                ATTENTION
              </span>

            </div>

            <div className="stat-number">
              {loading ? (
                <FaSpinner className="dashboard-spinner" />
              ) : (
                stats.lowStock
              )}
            </div>

            <div className="stat-label">
              Low Stock Items
            </div>

            <div className="stat-footer">

              <span className="stat-trend warning-dot">
                ●
              </span>

              Requires attention

            </div>

          </article>

        </div>

        {/* =================================================
            MAIN DASHBOARD GRID
        ================================================= */}

        <div className="dashboard-main-grid">

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="dashboard-panel">

            <div className="panel-header">

              <div>

                <span className="panel-eyebrow">
                  WORKSPACE
                </span>

                <h3>
                  Quick Actions
                </h3>

              </div>

              <span className="panel-header-icon">
                ✦
              </span>

            </div>

            <div className="quick-actions">

              {/* PRODUCTS */}

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  navigate("/products")
                }
              >

                <div className="quick-action-icon">
                  <FaIceCream />
                </div>

                <div className="quick-action-content">

                  <strong>
                    Products
                  </strong>

                  <span>
                    Manage ice cream catalogue
                  </span>

                </div>

                <FaArrowRight className="quick-action-arrow" />

              </button>

              {/* INVENTORY */}

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  navigate("/inventory")
                }
              >

                <div className="quick-action-icon">
                  <FaBoxes />
                </div>

                <div className="quick-action-content">

                  <strong>
                    Inventory
                  </strong>

                  <span>
                    Monitor stock levels
                  </span>

                </div>

                <FaArrowRight className="quick-action-arrow" />

              </button>

              {/* CUSTOMERS */}

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  navigate("/customers")
                }
              >

                <div className="quick-action-icon">
                  <FaUsers />
                </div>

                <div className="quick-action-content">

                  <strong>
                    Customers
                  </strong>

                  <span>
                    View customer records
                  </span>

                </div>

                <FaArrowRight className="quick-action-arrow" />

              </button>

            </div>

          </section>

          {/* =================================================
              SYSTEM STATUS
          ================================================= */}

          <section className="dashboard-panel system-panel">

            <div className="panel-header">

              <div>

                <span className="panel-eyebrow">
                  SYSTEM
                </span>

                <h3>
                  System Status
                </h3>

              </div>

              <span className="system-live">
                ● LIVE
              </span>

            </div>

            <div className="system-status-list">

              {/* APPLICATION */}

              <div className="system-status-item">

                <div className="status-indicator">
                  <FaCheckCircle />
                </div>

                <div>

                  <strong>
                    Application
                  </strong>

                  <span>
                    System operational
                  </span>

                </div>

                <em>
                  Online
                </em>

              </div>

              {/* AUTHENTICATION */}

              <div className="system-status-item">

                <div className="status-indicator">
                  <FaCheckCircle />
                </div>

                <div>

                  <strong>
                    Authentication
                  </strong>

                  <span>
                    Secure session active
                  </span>

                </div>

                <em>
                  Secure
                </em>

              </div>

              {/* DATABASE */}

              <div className="system-status-item">

                <div className="status-indicator">
                  <FaCheckCircle />
                </div>

                <div>

                  <strong>
                    Database
                  </strong>

                  <span>
                    Data services connected
                  </span>

                </div>

                <em>
                  Connected
                </em>

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            INVENTORY ALERTS
        ================================================= */}

        <section className="dashboard-panel inventory-panel">

          <div className="panel-header">

            <div>

              <span className="panel-eyebrow">
                INVENTORY
              </span>

              <h3>
                Stock Alerts
              </h3>

            </div>

            <button
              type="button"
              className="panel-link"
              onClick={() =>
                navigate("/inventory")
              }
            >
              View Inventory
              <FaArrowRight />
            </button>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="dashboard-empty">

              <FaSpinner className="empty-loader" />

              <p>
                Loading inventory...
              </p>

            </div>

          ) : lowStockItems.length === 0 ? (

            /* HEALTHY INVENTORY */

            <div className="dashboard-empty success-empty">

              <div className="empty-success-icon">
                <FaCheckCircle />
              </div>

              <div>

                <strong>
                  Inventory looks healthy
                </strong>

                <p>
                  No low-stock items require
                  immediate attention.
                </p>

              </div>

            </div>

          ) : (

            /* LOW STOCK LIST */

            <div className="stock-list">

              {lowStockItems.map(
                (item, index) => {

                  const productName =
                    item?.product?.name ||
                    item?.productName ||
                    item?.name ||
                    `Inventory Item ${index + 1}`;

                  return (
                    <div
                      className="stock-row"
                      key={
                        item?._id ||
                        item?.id ||
                        index
                      }
                    >

                      <div className="stock-product-icon">
                        <FaIceCream />
                      </div>

                      <div className="stock-product-info">

                        <strong>
                          {productName}
                        </strong>

                        <span>
                          Minimum level:{" "}
                          {item.calculatedMinimum}
                        </span>

                      </div>

                      <div className="stock-quantity">

                        <strong>
                          {item.calculatedQuantity}
                        </strong>

                        <span>
                          remaining
                        </span>

                      </div>

                      <span className="low-stock-badge">
                        LOW STOCK
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="dashboard-footer">

          <div>

            <strong>
              <FaIceCream />
              IceCream Billing System
            </strong>

            <span>
              Admin Control Center
            </span>

          </div>

          <span>
            © {new Date().getFullYear()} All rights reserved.
          </span>

        </footer>

      </section>

    </div>
  );
};

export default AdminDashboard;