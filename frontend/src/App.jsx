// frontend/src/App.jsx

import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// =========================================================
// AUTH / PUBLIC PAGES
// =========================================================

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// =========================================================
// ADMIN
// =========================================================

import AdminLayout from "./layouts/admin/Layout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Customers from "./pages/Customers.jsx";

// =========================================================
// STAFF
// =========================================================

import StaffLayout from "./layouts/staff/Layout.jsx";

import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import StaffBilling from "./pages/staff/StaffBilling.jsx";
import StaffOrders from "./pages/staff/StaffOrders.jsx";
import StaffCustomers from "./pages/staff/StaffCustomers.jsx";
import StaffReports from "./pages/staff/StaffReports.jsx";

// =========================================================
// CUSTOMER
// =========================================================

import CustomerLayout from "./layouts/costomer/CustomerLayout.jsx";

import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import CustomerProducts from "./pages/CustomerProducts";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerCart from "./pages/customer/MyCart";
import CustomerInvoices from "./pages/customer/Invoices";
import CustomerProfile from "./pages/customer/Profile";

// =========================================================
// AUTHENTICATED USER REDIRECT
// =========================================================

const AuthenticatedRedirect = () => {
  const { user, loading } = useAuth();

  // -------------------------------------------------------
  // AUTH LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
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

  // -------------------------------------------------------
  // NOT AUTHENTICATED
  // -------------------------------------------------------

  if (!user) {
    return <Home />;
  }

  // -------------------------------------------------------
  // ROLE BASED REDIRECT
  // -------------------------------------------------------

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "staff") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  if (user.role === "customer") {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // -------------------------------------------------------
  // FALLBACK
  // -------------------------------------------------------

  return <Home />;
};

// =========================================================
// APP
// =========================================================

const App = () => {
  return (
    <>
      <Routes>

        {/* =================================================
            PUBLIC HOME PAGE
            ================================================= */}

        <Route
          path="/"
          element={<AuthenticatedRedirect />}
        />

        {/* =================================================
            AUTHENTICATION
            ================================================= */}

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
          <Route
            path="/admin"
            element={<AdminLayout />}
          >
            {/* /admin */}

            <Route
              index
              element={
                <Navigate
                  to="/admin/dashboard"
                  replace
                />
              }
            />

            {/* Dashboard */}

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            {/* Products */}

            <Route
              path="products"
              element={<Products />}
            />

            {/* Inventory */}

            <Route
              path="inventory"
              element={<Inventory />}
            />

            {/* Customers */}

            <Route
              path="customers"
              element={<Customers />}
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
            element={<StaffLayout />}
          >
            {/* /staff */}

            <Route
              index
              element={
                <Navigate
                  to="/staff/dashboard"
                  replace
                />
              }
            />

            {/* Staff Dashboard */}

            <Route
              path="dashboard"
              element={<StaffDashboard />}
            />

            {/* Staff Billing */}

            <Route
              path="billing"
              element={<StaffBilling />}
            />

            {/* Staff Orders */}

            <Route
              path="orders"
              element={<StaffOrders />}
            />

            {/* Staff Customers */}

            <Route
              path="customers"
              element={<StaffCustomers />}
            />

            {/* Staff Reports */}

            <Route
              path="reports"
              element={<StaffReports />}
            />
          </Route>
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
            {/* /customer */}

            <Route
              index
              element={
                <Navigate
                  to="/customer/dashboard"
                  replace
                />
              }
            />

            {/* Dashboard */}

            <Route
              path="dashboard"
              element={<CustomerDashboard />}
            />

            {/* Products */}

            <Route
              path="products"
              element={<CustomerProducts />}
            />

            {/* Orders */}

            <Route
              path="orders"
              element={<CustomerOrders />}
            />

            {/* Cart */}

            <Route
              path="cart"
              element={<CustomerCart />}
            />

            {/* Invoices */}

            <Route
              path="invoices"
              element={<CustomerInvoices />}
            />

            {/* Profile */}

            <Route
              path="profile"
              element={<CustomerProfile />}
            />
          </Route>
        </Route>

        {/* =================================================
            UNKNOWN ROUTES
            ================================================= */}

        <Route
          path="*"
          element={<AuthenticatedRedirect />}
        />

      </Routes>

      {/* ===================================================
          GLOBAL TOAST CONTAINER
          =================================================== */}

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