// frontend/src/layouts/AdminLayout.jsx

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
  FaPlus,
} from "react-icons/fa";

import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // =====================================================
  // USER DATA
  // =====================================================

  const userName =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const userRole = user?.role || "admin";

  const initials = useMemo(() => {
    if (!userName) return "AD";

    const parts = userName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [userName]);

  // =====================================================
  // CURRENT PAGE
  // =====================================================

  const pageInfo = useMemo(() => {
    const path = location.pathname;

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

    if (path.startsWith("/admin/dashboard")) {
      return {
        label: "ADMINISTRATOR",
        title: "Dashboard",
      };
    }

    return {
      label: "ADMINISTRATOR",
      title: "Dashboard",
    };
  }, [location.pathname]);

  // =====================================================
  // DATE
  // =====================================================

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // =====================================================
  // NAVIGATION
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

  const managementNavigation = [
    {
      label: "Orders",
      icon: FaClipboardList,
      disabled: true,
    },
    {
      label: "Reports",
      icon: FaChartBar,
      disabled: true,
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
          mobileSidebarOpen ? "mobile-open" : ""
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
            PROFILE CARD
        ================================================= */}

        <div className="admin-sidebar-profile">

          <div className="admin-profile-avatar">
            {initials}
          </div>

          <div className="admin-profile-details">
            <strong>{userName}</strong>
            <span>Administrator</span>
          </div>

          <span className="admin-online-dot" />

        </div>

        {/* =================================================
            MAIN MENU
        ================================================= */}

        <div className="admin-sidebar-section">

          <span className="admin-sidebar-section-title">
            MAIN MENU
          </span>

          <nav className="admin-navigation">

            {mainNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `admin-nav-link ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="admin-nav-icon">
                    <Icon />
                  </span>

                  <span className="admin-nav-label">
                    {item.label}
                  </span>

                  <FaChevronRight className="admin-nav-arrow" />
                </NavLink>
              );
            })}

          </nav>

        </div>

        {/* =================================================
            MANAGEMENT
        ================================================= */}

        <div className="admin-sidebar-section admin-management-section">

          <span className="admin-sidebar-section-title">
            MANAGEMENT
          </span>

          <nav className="admin-navigation">

            {managementNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`admin-nav-link admin-disabled-link ${
                    item.disabled ? "disabled" : ""
                  }`}
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
            })}

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
              <span>Administrator</span>
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

            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div className="admin-main">

        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="admin-topbar">

          <div className="admin-topbar-left">

            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <FaBars />
            </button>

            <div className="admin-mobile-brand-mark">
              <FaIceCream />
            </div>

            <div className="admin-page-heading">

              <span>
                {pageInfo.label}
              </span>

              <h1>
                {pageInfo.title}
              </h1>

            </div>

          </div>

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
              onClick={() => navigate("/admin/dashboard")}
            >

              <div className="admin-topbar-avatar">
                {initials}
              </div>

              <div className="admin-topbar-user">

                <strong>
                  {userName}
                </strong>

                <span>
                  {userRole}
                </span>

              </div>

            </button>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="admin-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
};

export default AdminLayout;