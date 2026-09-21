import { useState } from "react";
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

const Home = () => {
  const navigate = useNavigate();

  const { user, loading, login, register } = useAuth();

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

  const redirectByRole = (authenticatedUser) => {
    if (!authenticatedUser?.role) {
      navigate("/", { replace: true });
      return;
    }

    switch (authenticatedUser.role) {
      case "admin":
        navigate("/admin/dashboard", { replace: true });
        break;

      case "staff":
        navigate("/staff/dashboard", { replace: true });
        break;

      case "customer":
        toast.error("Customer accounts must use the customer portal.");
        navigate("/", { replace: true });
        break;

      default:
        navigate("/", { replace: true });
        break;
    }
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

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

      const loggedInUser = await login(email, password);

      if (loggedInUser?.role !== "admin" && loggedInUser?.role !== "staff") {
        toast.error("Customer accounts must use the customer portal.");

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

  const handleRegister = async (event) => {
    event.preventDefault();

    const name = registerForm.name.trim();
    const email = registerForm.email.trim();
    const phone = registerForm.phone.trim();
    const password = registerForm.password;
    const confirmPassword = registerForm.confirmPassword;

    if (!name) {
      toast.error("Please enter your name.");
      return;
    }

    if (name.length < 2) {
      toast.error("Name must contain at least 2 characters.");
      return;
    }

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!password) {
      toast.error("Please create a password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return;
    }

    if (!confirmPassword) {
      toast.error("Please confirm your password.");
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

      toast.success("Staff account created successfully!");

      redirectByRole(registeredUser);
    } catch (error) {
      console.error("Registration failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to create your account.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!loading && user) {
    return (
      <div className="home-authenticated">
        <div className="home-authenticated-card">
          <div className="home-brand-icon">
            <FaIceCream />
          </div>

          <h2>Welcome back, {user.name}</h2>

          <p>Your IceCream Parlour account is already signed in.</p>

          <button
            type="button"
            className="home-primary-button"
            onClick={() => redirectByRole(user)}
          >
            Open Dashboard
            <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="home-page">
      <div className="home-background">
        <div className="home-orb home-orb-one" />
        <div className="home-orb home-orb-two" />
        <div className="home-orb home-orb-three" />
      </div>

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
            onClick={() => switchAuthMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={
              authMode === "register"
                ? "home-nav-button primary"
                : "home-nav-button primary"
            }
            onClick={() => switchAuthMode("register")}
          >
            Register
          </button>
        </div>
      </header>

      <section className="home-hero">
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
            A modern billing and ordering platform designed to make ice cream
            parlour operations faster, simpler, and more delightful.
          </p>

          <div className="home-feature-list">
            <div className="home-feature-item">
              <div className="home-feature-icon">
                <FaReceipt />
              </div>

              <div>
                <strong>Smart Billing</strong>

                <span>Fast and organized POS billing</span>
              </div>
            </div>

            <div className="home-feature-item">
              <div className="home-feature-icon">
                <FaShoppingCart />
              </div>

              <div>
                <strong>Easy Ordering</strong>

                <span>Seamless customer ordering</span>
              </div>
            </div>

            <div className="home-feature-item">
              <div className="home-feature-icon">
                <FaShieldAlt />
              </div>

              <div>
                <strong>Secure Payments</strong>

                <span>Reliable online payment processing</span>
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

        <div className="home-auth-wrapper">
          <div className="home-auth-card">
            <div className="home-auth-header">
              <div className="home-auth-brand">
                <div className="home-auth-brand-icon">
                  <FaIceCream />
                </div>

                <div>
                  <strong>IceCream Parlour</strong>

                  <span>Billing &amp; Ordering System</span>
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

            <div className="home-auth-toggle">
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => switchAuthMode("login")}
                disabled={submitting}
              >
                Login
              </button>

              <button
                type="button"
                className={authMode === "register" ? "active" : ""}
                onClick={() => switchAuthMode("register")}
                disabled={submitting}
              >
                Register
              </button>
            </div>

            {authMode === "login" && (
              <form className="home-auth-form" onSubmit={handleLogin}>
                <div className="home-form-group">
                  <label htmlFor="home-login-email">Email address</label>

                  <div className="home-input-wrapper">
                    <FaUser />

                    <input
                      id="home-login-email"
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-login-password">Password</label>

                  <div className="home-input-wrapper">
                    <FaLock />

                    <input
                      id="home-login-password"
                      type="password"
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
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
                  {submitting ? "Signing in..." : "Sign In"}

                  {!submitting && <FaArrowRight />}
                </button>

                <div className="home-form-footer">
                  <span>Don't have an account?</span>

                  <button
                    type="button"
                    onClick={() => switchAuthMode("register")}
                    disabled={submitting}
                  >
                    Create one
                  </button>
                </div>
              </form>
            )}

            {authMode === "register" && (
              <form
                className="home-auth-form register-form"
                onSubmit={handleRegister}
              >
                <div className="home-role-section">
                  <div className="home-role-heading">
                    <span>ACCOUNT TYPE</span>

                    <strong>Staff account</strong>
                  </div>

                  <div className="home-role-options">
                    <div
                      className="home-role-card active"
                      aria-label="Staff account"
                    >
                      <div className="home-role-icon">
                        <FaUserTie />
                      </div>

                      <div className="home-role-copy">
                        <strong>Staff</strong>

                        <span>Billing &amp; daily operations</span>
                      </div>

                      <div className="home-role-check">
                        <FaCheckCircle />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-register-name">Full name</label>

                  <div className="home-input-wrapper">
                    <FaUser />

                    <input
                      id="home-register-name"
                      type="text"
                      name="name"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-register-email">Email address</label>

                  <div className="home-input-wrapper">
                    <FaUser />

                    <input
                      id="home-register-email"
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-group">
                  <label htmlFor="home-register-phone">
                    Phone number
                    <span className="optional-label">Optional</span>
                  </label>

                  <div className="home-input-wrapper">
                    <FaStore />

                    <input
                      id="home-register-phone"
                      type="tel"
                      name="phone"
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                      maxLength={20}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="home-form-row">
                  <div className="home-form-group">
                    <label htmlFor="home-register-password">Password</label>

                    <div className="home-input-wrapper">
                      <FaLock />

                      <input
                        id="home-register-password"
                        type="password"
                        name="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
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
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
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
                  {submitting ? "Creating account..." : "Create Staff Account"}

                  {!submitting && <FaArrowRight />}
                </button>

                <div className="home-form-footer">
                  <span>Already have an account?</span>

                  <button
                    type="button"
                    onClick={() => switchAuthMode("login")}
                    disabled={submitting}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            <div className="home-auth-security">
              <FaShieldAlt />

              <span>Your account information is securely protected.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-services">
        <div className="home-service-card">
          <div className="home-service-icon">
            <FaReceipt />
          </div>

          <div>
            <strong>Billing</strong>

            <span>Fast POS transactions</span>
          </div>
        </div>

        <div className="home-service-card">
          <div className="home-service-icon">
            <FaShoppingCart />
          </div>

          <div>
            <strong>Orders</strong>

            <span>Simple order management</span>
          </div>
        </div>

        <div className="home-service-card">
          <div className="home-service-icon">
            <FaStore />
          </div>

          <div>
            <strong>Inventory</strong>

            <span>Keep stock under control</span>
          </div>
        </div>

        <div className="home-service-card">
          <div className="home-service-icon">
            <FaShieldAlt />
          </div>

          <div>
            <strong>Secure</strong>

            <span>Protected account access</span>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-brand">
          <FaIceCream />

          <span>IceCream Billing System</span>
        </div>

        <span>
          © {new Date().getFullYear()} IceCream Parlour. All rights reserved.
        </span>
      </footer>
    </main>
  );
};

export default Home;
