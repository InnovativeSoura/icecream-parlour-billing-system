// frontend/src/App.jsx

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// =====================================================
// CONTEXT
// =====================================================

import { useAuth } from "./context/AuthContext";

// =====================================================
// AUTH / ROUTE PROTECTION
// =====================================================

import ProtectedRoute from "./components/ProtectedRoute";

// =====================================================
// PUBLIC PAGES
// =====================================================

import Login from "./pages/Login";
import Register from "./pages/Register";

// =====================================================
// DASHBOARDS
// =====================================================

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";

// =====================================================
// ADMIN LAYOUT
// =====================================================

import AdminLayout from "./layouts/admin/Layout.jsx";

// =====================================================
// CUSTOMER LAYOUT
// =====================================================

import CustomerLayout from "./layouts/costomer/CustomerLayout.jsx";

// =====================================================
// CUSTOMER PAGES
// =====================================================

import CustomerProducts from "./pages/CustomerProducts";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerCart from "./pages/customer/MyCart";
import CustomerInvoices from "./pages/customer/Invoices";
import CustomerProfile from "./pages/customer/Profile";

// =====================================================
// ADMIN / STAFF PAGES
// =====================================================

import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Customer from "./pages/Customers.jsx";

// =====================================================
// HOME REDIRECT
// =====================================================

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  // ===================================================
  // AUTH LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg, #f8f7ff 0%, #ffffff 100%)",
          color: "#6d4aff",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: "15px",
          fontWeight: 700,
        }}
      >
        Loading...
      </div>
    );
  }

  // ===================================================
  // NOT LOGGED IN
  // ===================================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ===================================================
  // ADMIN
  // ===================================================

  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // ===================================================
  // STAFF
  // ===================================================

  if (user.role === "staff") {
    return (
      <Navigate
        to="/staff/dashboard"
        replace
      />
    );
  }

  // ===================================================
  // CUSTOMER
  // ===================================================

  if (user.role === "customer") {
    return (
      <Navigate
        to="/customer/dashboard"
        replace
      />
    );
  }

  // ===================================================
  // UNKNOWN ROLE
  // ===================================================

  return (
    <Navigate
      to="/login"
      replace
    />
  );
};

// =====================================================
// APP
// =====================================================

const App = () => {
  return (
    <>
      <Routes>

        {/* =================================================
            PUBLIC ROUTES
        ================================================= */}

        <Route
          path="/"
          element={<HomeRedirect />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =================================================
            ADMIN ROUTES
        =================================================

            AdminLayout is the common shell for ALL admin
            pages.

            AdminLayout provides:

            - Sidebar
            - Top navbar
            - Admin profile
            - Logout
            - Main content area
            - Outlet

            Individual admin pages should render ONLY their
            page content and should NOT create another
            sidebar/navbar.

        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            />
          }
        >

          <Route
            path="/admin"
            element={<AdminLayout />}
          >

            {/* =================================================
                ADMIN ROOT
            ================================================= */}

            <Route
              index
              element={
                <Navigate
                  to="/admin/dashboard"
                  replace
                />
              }
            />

            {/* =================================================
                ADMIN DASHBOARD
            ================================================= */}

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            {/* =================================================
                ADMIN PRODUCTS
            ================================================= */}

            <Route
              path="products"
              element={<Products />}
            />

            {/* =================================================
                ADMIN INVENTORY
            ================================================= */}

            <Route
              path="inventory"
              element={<Inventory />}
            />

            {/* =================================================
                ADMIN CUSTOMERS
            ================================================= */}

            <Route
              path="customers"
              element={<Customer />}
            />

          </Route>

        </Route>

        {/* =================================================
            STAFF ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["staff"]}
            />
          }
        >

          <Route
            path="/staff"
            element={
              <Navigate
                to="/staff/dashboard"
                replace
              />
            }
          />

          <Route
            path="/staff/dashboard"
            element={<StaffDashboard />}
          />

          {/* =================================================
              STAFF PRODUCTS
          ================================================= */}

          <Route
            path="/staff/products"
            element={<Products />}
          />

          {/* =================================================
              STAFF INVENTORY
          ================================================= */}

          <Route
            path="/staff/inventory"
            element={<Inventory />}
          />

          {/* =================================================
              STAFF CUSTOMERS
          ================================================= */}

          <Route
            path="/staff/customers"
            element={<Customer />}
          />

        </Route>

        {/* =================================================
            CUSTOMER ROUTES
        =================================================

            CustomerLayout provides:

            - Customer sidebar
            - Customer top navbar
            - Customer profile
            - Mobile navigation
            - Logout
            - Outlet

            Individual customer pages should NOT contain
            another CustomerLayout.

        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["customer"]}
            />
          }
        >

          <Route
            path="/customer"
            element={<CustomerLayout />}
          >

            {/* =================================================
                CUSTOMER ROOT
            ================================================= */}

            <Route
              index
              element={
                <Navigate
                  to="/customer/dashboard"
                  replace
                />
              }
            />

            {/* =================================================
                CUSTOMER DASHBOARD
            ================================================= */}

            <Route
              path="dashboard"
              element={<CustomerDashboard />}
            />

            {/* =================================================
                BROWSE PRODUCTS
            ================================================= */}

            <Route
              path="products"
              element={<CustomerProducts />}
            />

            {/* =================================================
                MY ORDERS
            ================================================= */}

            <Route
              path="orders"
              element={<CustomerOrders />}
            />

            {/* =================================================
                MY CART
            ================================================= */}

            <Route
              path="cart"
              element={<CustomerCart />}
            />

            {/* =================================================
                INVOICES
            ================================================= */}

            <Route
              path="invoices"
              element={<CustomerInvoices />}
            />

            {/* =================================================
                MY PROFILE
            ================================================= */}

            <Route
              path="profile"
              element={<CustomerProfile />}
            />

          </Route>

        </Route>

        {/* =================================================
            LEGACY ADMIN / STAFF ROUTES
        =================================================

            These redirects keep old links/bookmarks working.

            /products     → /admin/products
            /inventory    → /admin/inventory
            /customers    → /admin/customers

            IMPORTANT:
            The redirects below are primarily for admin use.
            Staff users should use their /staff/* routes.

        ================================================= */}

        <Route
          path="/products"
          element={
            <Navigate
              to="/admin/products"
              replace
            />
          }
        />

        <Route
          path="/inventory"
          element={
            <Navigate
              to="/admin/inventory"
              replace
            />
          }
        />

        <Route
          path="/customers"
          element={
            <Navigate
              to="/admin/customers"
              replace
            />
          }
        />

        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={<HomeRedirect />}
        />

      </Routes>

      {/* =================================================
          TOAST NOTIFICATIONS
      ================================================= */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
};

export default App;