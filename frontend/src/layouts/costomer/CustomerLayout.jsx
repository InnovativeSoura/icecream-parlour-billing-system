// frontend/src/layouts/costomer/CustomerLayout.jsx

import { useMemo, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaHome,
  FaIceCream,
  FaShoppingBag,
  FaShoppingCart,
  FaFileInvoice,
  FaUser,
  FaSignOutAlt,
  FaCalendarAlt,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";

import "./CustomerLayout.css";

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (name = "Customer") => {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "CU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const formatToday = () => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
};

/* =========================================================
   NAVIGATION
========================================================= */

const MAIN_NAVIGATION = [
  {
    label: "Dashboard",
    path: "/customer/dashboard",
    icon: FaHome,
  },
  {
    label: "Products",
    path: "/customer/products",
    icon: FaIceCream,
  },
  {
    label: "Orders",
    path: "/customer/orders",
    icon: FaShoppingBag,
  },
  {
    label: "Cart",
    path: "/customer/cart",
    icon: FaShoppingCart,
  },
  {
    label: "Invoices",
    path: "/customer/invoices",
    icon: FaFileInvoice,
  },
];

const ACCOUNT_NAVIGATION = [
  {
    label: "Profile",
    path: "/customer/profile",
    icon: FaUser,
  },
];

/* =========================================================
   CUSTOMER LAYOUT
========================================================= */

const CustomerLayout = () => {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const customerName = user?.name || "Customer";
  const initials = getInitials(customerName);

  const currentPage = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.includes("/products")) {
      return {
        eyebrow: "CUSTOMER",
        title: "Products",
      };
    }

    if (pathname.includes("/orders")) {
      return {
        eyebrow: "CUSTOMER",
        title: "My Orders",
      };
    }

    if (pathname.includes("/cart")) {
      return {
        eyebrow: "CUSTOMER",
        title: "Shopping Cart",
      };
    }

    if (pathname.includes("/invoices")) {
      return {
        eyebrow: "CUSTOMER",
        title: "Invoices",
      };
    }

    if (pathname.includes("/profile")) {
      return {
        eyebrow: "ACCOUNT",
        title: "My Profile",
      };
    }

    return {
      eyebrow: "CUSTOMER",
      title: "Dashboard",
    };
  }, [location.pathname]);

  /* =======================================================
     SIDEBAR TOGGLE
  ======================================================= */

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const openMobileSidebar = () => {
    setMobileSidebarOpen(true);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    closeMobileSidebar();

    try {
      if (typeof logout === "function") {
        await logout();
      }
    } catch (error) {
      console.error("Customer logout error:", error);
    }

    navigate("/login", { replace: true });
  };

  /* =======================================================
     NAVIGATION CLICK
  ======================================================= */

  const handleNavigation = () => {
    closeMobileSidebar();
  };

  return (
    <div
      className={`customer-layout ${
        sidebarCollapsed
          ? "customer-sidebar-is-collapsed"
          : ""
      }`}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`customer-sidebar ${
          mobileSidebarOpen
            ? "customer-mobile-sidebar-open"
            : ""
        }`}
      >
        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="customer-brand">
          <button
            type="button"
            className="customer-brand-logo"
            onClick={() =>
              navigate("/customer/dashboard")
            }
            aria-label="Go to customer dashboard"
          >
            <FaIceCream />
          </button>

          <div className="customer-brand-copy">
            <strong>IceCream</strong>

            <span>BILLING SYSTEM</span>
          </div>

          <button
            type="button"
            className="customer-mobile-close"
            onClick={closeMobileSidebar}
            aria-label="Close customer menu"
          >
            <FaTimes />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav className="customer-sidebar-navigation">
          {/* MAIN MENU */}

          <div className="customer-nav-group">
            <div className="customer-nav-group-title">
              Main Menu
            </div>

            <div className="customer-nav-list">
              {MAIN_NAVIGATION.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/customer/dashboard"}
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      `customer-nav-item ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                  >
                    <span className="customer-nav-icon">
                      <Icon />
                    </span>

                    <span className="customer-nav-label">
                      {item.label}
                    </span>

                    <span className="customer-nav-arrow">
                      <FaChevronRight />
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* ACCOUNT */}

          <div className="customer-nav-group">
            <div className="customer-nav-group-title">
              Account
            </div>

            <div className="customer-nav-list">
              {ACCOUNT_NAVIGATION.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      `customer-nav-item ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                  >
                    <span className="customer-nav-icon">
                      <Icon />
                    </span>

                    <span className="customer-nav-label">
                      {item.label}
                    </span>

                    <span className="customer-nav-arrow">
                      <FaChevronRight />
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ===================================================
            SIDEBAR BOTTOM
        =================================================== */}

        <div className="customer-sidebar-bottom">
          <div className="customer-sidebar-profile">
            <div className="customer-avatar customer-avatar-sidebar">
              {initials}
            </div>

            <div className="customer-sidebar-profile-info">
              <strong>{customerName}</strong>

              <span>Customer</span>
            </div>
          </div>

          <button
            type="button"
            className="customer-logout-button"
            onClick={handleLogout}
          >
            <FaSignOutAlt />

            <span className="customer-logout-label">
              Logout
            </span>
          </button>
        </div>

        {/* ===================================================
            COLLAPSE BUTTON
        =================================================== */}

        <button
          type="button"
          className="customer-sidebar-collapse"
          onClick={toggleSidebar}
          aria-label={
            sidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            sidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {sidebarCollapsed ? (
            <FaChevronRight />
          ) : (
            <FaChevronLeft />
          )}
        </button>
      </aside>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileSidebarOpen && (
        <button
          type="button"
          className="customer-sidebar-overlay"
          onClick={closeMobileSidebar}
          aria-label="Close customer sidebar"
        />
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="customer-main">
        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="customer-topbar">
          <div className="customer-topbar-left">
            <button
              type="button"
              className="customer-mobile-menu-button"
              onClick={openMobileSidebar}
              aria-label="Open customer menu"
            >
              <FaBars />
            </button>

            <div className="customer-page-heading">
              <span className="customer-page-eyebrow">
                {currentPage.eyebrow}
              </span>

              <h1>{currentPage.title}</h1>
            </div>
          </div>

          <div className="customer-topbar-right">
            {/* DATE */}

            <div className="customer-date">
              <div className="customer-date-icon">
                <FaCalendarAlt />
              </div>

              <div className="customer-date-copy">
                <strong>{formatToday()}</strong>

                <span>Today</span>
              </div>
            </div>

            <div className="customer-topbar-divider" />

            {/* PROFILE */}

            <button
              type="button"
              className="customer-topbar-profile"
              onClick={() =>
                navigate("/customer/profile")
              }
            >
              <div className="customer-avatar customer-avatar-topbar">
                {initials}
              </div>

              <div className="customer-topbar-profile-copy">
                <strong>{customerName}</strong>

                <span>Customer</span>
              </div>

              <FaChevronRight className="customer-profile-arrow" />
            </button>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="customer-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;