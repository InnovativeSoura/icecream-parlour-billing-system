import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";

import AdminLayout from "./layouts/admin/Layout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Customers from "./pages/Customers.jsx";

import StaffLayout from "./layouts/staff/Layout.jsx";

import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import StaffBilling from "./pages/staff/StaffBilling.jsx";
import StaffOrders from "./pages/staff/StaffOrders.jsx";
import StaffCustomers from "./pages/staff/StaffCustomers.jsx";
import StaffReports from "./pages/staff/StaffReports.jsx";

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-content">
          <div className="app-loading-icon">🍦</div>

          <div className="app-loading-title">IceCream Parlour</div>

          <div className="app-loading-text">Loading your account...</div>

          <div className="app-loading-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Home />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "staff") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  if (user.role === "customer") {
    return <Home />;
  }

  return <Home />;
};

const UnknownRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-content">
          <div className="app-loading-icon">🍦</div>

          <div className="app-loading-title">IceCream Parlour</div>

          <div className="app-loading-text">Loading...</div>

          <div className="app-loading-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "staff") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  if (user.role === "customer") {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/" replace />;
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="products" element={<Products />} />

            <Route path="inventory" element={<Inventory />} />

            <Route path="customers" element={<Customers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="/staff/dashboard" replace />} />

            <Route path="dashboard" element={<StaffDashboard />} />

            <Route path="billing" element={<StaffBilling />} />

            <Route path="orders" element={<StaffOrders />} />

            <Route path="customers" element={<StaffCustomers />} />

            <Route path="reports" element={<StaffReports />} />
          </Route>
        </Route>

        <Route path="*" element={<UnknownRoute />} />
      </Routes>

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
