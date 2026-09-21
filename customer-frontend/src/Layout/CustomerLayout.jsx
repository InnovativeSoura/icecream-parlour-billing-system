import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

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

import { useAuth } from "../context/AuthContext";

import "./CustomerLayout.css";



const getInitials = (name = "Customer") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
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



const MAIN_NAVIGATION = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: FaHome,
  },
  {
    label: "Products",
    path: "/products",
    icon: FaIceCream,
  },
  {
    label: "Orders",
    path: "/orders",
    icon: FaShoppingBag,
  },
  {
    label: "Cart",
    path: "/cart",
    icon: FaShoppingCart,
  },
  {
    label: "Invoices",
    path: "/invoices",
    icon: FaFileInvoice,
  },
];

const ACCOUNT_NAVIGATION = [
  {
    label: "Profile",
    path: "/profile",
    icon: FaUser,
  },
];

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

    if (pathname === "/products" || pathname.startsWith("/products/")) {
      return {
        eyebrow: "CUSTOMER",
        title: "Products",
      };
    }

    if (pathname === "/orders" || pathname.startsWith("/orders/")) {
      return {
        eyebrow: "CUSTOMER",
        title: "My Orders",
      };
    }

    if (pathname === "/cart" || pathname.startsWith("/cart/")) {
      return {
        eyebrow: "CUSTOMER",
        title: "Shopping Cart",
      };
    }

    if (pathname === "/invoices" || pathname.startsWith("/invoices/")) {
      return {
        eyebrow: "CUSTOMER",
        title: "Invoices",
      };
    }

    if (pathname === "/profile" || pathname.startsWith("/profile/")) {
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

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
  };

  const openMobileSidebar = () => {
    setMobileSidebarOpen(true);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    closeMobileSidebar();

    try {
      if (typeof logout === "function") {
        await logout();
      }
    } catch (error) {
      console.error("Customer logout error:", error);
    }

    navigate("/", { replace: true });
  };

  const handleNavigation = () => {
    closeMobileSidebar();
  };

  return (
    <div
      className={`customer-layout ${
        sidebarCollapsed ? "customer-sidebar-is-collapsed" : ""
      }`}
    >
      <aside
        className={`customer-sidebar ${
          mobileSidebarOpen ? "customer-mobile-sidebar-open" : ""
        }`}
      >
        <div className="customer-brand">
          <button
            type="button"
            className="customer-brand-logo"
            onClick={() => navigate("/dashboard")}
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

        <nav className="customer-sidebar-navigation">
          <div className="customer-nav-group">
            <div className="customer-nav-group-title">Main Menu</div>

            <div className="customer-nav-list">
              {MAIN_NAVIGATION.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      `customer-nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <span className="customer-nav-icon">
                      <Icon />
                    </span>

                    <span className="customer-nav-label">{item.label}</span>

                    <span className="customer-nav-arrow">
                      <FaChevronRight />
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="customer-nav-group">
            <div className="customer-nav-group-title">Account</div>

            <div className="customer-nav-list">
              {ACCOUNT_NAVIGATION.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      `customer-nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <span className="customer-nav-icon">
                      <Icon />
                    </span>

                    <span className="customer-nav-label">{item.label}</span>

                    <span className="customer-nav-arrow">
                      <FaChevronRight />
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

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

            <span className="customer-logout-label">Logout</span>
          </button>
        </div>

        <button
          type="button"
          className="customer-sidebar-collapse"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </aside>

      {mobileSidebarOpen && (
        <button
          type="button"
          className="customer-sidebar-overlay"
          onClick={closeMobileSidebar}
          aria-label="Close customer sidebar"
        />
      )}

      <div className="customer-main">
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

            <button
              type="button"
              className="customer-topbar-profile"
              onClick={() => navigate("/profile")}
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

        <main className="customer-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
