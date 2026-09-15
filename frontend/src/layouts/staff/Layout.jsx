import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  FaBoxes,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaIceCream,
  FaChartBar,
  FaHome,
  FaSignOutAlt,
  FaTimes,
  FaUsers,
  FaCashRegister,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";

import "./Layout.css";

const StaffLayout = () => {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const staffName = user?.name || "Staff";
  const staffRole = user?.role || "staff";

  const initials = useMemo(() => {
    return (
      staffName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "ST"
    );
  }, [staffName]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }, []);

  const pageInfo = useMemo(() => {
    const path = location.pathname;

    if (path === "/staff/dashboard" || path === "/staff") {
      return {
        eyebrow: "Staff Portal",
        title: "Dashboard",
      };
    }

    if (path.startsWith("/staff/billing")) {
      return {
        eyebrow: "Point of Sale",
        title: "Billing",
      };
    }

    if (path.startsWith("/staff/orders")) {
      return {
        eyebrow: "Order Management",
        title: "Orders",
      };
    }

    if (path.startsWith("/staff/customers")) {
      return {
        eyebrow: "Customer Management",
        title: "Customers",
      };
    }

    if (path.startsWith("/staff/products")) {
      return {
        eyebrow: "Product Catalogue",
        title: "Products",
      };
    }

    if (path.startsWith("/staff/reports")) {
      return {
        eyebrow: "Business Analytics",
        title: "Reports",
      };
    }

    return {
      eyebrow: "Staff Portal",
      title: "Staff",
    };
  }, [location.pathname]);

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeMobileSidebar();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Staff logout error:", error);
    }
  };

  const mainNavigation = [
    {
      label: "Dashboard",
      path: "/staff/dashboard",
      icon: FaHome,
    },
    {
      label: "Billing",
      path: "/staff/billing",
      icon: FaCashRegister,
    },
    {
      label: "Orders",
      path: "/staff/orders",
      icon: FaClipboardList,
    },
    {
      label: "Customers",
      path: "/staff/customers",
      icon: FaUsers,
    },
    {
      label: "Products",
      path: "/staff/products",
      icon: FaIceCream,
    },
  ];

  const managementNavigation = [
    {
      label: "Reports",
      path: "/staff/reports",
      icon: FaChartBar,
    },
  ];

  return (
    <div
      className={`staff-layout ${
        collapsed ? "sidebar-is-collapsed" : ""
      }`}
    >
      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}
      {mobileOpen && (
        <button
          type="button"
          className="staff-sidebar-overlay"
          aria-label="Close staff sidebar"
          onClick={closeMobileSidebar}
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      <aside
        className={`staff-sidebar ${
          mobileOpen ? "mobile-sidebar-open" : ""
        }`}
      >
        {/* BRAND */}
        <div className="staff-brand">
          <button
            type="button"
            className="staff-brand-logo"
            onClick={() => handleNavigation("/staff/dashboard")}
            aria-label="Go to staff dashboard"
          >
            <FaIceCream />
          </button>

          <div className="staff-brand-copy">
            <strong>IceCream</strong>
            <span>BILLING SYSTEM</span>
          </div>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION
            =================================================== */}
        <div className="staff-sidebar-navigation">
          {/* MAIN MENU */}
          <div className="staff-nav-group">
            <div className="staff-nav-group-title">
              Main Menu
            </div>

            <nav className="staff-nav-list">
              {mainNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/staff/dashboard"}
                    className={({ isActive }) =>
                      `staff-nav-item ${
                        isActive ? "active" : ""
                      }`
                    }
                    onClick={closeMobileSidebar}
                  >
                    <span className="staff-nav-icon">
                      <Icon />
                    </span>

                    <span className="staff-nav-label">
                      {item.label}
                    </span>

                    <span className="staff-nav-arrow">
                      <FaChevronRight />
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* MANAGEMENT */}
          <div className="staff-nav-group">
            <div className="staff-nav-group-title">
              Management
            </div>

            <nav className="staff-nav-list">
              {managementNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `staff-nav-item ${
                        isActive ? "active" : ""
                      }`
                    }
                    onClick={closeMobileSidebar}
                  >
                    <span className="staff-nav-icon">
                      <Icon />
                    </span>

                    <span className="staff-nav-label">
                      {item.label}
                    </span>

                    <span className="staff-nav-arrow">
                      <FaChevronRight />
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ===================================================
            SIDEBAR BOTTOM
            =================================================== */}
        <div className="staff-sidebar-bottom">
          {/* COLLAPSE BUTTON */}
          <button
            type="button"
            className="staff-sidebar-collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <FaChevronRight />
            ) : (
              <FaChevronLeft />
            )}
          </button>

          {/* PROFILE */}
          <div className="staff-sidebar-profile">
            <div className="staff-avatar staff-avatar-sidebar">
              {initials}
            </div>

            <div className="staff-sidebar-profile-info">
              <strong>{staffName}</strong>

              <span>
                {staffRole === "staff"
                  ? "Staff Member"
                  : staffRole}
              </span>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            className="staff-logout-button"
            onClick={handleLogout}
          >
            <FaSignOutAlt />

            <span className="staff-logout-label">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
          ===================================================== */}
      <div className="staff-main">
        {/* ===================================================
            TOPBAR
            =================================================== */}
        <header className="staff-topbar">
          {/* LEFT */}
          <div className="staff-topbar-left">
            {/* MOBILE MENU */}
            <button
              type="button"
              className="staff-mobile-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open staff sidebar"
            >
              <span />
              <span />
              <span />
            </button>

            {/* PAGE TITLE */}
            <div className="staff-page-heading">
              <span className="staff-page-eyebrow">
                {pageInfo.eyebrow}
              </span>

              <h1>{pageInfo.title}</h1>
            </div>
          </div>

          {/* RIGHT */}
          <div className="staff-topbar-right">
            {/* DATE */}
            <div className="staff-date">
              <div className="staff-date-icon">
                <FaCalendarAlt />
              </div>

              <div className="staff-date-copy">
                <strong>{formattedDate}</strong>

                <span>Today</span>
              </div>
            </div>

            <div className="staff-topbar-divider" />

            {/* PROFILE */}
            <button
              type="button"
              className="staff-topbar-profile"
              onClick={() =>
                handleNavigation("/staff/dashboard")
              }
              aria-label="Open staff dashboard"
            >
              <div className="staff-avatar staff-avatar-topbar">
                {initials}
              </div>

              <div className="staff-topbar-profile-copy">
                <strong>{staffName}</strong>

                <span>Staff Member</span>
              </div>

              <FaChevronRight className="staff-profile-arrow" />
            </button>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
            =================================================== */}
        <main className="staff-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;