import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";

// ==================================================
// CUSTOMER LAYOUT
// ==================================================
import CustomerLayout from "./Layout/Layout";

// ==================================================
// CUSTOMER PAGES
// ==================================================
import Home from "./pages/Home";
import CustomerDashboard from "./pages/CustomerDashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Invoices from "./pages/Invoices";
import Profile from "./pages/Profile";

// ==================================================
// LOADING SCREEN
// ==================================================
const LoadingScreen = () => {
  return (
    <div className="app-loading">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

// ==================================================
// CUSTOMER PROTECTED ROUTE
// ==================================================
const ProtectedRoute = ({ children }) => {
  const {
    user,
    loading,
    isAuthenticated,
    isCustomer,
  } = useAuth();

  // Wait for authentication restoration
  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // This frontend is CUSTOMER ONLY
  if (!isCustomer || user.role !== "customer") {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ==================================================
// CUSTOMER ENTRY
// ==================================================
const CustomerEntry = () => {
  const {
    user,
    loading,
    isAuthenticated,
    isCustomer,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // ------------------------------------------------
  // Guest
  // ------------------------------------------------
  if (!isAuthenticated || !user) {
    return <Home />;
  }

  // ------------------------------------------------
  // Authenticated customer
  // ------------------------------------------------
  if (isCustomer && user.role === "customer") {
    return <Navigate to="/dashboard" replace />;
  }

  // ------------------------------------------------
  // Safety fallback
  // ------------------------------------------------
  return <Home />;
};

// ==================================================
// APP
// ==================================================
const App = () => {
  return (
    <>
      <Routes>

        {/* ==================================================
            CUSTOMER PUBLIC WEBSITE
           ================================================== */}

        <Route
          path="/"
          element={<CustomerEntry />}
        />

        <Route
          path="/home"
          element={<Home />}
        />


        {/* ==================================================
            CUSTOMER PROTECTED AREA

            CustomerLayout wraps all authenticated
            customer pages.

            Layout location:
            src/layouts/customer/CustomerLayout.jsx
           ================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >

          {/* Customer Dashboard */}
          <Route
            path="/dashboard"
            element={<CustomerDashboard />}
          />

          {/* Products */}
          <Route
            path="/products"
            element={<Products />}
          />

          {/* Orders */}
          <Route
            path="/orders"
            element={<Orders />}
          />

          {/* Cart */}
          <Route
            path="/cart"
            element={<Cart />}
          />

          {/* Invoices */}
          <Route
            path="/invoices"
            element={<Invoices />}
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>


        {/* ==================================================
            UNKNOWN ROUTES
           ================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>


      {/* ==================================================
          GLOBAL TOAST NOTIFICATIONS
         ================================================== */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
};

export default App;