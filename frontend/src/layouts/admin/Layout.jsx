import { useMemo, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaBoxes,
  FaCalendarAlt,
  FaChevronRight,
  FaClipboardList,
  FaChartBar,
  FaChevronLeft,
  FaHome,
  FaIceCream,
  FaSignOutAlt,
  FaTimes,
  FaUsers,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import "./Layout.css";

const navigationGroups = [
  {
    title: "Main Menu",
    items: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: FaHome,
      },
      {
        label: "Products",
        path: "/admin/products",
        icon: FaIceCream,
      },
      {
        label: "Inventory",
        path: "/admin/inventory",
        icon: FaBoxes,
      },
      {
        label: "Customers",
        path: "/admin/customers",
        icon: FaUsers,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Orders",
        path: "/admin/orders",
        icon: FaClipboardList,
        disabled: true,
      },
      {
        label: "Reports",
        path: "/admin/reports",
        icon: FaChartBar,
        disabled: true,
      },
    ],
  },
];

const getInitials = (name = "Admin") => {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "AD";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const formatDate = () => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const userName = user?.name || "Admin";
  const userRole = user?.role || "admin";

  const initials = useMemo(
    () => getInitials(userName),
    [userName]
  );

  const pageInfo = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.startsWith("/admin/products")) {
      return {
        eyebrow: "CATALOG",
        title: "Products",
      };
    }

    if (pathname.startsWith("/admin/inventory")) {
      return {
        eyebrow: "STOCK CONTROL",
        title: "Inventory",
      };
    }

    if (pathname.startsWith("/admin/customers")) {
      return {
        eyebrow: "CUSTOMER MANAGEMENT",
        title: "Customers",
      };
    }

    if (pathname.startsWith("/admin/orders")) {
      return {
        eyebrow: "MANAGEMENT",
        title: "Orders",
      };
    }

    if (pathname.startsWith("/admin/reports")) {
      return {
        eyebrow: "ANALYTICS",
        title: "Reports",
      };
    }

    return {
      eyebrow: "ADMINISTRATIVE",
      title: "Dashboard",
    };
  }, [location.pathname]);

  const handleLogout = () => {
    setMobileSidebarOpen(false);
    logout();
  };

  const handleNavigation = (path, disabled = false) => {
    if (disabled) return;

    navigate(path);
    setMobileSidebarOpen(false);
  };

  return (
    <div
      className={`admin-layout ${
        sidebarCollapsed ? "sidebar-is-collapsed" : ""
      }`}
    >
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`admin-sidebar ${
          mobileSidebarOpen ? "mobile-sidebar-open" : ""
        }`}
      >
        {/* Brand */}
        <div className="admin-brand">
          <div
            className="admin-brand-logo"
            onClick={() => handleNavigation("/admin/dashboard")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleNavigation("/admin/dashboard");
              }
            }}
          >
            <FaIceCream />
          </div>

          {!sidebarCollapsed && (
            <div className="admin-brand-copy">
              <strong>IceCream</strong>
              <span>BILLING SYSTEM</span>
            </div>
          )}

          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="admin-sidebar-navigation">
          {navigationGroups.map((group) => (
            <div className="admin-nav-group" key={group.title}>
              {!sidebarCollapsed && (
                <div className="admin-nav-group-title">
                  {group.title}
                </div>
              )}

              <div className="admin-nav-list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (!item.disabled &&
                      location.pathname.startsWith(`${item.path}/`));

                  if (item.disabled) {
                    return (
                      <button
                        type="button"
                        key={item.label}
                        className="admin-nav-item admin-nav-item-disabled"
                        title={
                          sidebarCollapsed
                            ? `${item.label} — Coming soon`
                            : undefined
                        }
                        onClick={() => {}}
                      >
                        <span className="admin-nav-icon">
                          <Icon />
                        </span>

                        {!sidebarCollapsed && (
                          <>
                            <span className="admin-nav-label">
                              {item.label}
                            </span>

                            <span className="admin-nav-coming-soon">
                              Soon
                            </span>
                          </>
                        )}
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      to={item.path}
                      key={item.label}
                      className={`admin-nav-item ${
                        isActive ? "active" : ""
                      }`}
                      title={
                        sidebarCollapsed
                          ? item.label
                          : undefined
                      }
                      onClick={() =>
                        setMobileSidebarOpen(false)
                      }
                    >
                      <span className="admin-nav-icon">
                        <Icon />
                      </span>

                      {!sidebarCollapsed && (
                        <span className="admin-nav-label">
                          {item.label}
                        </span>
                      )}

                      {!sidebarCollapsed && isActive && (
                        <span className="admin-nav-arrow">
                          <FaChevronRight />
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Bottom */}
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-profile">
            <div className="admin-avatar admin-avatar-sidebar">
              {initials}
            </div>

            {!sidebarCollapsed && (
              <div className="admin-sidebar-profile-info">
                <strong>{userName}</strong>
                <span>
                  {userRole === "admin"
                    ? "Administrator"
                    : userRole}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
            title={
              sidebarCollapsed
                ? "Logout"
                : undefined
            }
          >
            <FaSignOutAlt />

            {!sidebarCollapsed && (
              <span>Logout</span>
            )}
          </button>

          <button
            type="button"
            className="admin-sidebar-collapse"
            onClick={() =>
              setSidebarCollapsed((value) => !value)
            }
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
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="admin-main">
        {/* ================= TOP NAVBAR ================= */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-menu-button"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Open sidebar"
            >
              <span />
              <span />
              <span />
            </button>

            <div className="admin-page-heading">
              <span className="admin-page-eyebrow">
                {pageInfo.eyebrow}
              </span>

              <h1>{pageInfo.title}</h1>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* Date */}
            <div className="admin-date">
              <div className="admin-date-icon">
                <FaCalendarAlt />
              </div>

              <div className="admin-date-copy">
                <strong>{formatDate()}</strong>
                <span>Today</span>
              </div>
            </div>

            {/* Divider */}
            <div className="admin-topbar-divider" />

            {/* Profile */}
            <button
              type="button"
              className="admin-topbar-profile"
              onClick={() =>
                navigate("/admin/dashboard")
              }
            >
              <div className="admin-avatar admin-avatar-topbar">
                {initials}
              </div>

              <div className="admin-topbar-profile-copy">
                <strong>{userName}</strong>
                <span>
                  {userRole === "admin"
                    ? "Administrator"
                    : userRole}
                </span>
              </div>

              <FaChevronRight className="admin-profile-arrow" />
            </button>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;