// frontend/src/pages/admin/AdminDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // USER INFORMATION
  // =====================================================

  const userName =
    user?.name?.trim() ||
    user?.username?.trim() ||
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

        // =================================================
        // PRODUCTS
        // =================================================

        if (productResponse.status === "fulfilled") {
          const data = productResponse.value?.data;

          const productList = Array.isArray(data)
            ? data
            : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
            ? data.data
            : [];

          setProducts(productList);
        } else {
          console.error(
            "Products dashboard request failed:",
            productResponse.reason
          );

          setProducts([]);
        }

        // =================================================
        // INVENTORY
        // =================================================

        if (inventoryResponse.status === "fulfilled") {
          const data = inventoryResponse.value?.data;

          const inventoryList = Array.isArray(data)
            ? data
            : Array.isArray(data?.inventory)
            ? data.inventory
            : Array.isArray(data?.data)
            ? data.data
            : [];

          setInventory(inventoryList);
        } else {
          console.error(
            "Inventory dashboard request failed:",
            inventoryResponse.reason
          );

          setInventory([]);
        }

        // =================================================
        // CUSTOMERS
        // =================================================

        if (customerResponse.status === "fulfilled") {
          const data = customerResponse.value?.data;

          const customerList = Array.isArray(data)
            ? data
            : Array.isArray(data?.customers)
            ? data.customers
            : Array.isArray(data?.data)
            ? data.data
            : [];

          setCustomers(customerList);
        } else {
          console.error(
            "Customers dashboard request failed:",
            customerResponse.reason
          );

          setCustomers([]);
        }
      } catch (error) {
        console.error(
          "Admin dashboard data error:",
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
  // DASHBOARD STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => {
      if (typeof product?.isActive === "boolean") {
        return product.isActive;
      }

      if (typeof product?.active === "boolean") {
        return product.active;
      }

      return true;
    });

    let lowStock = 0;

    inventory.forEach((item) => {
      const quantity =
        Number(item?.quantity) ||
        Number(item?.currentStock) ||
        Number(item?.stock) ||
        0;

      const minimum =
        Number(item?.reorderLevel) ||
        Number(item?.minStock) ||
        Number(item?.minimumStock) ||
        5;

      if (quantity <= minimum) {
        lowStock += 1;
      }
    });

    return {
      products: activeProducts.length,
      customers: customers.length,
      inventory: inventory.length,
      lowStock,
    };
  }, [products, inventory, customers]);

  // =====================================================
  // LOW STOCK ITEMS
  // =====================================================

  const lowStockItems = useMemo(() => {
    return inventory
      .map((item) => {
        const quantity =
          Number(item?.quantity) ||
          Number(item?.currentStock) ||
          Number(item?.stock) ||
          0;

        const minimum =
          Number(item?.reorderLevel) ||
          Number(item?.minStock) ||
          Number(item?.minimumStock) ||
          5;

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
  // NAVIGATION HANDLERS
  // =====================================================

  const openProducts = () => {
    navigate("/admin/products");
  };

  const openInventory = () => {
    navigate("/admin/inventory");
  };

  const openCustomers = () => {
    navigate("/admin/customers");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
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
            Welcome back, {firstName} 👋
          </h2>

          <p>
            Here's what's happening with your ice cream
            parlour today.
          </p>

        </div>

        <button
          type="button"
          className="primary-dashboard-button"
          onClick={openProducts}
        >
          <span>＋</span>
          Manage Products
        </button>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="dashboard-stat-grid">

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <button
          type="button"
          className="dashboard-stat-card"
          onClick={openProducts}
          aria-label="Open products"
        >

          <div className="stat-card-top">

            <div className="stat-icon stat-icon-products">
              🍨
            </div>

            <span className="stat-status">
              ACTIVE
            </span>

          </div>

          <div className="stat-number">
            {loading ? "—" : stats.products}
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

        </button>

        {/* =================================================
            CUSTOMERS
        ================================================= */}

        <button
          type="button"
          className="dashboard-stat-card"
          onClick={openCustomers}
          aria-label="Open customers"
        >

          <div className="stat-card-top">

            <div className="stat-icon stat-icon-customers">
              ♙
            </div>

            <span className="stat-status">
              USERS
            </span>

          </div>

          <div className="stat-number">
            {loading ? "—" : stats.customers}
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

        </button>

        {/* =================================================
            INVENTORY
        ================================================= */}

        <button
          type="button"
          className="dashboard-stat-card"
          onClick={openInventory}
          aria-label="Open inventory"
        >

          <div className="stat-card-top">

            <div className="stat-icon stat-icon-inventory">
              📦
            </div>

            <span className="stat-status">
              STOCK
            </span>

          </div>

          <div className="stat-number">
            {loading ? "—" : stats.inventory}
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

        </button>

        {/* =================================================
            LOW STOCK
        ================================================= */}

        <button
          type="button"
          className="dashboard-stat-card"
          onClick={openInventory}
          aria-label="Open low stock inventory"
        >

          <div className="stat-card-top">

            <div className="stat-icon stat-icon-warning">
              ⚠
            </div>

            <span className="stat-status warning">
              ATTENTION
            </span>

          </div>

          <div className="stat-number">
            {loading ? "—" : stats.lowStock}
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

        </button>

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
              onClick={openProducts}
            >

              <div className="quick-action-icon">
                🍦
              </div>

              <div>

                <strong>
                  Products
                </strong>

                <span>
                  Manage ice cream catalogue
                </span>

              </div>

              <b>
                →
              </b>

            </button>

            {/* INVENTORY */}

            <button
              type="button"
              className="quick-action"
              onClick={openInventory}
            >

              <div className="quick-action-icon">
                📦
              </div>

              <div>

                <strong>
                  Inventory
                </strong>

                <span>
                  Monitor stock levels
                </span>

              </div>

              <b>
                →
              </b>

            </button>

            {/* CUSTOMERS */}

            <button
              type="button"
              className="quick-action"
              onClick={openCustomers}
            >

              <div className="quick-action-icon">
                👥
              </div>

              <div>

                <strong>
                  Customers
                </strong>

                <span>
                  View customer records
                </span>

              </div>

              <b>
                →
              </b>

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
                ✓
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
                ✓
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
                ✓
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
            onClick={openInventory}
          >
            View Inventory →
          </button>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="dashboard-empty">

            <div className="empty-loader" />

            <p>
              Loading inventory...
            </p>

          </div>

        ) : lowStockItems.length === 0 ? (

          /* =================================================
             HEALTHY INVENTORY
          ================================================= */

          <div className="dashboard-empty success-empty">

            <div className="empty-success-icon">
              ✓
            </div>

            <div>

              <strong>
                Inventory looks healthy
              </strong>

              <p>
                No low-stock items require immediate
                attention.
              </p>

            </div>

          </div>

        ) : (

          /* =================================================
             LOW STOCK LIST
          ================================================= */

          <div className="stock-list">

            {lowStockItems.map((item, index) => {

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
                    🍨
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
            })}

          </div>

        )}

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="dashboard-footer">

        <div>

          <strong>
            🍦 IceCream Billing System
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
  );
};

export default AdminDashboard;