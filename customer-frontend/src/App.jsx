import { Navigate, Route, Routes } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";

// ==================================================
// CUSTOMER LAYOUT
// ==================================================

import CustomerLayout from "./Layout/CustomerLayout";

// ==================================================
// CUSTOMER PAGES
// ==================================================

import Home from "./pages/Home";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProducts from "./pages/Products";
import CustomerOrders from "./pages/Orders";
import CustomerCart from "./pages/Cart";
import CustomerInvoices from "./pages/Invoices";
import CustomerProfile from "./pages/Profile";

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
// PROTECTED CUSTOMER ROUTE
// ==================================================

const ProtectedRoute = ({ children }) => {
  const {
    user,
    loading,
    isAuthenticated,
    isCustomer,
  } = useAuth();

  // Authentication/session is still being restored
  if (loading) {
    return <LoadingScreen />;
  }

  // No authenticated user
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Only customer accounts can access this frontend
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

  // ==================================================
  // GUEST
  // ==================================================

  if (!isAuthenticated || !user) {
    return <Home />;
  }

  // ==================================================
  // CUSTOMER
  // ==================================================

  if (isCustomer && user.role === "customer") {
    return <Navigate to="/dashboard" replace />;
  }

  // ==================================================
  // FALLBACK
  // ==================================================

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
            PUBLIC CUSTOMER WEBSITE
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
            PROTECTED CUSTOMER AREA

            CustomerLayout contains:
            - Sidebar
            - Topbar
            - Customer profile
            - Navigation
            - Logout
            - Outlet
        ================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <Route
            path="/dashboard"
            element={<CustomerDashboard />}
          />

          {/* ==================================================
              PRODUCTS
          ================================================== */}

          <Route
            path="/products"
            element={<CustomerProducts />}
          />

          {/* ==================================================
              ORDERS
          ================================================== */}

          <Route
            path="/orders"
            element={<CustomerOrders />}
          />

          {/* ==================================================
              CART
          ================================================== */}

          <Route
            path="/cart"
            element={<CustomerCart />}
          />

          {/* ==================================================
              INVOICES
          ================================================== */}

          <Route
            path="/invoices"
            element={<CustomerInvoices />}
          />

          {/* ==================================================
              PROFILE
          ================================================== */}

          <Route
            path="/profile"
            element={<CustomerProfile />}
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
          GLOBAL TOAST
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