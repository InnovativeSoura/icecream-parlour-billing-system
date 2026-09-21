import { Navigate, Route, Routes } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";

import CustomerLayout from "./Layout/CustomerLayout";

import Home from "./pages/Home";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProducts from "./pages/Products";
import CustomerOrders from "./pages/Orders";
import CustomerCart from "./pages/Cart";
import CustomerInvoices from "./pages/Invoices";
import CustomerProfile from "./pages/Profile";

const LoadingScreen = () => {
  return (
    <div className="app-loading">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated, isCustomer } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (!isCustomer || user.role !== "customer") {
    return <Navigate to="/" replace />;
  }

  return children;
};

const CustomerEntry = () => {
  const { user, loading, isAuthenticated, isCustomer } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Home />;
  }

  if (isCustomer && user.role === "customer") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Home />;
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<CustomerEntry />} />

        <Route path="/home" element={<Home />} />

        <Route
          element={
            <ProtectedRoute>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<CustomerDashboard />} />

          <Route path="/products" element={<CustomerProducts />} />

          <Route path="/orders" element={<CustomerOrders />} />

          <Route path="/cart" element={<CustomerCart />} />

          <Route path="/invoices" element={<CustomerInvoices />} />

          <Route path="/profile" element={<CustomerProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
