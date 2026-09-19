// frontend/src/App.jsx

import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// =========================================================
// PUBLIC HOME PAGE
// =========================================================

import Home from "./pages/Home";

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
// HOME / AUTH ROUTER
// =========================================================

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  // -------------------------------------------------------
  // AUTHENTICATION LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-content">
          <div className="app-loading-icon">🍦</div>

          <div className="app-loading-title">
            IceCream Parlour
          </div>

          <div className="app-loading-text">
            Loading your account...
          </div>

          <div className="app-loading-spinner" />
        </div>
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
  // ADMIN
  // -------------------------------------------------------

  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // -------------------------------------------------------
  // STAFF
  // -------------------------------------------------------

  if (user.role === "staff") {
    return (
      <Navigate
        to="/staff/dashboard"
        replace
      />
    );
  }

  // -------------------------------------------------------
  // CUSTOMER
  // -------------------------------------------------------
  //
  // CUSTOMER APPLICATION IS NOW SEPARATE.
  //
  // This frontend no longer contains customer routes.
  // The customer should use the separate customer-frontend
  // application.
  //
  // For safety, do not expose customer pages here.
  // -------------------------------------------------------

  if (user.role === "customer") {
    return <Home />;
  }

  // -------------------------------------------------------
  // INVALID / UNKNOWN ROLE
  // -------------------------------------------------------

  return <Home />;
};

// =========================================================
// UNKNOWN ROUTE HANDLER
// =========================================================

const UnknownRoute = () => {
  const { user, loading } = useAuth();

  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-content">
          <div className="app-loading-icon">🍦</div>

          <div className="app-loading-title">
            IceCream Parlour
          </div>

          <div className="app-loading-text">
            Loading...
          </div>

          <div className="app-loading-spinner" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // GUEST
  // -------------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // -------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------

  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // -------------------------------------------------------
  // STAFF
  // -------------------------------------------------------

  if (user.role === "staff") {
    return (
      <Navigate
        to="/staff/dashboard"
        replace
      />
    );
  }

  // -------------------------------------------------------
  // CUSTOMER
  // -------------------------------------------------------
  //
  // Customer routes do not exist in this application.
  // Customer users are handled by customer-frontend.
  // -------------------------------------------------------

  if (user.role === "customer") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // -------------------------------------------------------
  // FALLBACK
  // -------------------------------------------------------

  return (
    <Navigate
      to="/"
      replace
    />
  );
};

// =========================================================
// APP
// =========================================================

const App = () => {
  return (
    <>
      <Routes>

        {/* =================================================
            PUBLIC HOME
            ================================================= */}

        <Route
          path="/"
          element={<HomeRedirect />}
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

            {/* ---------------------------------------------
                ADMIN DASHBOARD
                --------------------------------------------- */}

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            {/* ---------------------------------------------
                PRODUCTS
                --------------------------------------------- */}

            <Route
              path="products"
              element={<Products />}
            />

            {/* ---------------------------------------------
                INVENTORY
                --------------------------------------------- */}

            <Route
              path="inventory"
              element={<Inventory />}
            />

            {/* ---------------------------------------------
                CUSTOMERS
                --------------------------------------------- */}

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

            {/* ---------------------------------------------
                STAFF DASHBOARD
                --------------------------------------------- */}

            <Route
              path="dashboard"
              element={<StaffDashboard />}
            />

            {/* ---------------------------------------------
                STAFF BILLING
                --------------------------------------------- */}

            <Route
              path="billing"
              element={<StaffBilling />}
            />

            {/* ---------------------------------------------
                STAFF ORDERS
                --------------------------------------------- */}

            <Route
              path="orders"
              element={<StaffOrders />}
            />

            {/* ---------------------------------------------
                STAFF CUSTOMERS
                --------------------------------------------- */}

            <Route
              path="customers"
              element={<StaffCustomers />}
            />

            {/* ---------------------------------------------
                STAFF REPORTS
                --------------------------------------------- */}

            <Route
              path="reports"
              element={<StaffReports />}
            />

          </Route>
        </Route>


        {/* =================================================
            UNKNOWN ROUTES
            ================================================= */}

        <Route
          path="*"
          element={<UnknownRoute />}
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