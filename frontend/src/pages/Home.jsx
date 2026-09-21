import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  FaArrowRight,
  FaCheckCircle,
  FaIceCream,
  FaLock,
  FaReceipt,
  FaShieldAlt,
  FaShoppingCart,
  FaStore,
  FaUser,
  FaUserTie,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

import "./Home.css";

const CUSTOMER_PORTAL_URL =
  "https://icecream-parlour-customer-billing-system.onrender.com";

const Home = () => {
  const navigate = useNavigate();

  const {
    user,
    loading,
    login,
    register,
    logout,
  } = useAuth();

  const [authMode, setAuthMode] = useState("login");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);

  /*
   * ---------------------------------------------------------
   * CUSTOMER SESSION CLEANUP
   * ---------------------------------------------------------
   *
   * This frontend belongs to ADMIN + STAFF.
   *
   * If a customer accidentally has a session stored here,
   * remove that session and return to the normal Home page.
   */
  useEffect(() => {
    if (loading) return;

    if (user?.role === "customer") {
      const removeCustomerSession = async () => {
        try {
          await logout();
        } catch (error) {
          console.error(
            "Failed to clear customer session:",
            error
          );

          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      };

      removeCustomerSession();
    }
  }, [user, loading, logout]);

  /*
   * ---------------------------------------------------------
   * ROLE REDIRECTION
   * ---------------------------------------------------------
   */
  const redirectByRole = (authenticatedUser) => {
    if (!authenticatedUser?.role) {
      navigate("/", { replace: true });
      return;
    }

    switch (authenticatedUser.role) {
      case "admin":
        navigate("/admin/dashboard", {
          replace: true,
        });
        break;

      case "staff":
        navigate("/staff/dashboard", {
          replace: true,
        });
        break;

      case "customer":
        /*
         * Customer accounts belong to the separate
         * customer frontend.
         */
        toast.info(
          "Customer accounts use the customer portal."
        );

        window.location.href = CUSTOMER_PORTAL_URL;
        break;

      default:
        navigate("/", {
          replace: true,
        });
        break;
    }
  };

  /*
   * ---------------------------------------------------------
   * LOGIN FORM
   * ---------------------------------------------------------
   */
  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * ---------------------------------------------------------
   * REGISTER FORM
   * ---------------------------------------------------------
   */
  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * ---------------------------------------------------------
   * LOGIN
   * ---------------------------------------------------------
   */
  const handleLogin = async (event) => {
    event.preventDefault();

    const email = loginForm.email.trim();
    const password = loginForm.password;

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    try {
      setSubmitting(true);

      const loggedInUser = await login(
        email,
        password
      );

      /*
       * CUSTOMER
       * -----------------------------------------------------
       * The AuthContext may already have stored the user.
       * Therefore we MUST immediately remove the customer
       * session before returning to this page.
       */
      if (loggedInUser?.role === "customer") {
        try {
          await logout();
        } catch (logoutError) {
          console.error(
            "Customer logout failed:",
            logoutError
          );

          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }

        toast.info(
          "Customer accounts must use the customer portal."
        );

        return;
      }

      /*
       * Unknown role
       */
      if (
        loggedInUser?.role !== "admin" &&
        loggedInUser?.role !== "staff"
      ) {
        try {
          await logout();
        } catch (logoutError) {
          console.error(
            "Logout failed:",
            logoutError
          );

          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }

        toast.error(
          "This account is not authorized for this portal."
        );

        return;
      }

      toast.success("Welcome back!");

      redirectByRole(loggedInUser);
    } catch (error) {
      console.error("Login failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to sign in. Please try again.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * STAFF REGISTRATION
   * ---------------------------------------------------------
   */
  const handleRegister = async (event) => {
    event.preventDefault();

    const name = registerForm.name.trim();
    const email = registerForm.email.trim();
    const phone = registerForm.phone.trim();
    const password = registerForm.password;
    const confirmPassword =
      registerForm.confirmPassword;

    if (!name) {
      toast.error("Please enter your name.");
      return;
    }

    if (name.length < 2) {
      toast.error(
        "Name must contain at least 2 characters."
      );
      return;
    }

    if (!email) {
      toast.error(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      toast.error("Please create a password.");
      return;
    }

    if (password.length < 6) {
      toast.error(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      const registeredUser = await register({
        name,
        email,
        phone,
        password,
        role: "staff",
      });

      toast.success(
        "Staff account created successfully!"
      );

      redirectByRole(registeredUser);
    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to create your account.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * SWITCH LOGIN / REGISTER
   * ---------------------------------------------------------
   */
  const switchAuthMode = (mode) => {
    if (submitting) return;

    setAuthMode(mode);

    setLoginForm({
      email: "",
      password: "",
    });

    setRegisterForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-content">
          <div className="app-loading-icon">
            <FaIceCream />
          </div>

          <div className="app-loading-title">
            IceCream Parlour
          </div>

          <div className="app-loading-text">
            Preparing your workspace...
          </div>

          <div className="app-loading-spinner" />
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * IMPORTANT
   * ---------------------------------------------------------
   *
   * Customer users are NOT allowed to see the authenticated
   * admin/staff card.
   *
   * If the customer session is being cleared by useEffect,
   * we simply render the normal Home page.
   *
   * Only admin/staff get the "Welcome back" card.
   */
  if (
    user &&
    user.role !== "customer" &&
    (user.role === "admin" ||
      user.role === "staff")
  ) {
    return (
      <div className="home-authenticated">
        <div className="home-authenticated-card">
          <div className="home-brand-icon">
            <FaIceCream />
          </div>

          <h2>
            Welcome back, {user.name}
          </h2>

          <p>
            Your IceCream Parlour account is already
            signed in.
          </p>

          <button
            type="button"
            className="home-primary-button"
            onClick={() =>
              redirectByRole(user)
            }
          >
            Open Dashboard
            <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN HOME PAGE
   * ---------------------------------------------------------
   */
  return (
    <main className="home-page">
      <div className="home-background">
        <div className="home-orb home-orb-one" />
        <div className="home-orb home-orb-two" />
        <div className="home-orb home-orb-three" />
      </div>

      {/* =====================================================
          NAVBAR
          ===================================================== */}
      <header className="home-navbar">
        <div className="home-logo">
          <div className="home-logo-icon">
            <FaIceCream />
          </div>

          <div className="home-logo-text">
            <strong>IceCream</strong>
            <span>BILLING SYSTEM</span>
          </div>
        </div>

        <div className="home-nav-actions">
          <button
            type="button"
            className={
              authMode === "login"
                ? "home-nav-button active"
                : "home-nav-button"
            }
            onClick={() =>
              switchAuthMode("login")
            }
          >
            Login
          </button>

          <button
            type="button"
            className="home-nav-button primary"
            onClick={() =>
              switchAuthMode("register")
            }
          >
            Register
          </button>
        </div>
      </header>

      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="home-hero">
        {/* ===================================================
            LEFT CONTENT
            =================================================== */}
        <div className="home-hero-content">
          <div className="home-eyebrow">
            <span className="home-eyebrow-dot" />
            ICE CREAM PARLOUR MANAGEMENT
          </div>

          <h1>
            Sweet moments.
            <br />
            <span>Smarter management.</span>
          </h1>

          <p className="home-hero-description">
            A modern billing and ordering platform
            designed to make ice cream parlour
            operations faster, simpler, and more
            delightful.
          </p>

          <div className="home-feature-list">
            <div className="home-feature-item">
              <div className="home-feature-icon">
                <FaReceipt />
              </div>

              <div>
                <strong>Smart Billing</strong>

                <span>
                  Fast and organized POS billing
                </span>
              </div>
            </div>

            <div className="home-feature-item">
              <div className="home-feature-icon">
                <FaShoppingCart />
              </div>

              <div>
                <strong>Easy Ordering</strong>

                <span>
                  Seamless customer ordering
                </span>
              </div>
            </div>

            <div className="home-feature-item">
              <div className="home-feature-icon">
                <FaShieldAlt />
              </div>

              <div>
                <strong>Secure Payments</strong>

                <span>
                  Reliable online payment processing
                </span>
              </div>
            </div>
          </div>

          <div className="home-trust-row">
            <div>
              <FaCheckCircle />
              <span>Secure authentication</span>
            </div>

            <div>
              <FaCheckCircle />
              <span>Real-time operations</span>
            </div>

            <div>
              <FaCheckCircle />
              <span>Easy to use</span>
            </div>
          </div>
        </div>

        {/* ===================================================
            AUTH CARD
            =================================================== */}
        <div className="home-auth-wrapper">
          <div className="home-auth-card">
            <div className="home-auth-header">
              <div className="home-auth-brand">
                <div className="home-auth-brand-icon">
                  <FaIceCream />
                </div>

                <div>
                  <strong>
                    IceCream Parlour
                  </strong>

                  <span>
                    Billing & Ordering System
                  </span>
                </div>
              </div>

              <div className="home-auth-heading">
                <h2>
                  {authMode === "login"
                    ? "Welcome back"
                    : "Create staff account"}
                </h2>

                <p>
                  {authMode === "login"
                    ? "Sign in to continue to your account."
                    : "Create a staff account to manage daily parlour operations."}
                </p>
              </div>
            </div>

            {/* =================================================
                AUTH TOGGLE
                ================================================= */}
            <div className="home-auth-toggle">
              <button
                type="button"
                className={
                  authMode === "login"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  switchAuthMode("login")
                }
              >
                Login
              </button>

              <button
                type="button"
                className={
                  authMode === "register"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  switchAuthMode("register")
                }
              >
                Register
              </button>
            </div>

            {/* =================================================
                LOGIN FORM
                ================================================= */}
            {authMode === "login" && (
              <form
                className="home-auth-form"
                onSubmit={handleLogin}
              >
                <div className="home-form-group">
                  <label htmlFor="home-login-email">
                    Email address
                  </label>

                  <div className="home-input-wrapper">
                    <FaUser />

                    <input
                      id="home-login-email"
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={
                        handleLoginChange
                      }
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-login-password">
                    Password
                  </label>

                  <div className="home-input-wrapper">
                    <FaLock />

                    <input
                      id="home-login-password"
                      type="password"
                      name="password"
                      value={
                        loginForm.password
                      }
                      onChange={
                        handleLoginChange
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="home-submit-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Signing in..."
                    : "Sign In"}

                  {!submitting && (
                    <FaArrowRight />
                  )}
                </button>

                <div className="home-form-footer">
                  <span>
                    Don't have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      switchAuthMode(
                        "register"
                      )
                    }
                    disabled={submitting}
                  >
                    Create one
                  </button>
                </div>
              </form>
            )}

            {/* =================================================
                REGISTER FORM
                ================================================= */}
            {authMode === "register" && (
              <form
                className="home-auth-form register-form"
                onSubmit={handleRegister}
              >
                <div className="home-role-section">
                  <div className="home-role-heading">
                    <div>
                      <span>
                        ACCOUNT TYPE
                      </span>

                      <strong>
                        Staff account
                      </strong>
                    </div>
                  </div>

                  <div className="home-role-options">
                    <div className="home-role-card active">
                      <div className="home-role-icon">
                        <FaUserTie />
                      </div>

                      <div className="home-role-copy">
                        <strong>
                          Staff
                        </strong>

                        <span>
                          Billing & daily
                          operations
                        </span>
                      </div>

                      <div className="home-role-check">
                        <FaCheckCircle />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-register-name">
                    Full name
                  </label>

                  <div className="home-input-wrapper">
                    <FaUser />

                    <input
                      id="home-register-name"
                      type="text"
                      name="name"
                      value={
                        registerForm.name
                      }
                      onChange={
                        handleRegisterChange
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-register-email">
                    Email address
                  </label>

                  <div className="home-input-wrapper">
                    <FaUser />

                    <input
                      id="home-register-email"
                      type="email"
                      name="email"
                      value={
                        registerForm.email
                      }
                      onChange={
                        handleRegisterChange
                      }
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-register-phone">
                    Phone number
                    <span className="optional-label">
                      Optional
                    </span>
                  </label>

                  <div className="home-input-wrapper">
                    <FaStore />

                    <input
                      id="home-register-phone"
                      type="tel"
                      name="phone"
                      value={
                        registerForm.phone
                      }
                      onChange={
                        handleRegisterChange
                      }
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                      maxLength={20}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-row">
                  <div className="home-form-group">
                    <label htmlFor="home-register-password">
                      Password
                    </label>

                    <div className="home-input-wrapper">
                      <FaLock />

                      <input
                        id="home-register-password"
                        type="password"
                        name="password"
                        value={
                          registerForm.password
                        }
                        onChange={
                          handleRegisterChange
                        }
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="home-form-group">
                    <label htmlFor="home-register-confirm-password">
                      Confirm password
                    </label>

                    <div className="home-input-wrapper">
                      <FaLock />

                      <input
                        id="home-register-confirm-password"
                        type="password"
                        name="confirmPassword"
                        value={
                          registerForm.confirmPassword
                        }
                        onChange={
                          handleRegisterChange
                        }
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="home-submit-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Creating account..."
                    : "Create Staff Account"}

                  {!submitting && (
                    <FaArrowRight />
                  )}
                </button>

                <div className="home-form-footer">
                  <span>
                    Already have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      switchAuthMode("login")
                    }
                    disabled={submitting}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            {/* =================================================
                SECURITY MESSAGE
                ================================================= */}
            <div className="home-auth-security">
              <FaShieldAlt />

              <span>
                Your account information is securely
                protected.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SERVICES
          ===================================================== */}
      <section className="home-services">
        <div className="home-service-card">
          <div className="home-service-icon">
            <FaReceipt />
          </div>

          <div>
            <strong>Billing</strong>

            <span>
              Fast POS transactions
            </span>
          </div>
        </div>

        <div className="home-service-card">
          <div className="home-service-icon">
            <FaShoppingCart />
          </div>

          <div>
            <strong>Orders</strong>

            <span>
              Simple order management
            </span>
          </div>
        </div>

        <div className="home-service-card">
          <div className="home-service-icon">
            <FaStore />
          </div>

          <div>
            <strong>Inventory</strong>

            <span>
              Keep stock under control
            </span>
          </div>
        </div>

        <div className="home-service-card">
          <div className="home-service-icon">
            <FaShieldAlt />
          </div>

          <div>
            <strong>Secure</strong>

            <span>
              Protected account access
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}
      <footer className="home-footer">
        <div className="home-footer-brand">
          <FaIceCream />

          <span>
            IceCream Billing System
          </span>
        </div>

        <span>
          © {new Date().getFullYear()} IceCream
          Parlour. All rights reserved.
        </span>
      </footer>
    </main>
  );
};

export default Home;