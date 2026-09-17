import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";

// Customer pages
import Home from "./pages/Home";
import CustomerDashboard from "./pages/CustomerDashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Invoices from "./pages/Invoices";
import Profile from "./pages/Profile";

// --------------------------------------------------
// Loading Screen
// --------------------------------------------------
const LoadingScreen = () => {
  return (
    <div className="app-loading">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

// --------------------------------------------------
// Customer Protected Route
// --------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated, isCustomer } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Customer frontend accepts customers only
  if (!isCustomer || user.role !== "customer") {
    return <Navigate to="/" replace />;
  }

  return children;
};

// --------------------------------------------------
// Authenticated Customer Redirect
// --------------------------------------------------
const CustomerEntry = () => {
  const { user, loading, isAuthenticated, isCustomer } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in → customer homepage
  if (!isAuthenticated || !user) {
    return <Home />;
  }

  // Logged-in customer → dashboard
  if (isCustomer && user.role === "customer") {
    return <Navigate to="/dashboard" replace />;
  }

  // Safety fallback
  return <Home />;
};

// --------------------------------------------------
// App
// --------------------------------------------------
const App = () => {
  return (
    <>
      <Routes>
        {/* ==========================================
            CUSTOMER PUBLIC WEBSITE
           ========================================== */}

        <Route path="/" element={<CustomerEntry />} />

        {/* Optional direct access to homepage */}
        <Route path="/home" element={<Home />} />

        {/* ==========================================
            CUSTOMER PROTECTED ROUTES
           ========================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <Invoices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ==========================================
            UNKNOWN ROUTES
           ========================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ==========================================
          GLOBAL TOAST NOTIFICATIONS
         ========================================== */}

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