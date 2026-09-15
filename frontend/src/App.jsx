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
// LAYOUTS
// =====================================================

import CustomerLayout from "./layouts/costomer/CustomerLayout.jsx";
import AdminLayout from "./layouts/admin/Layout.jsx";

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
import Orders from "./pages/admin/Orders.jsx";
import Reports from "./pages/admin/Reports.jsx";

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
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            />
          }
        >

          {/* =================================================
              ADMIN LAYOUT

              EVERYTHING INSIDE THIS ROUTE AUTOMATICALLY
              GETS:
              - ADMIN SIDEBAR
              - ADMIN TOPBAR
              - ADMIN CONTENT AREA
          ================================================= */}

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

            {/* =================================================
                ADMIN Orders
            ================================================= */}

            <Route
              path="orders"
              element={<Orders />}
            />

            {/* =================================================
                ADMIN Orders
            ================================================= */}
            
            <Route
              path="reports"
              element={<Reports />}
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

        </Route>

        {/* =================================================
            CUSTOMER ROUTES
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
                CUSTOMER PRODUCTS
            ================================================= */}

            <Route
              path="products"
              element={<CustomerProducts />}
            />

            {/* =================================================
                CUSTOMER ORDERS
            ================================================= */}

            <Route
              path="orders"
              element={<CustomerOrders />}
            />

            {/* =================================================
                CUSTOMER CART
            ================================================= */}

            <Route
              path="cart"
              element={<CustomerCart />}
            />

            {/* =================================================
                CUSTOMER INVOICES
            ================================================= */}

            <Route
              path="invoices"
              element={<CustomerInvoices />}
            />

            {/* =================================================
                CUSTOMER PROFILE
            ================================================= */}

            <Route
              path="profile"
              element={<CustomerProfile />}
            />

          </Route>

        </Route>

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