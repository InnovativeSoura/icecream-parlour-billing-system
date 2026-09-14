// frontend/src/layouts/admin/Layout.jsx

import { useMemo, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  FaHome,
  FaIceCream,
  FaBoxes,
  FaUsers,
  FaClipboardList,
  FaChartBar,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCalendarAlt,
  FaChevronRight,
} from "react-icons/fa";

import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  // =====================================================
  // USER INFORMATION
  // =====================================================

  const userName =
    user?.name?.trim() ||
    user?.username?.trim() ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const userRole = user?.role || "admin";

  const formattedRole =
    userRole.charAt(0).toUpperCase() +
    userRole.slice(1);

  // =====================================================
  // USER INITIALS
  // =====================================================

  const initials = useMemo(() => {
    if (!userName) {
      return "AD";
    }

    const parts = userName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [userName]);

  // =====================================================
  // CURRENT PAGE INFORMATION
  // =====================================================

  const pageInfo = useMemo(() => {
    const path = location.pathname;

    if (path.startsWith("/admin/dashboard")) {
      return {
        label: "ADMINISTRATOR",
        title: "Dashboard",
      };
    }

    if (path.startsWith("/products")) {
      return {
        label: "CATALOGUE",
        title: "Products",
      };
    }

    if (path.startsWith("/inventory")) {
      return {
        label: "STOCK MANAGEMENT",
        title: "Inventory",
      };
    }

    if (path.startsWith("/customers")) {
      return {
        label: "CUSTOMER MANAGEMENT",
        title: "Customers",
      };
    }

    return {
      label: "ADMINISTRATOR",
      title: "Dashboard",
    };
  }, [location.pathname]);

  // =====================================================
  // CURRENT DATE
  // =====================================================

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }, []);

  // =====================================================
  // MAIN NAVIGATION
  // =====================================================

  const mainNavigation = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: FaHome,
    },
    {
      label: "Products",
      path: "/products",
      icon: FaIceCream,
    },
    {
      label: "Inventory",
      path: "/inventory",
      icon: FaBoxes,
    },
    {
      label: "Customers",
      path: "/customers",
      icon: FaUsers,
    },
  ];

  // =====================================================
  // MANAGEMENT NAVIGATION
  // =====================================================

  const managementNavigation = [
    {
      label: "Orders",
      icon: FaClipboardList,
    },
    {
      label: "Reports",
      icon: FaChartBar,
    },
  ];

  // =====================================================
  // CLOSE MOBILE SIDEBAR
  // =====================================================

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    closeMobileSidebar();

    logout();

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-layout">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {mobileSidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`admin-sidebar ${
          mobileSidebarOpen
            ? "mobile-open"
            : ""
        }`}
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="admin-sidebar-brand">

          <div className="admin-brand-mark">
            <FaIceCream />
          </div>

          <div className="admin-brand-text">
            <h2>IceCream</h2>
            <span>Billing System</span>
          </div>

          <button
            type="button"
            className="admin-mobile-close"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>

        </div>

        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="admin-sidebar-profile">

          <div className="admin-profile-avatar">
            {initials}
          </div>

          <div className="admin-profile-details">
            <strong>{userName}</strong>
            <span>{formattedRole}</span>
          </div>

          <span
            className="admin-online-dot"
            aria-label="Online"
          />

        </div>

        {/* =================================================
            MAIN MENU
        ================================================= */}

        <div className="admin-sidebar-section">

          <span className="admin-sidebar-section-title">
            MAIN MENU
          </span>

          <nav
            className="admin-navigation"
            aria-label="Main navigation"
          >

            {mainNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin/dashboard"}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `admin-nav-link ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                >

                  <span className="admin-nav-icon">
                    <Icon />
                  </span>

                  <span className="admin-nav-label">
                    {item.label}
                  </span>

                  <FaChevronRight
                    className="admin-nav-arrow"
                  />

                </NavLink>
              );
            })}

          </nav>

        </div>

        {/* =================================================
            MANAGEMENT
        ================================================= */}

        <div
          className="
            admin-sidebar-section
            admin-management-section
          "
        >

          <span className="admin-sidebar-section-title">
            MANAGEMENT
          </span>

          <nav
            className="admin-navigation"
            aria-label="Management navigation"
          >

            {managementNavigation.map(
              (item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="
                      admin-nav-link
                      admin-disabled-link
                      disabled
                    "
                    aria-disabled="true"
                  >

                    <span className="admin-nav-icon">
                      <Icon />
                    </span>

                    <span className="admin-nav-label">
                      {item.label}
                    </span>

                    <small>
                      Coming soon
                    </small>

                  </div>
                );
              }
            )}

          </nav>

        </div>

        {/* =================================================
            SIDEBAR FOOTER
        ================================================= */}

        <div className="admin-sidebar-footer">

          <div className="admin-sidebar-footer-profile">

            <div className="admin-footer-avatar">
              {initials}
            </div>

            <div>
              <strong>{userName}</strong>
              <span>{formattedRole}</span>
            </div>

          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >

            <span className="admin-logout-icon">
              <FaSignOutAlt />
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN APPLICATION AREA
      ================================================= */}

      <div className="admin-main">

        {/* =================================================
            SINGLE ADMIN TOPBAR
        ================================================= */}

        <header className="admin-topbar">

          <div className="admin-topbar-left">

            {/* Mobile menu */}

            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Open navigation"
            >
              <FaBars />
            </button>

            {/* Mobile logo */}

            <div className="admin-mobile-brand-mark">
              <FaIceCream />
            </div>

            {/* Current page */}

            <div className="admin-page-heading">

              <span>
                {pageInfo.label}
              </span>

              <h1>
                {pageInfo.title}
              </h1>

            </div>

          </div>

          {/* =================================================
              TOPBAR RIGHT
          ================================================= */}

          <div className="admin-topbar-right">

            <div className="admin-date-display">

              <span className="admin-date-icon">
                <FaCalendarAlt />
              </span>

              <span>
                {formattedDate}
              </span>

            </div>

            <div className="admin-topbar-divider" />

            <button
              type="button"
              className="admin-topbar-profile"
              onClick={() =>
                navigate("/admin/dashboard")
              }
              aria-label="Open admin dashboard"
            >

              <div className="admin-topbar-avatar">
                {initials}
              </div>

              <div className="admin-topbar-user">

                <strong>
                  {userName}
                </strong>

                <span>
                  {formattedRole}
                </span>

              </div>

            </button>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT

            IMPORTANT:
            Only the active page is rendered here.

            AdminDashboard.jsx must NOT contain:
            - sidebar
            - navbar
            - header
            - AdminLayout
        ================================================= */}

        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;