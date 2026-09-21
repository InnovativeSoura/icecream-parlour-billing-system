import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import {
  FaIceCream,
  FaShoppingBag,
  FaReceipt,
  FaCreditCard,
  FaClock,
  FaStar,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaCheckCircle,
  FaSignInAlt,
  FaUserPlus,
} from "react-icons/fa";

import { useAuth } from "./../context/AuthContext";

import "./Home.css";

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user, loading, login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  if (!loading && user?.role === "customer") {
    navigate("/customer/dashboard", { replace: true });
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);

    setShowPassword(false);
    setShowConfirmPassword(false);

    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const loggedInUser = await login(form.email.trim(), form.password);

      if (loggedInUser?.role !== "customer") {
        toast.error(
          "This customer portal is only available for customer accounts.",
        );

        return;
      }

      toast.success("Welcome back!");

      navigate("/customer/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Customer login failed:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name || !email || !form.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (name.length < 2) {
      toast.error("Name must contain at least 2 characters.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const registeredUser = await register({
        name,
        email,
        phone,
        password: form.password,
        role: "customer",
      });

      if (registeredUser?.role !== "customer") {
        toast.error("Customer registration could not be completed.");
        return;
      }

      toast.success("Customer account created successfully!");

      navigate("/customer/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Customer registration failed:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create your account.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-home">
      <header className="customer-navbar">
        <div className="customer-brand">
          <div className="customer-brand-icon">
            <FaIceCream />
          </div>

          <div className="customer-brand-text">
            <strong>IceCream Parlour</strong>
            <span>Billing & Ordering System</span>
          </div>
        </div>

        <div className="customer-nav-actions">
          <button
            type="button"
            className={
              mode === "login" ? "customer-nav-btn active" : "customer-nav-btn"
            }
            onClick={() => switchMode("login")}
          >
            Sign In
          </button>

          <button
            type="button"
            className={
              mode === "register"
                ? "customer-nav-btn primary"
                : "customer-nav-btn primary"
            }
            onClick={() => switchMode("register")}
          >
            Create Account
          </button>
        </div>
      </header>

      <main className="customer-home-main">
        <section className="customer-hero">
          <motion.div
            className="customer-hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="customer-eyebrow">
              <FaIceCream />
              Customer Ordering Portal
            </div>

            <h1>
              Your favourite
              <span>ice cream,</span>
              just a few clicks away.
            </h1>

            <p>
              Browse delicious flavours, place your order, make secure payments
              and keep track of every order from one simple customer account.
            </p>

            <div className="customer-hero-actions">
              <button
                type="button"
                className="customer-primary-action"
                onClick={() => {
                  switchMode("register");
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                Create Customer Account
                <FaArrowRight />
              </button>

              <button
                type="button"
                className="customer-secondary-action"
                onClick={() => {
                  switchMode("login");
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                <FaSignInAlt />
                Sign In
              </button>
            </div>

            <div className="customer-trust">
              <div>
                <FaCheckCircle />
                Secure ordering
              </div>

              <div>
                <FaCheckCircle />
                Easy payments
              </div>

              <div>
                <FaCheckCircle />
                Order tracking
              </div>
            </div>
          </motion.div>

          <motion.div
            className="customer-auth-wrapper"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
            }}
          >
            <div className="customer-auth-card">
              <div className="customer-auth-top">
                <div className="customer-auth-icon">
                  {mode === "login" ? <FaSignInAlt /> : <FaUserPlus />}
                </div>

                <div>
                  <span>CUSTOMER PORTAL</span>

                  <strong>
                    {mode === "login" ? "Welcome back" : "Create your account"}
                  </strong>
                </div>
              </div>

              <div className="customer-auth-toggle">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => switchMode("login")}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  className={mode === "register" ? "active" : ""}
                  onClick={() => switchMode("register")}
                >
                  Register
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.form
                    key="login"
                    className="customer-auth-form"
                    onSubmit={handleLogin}
                    initial={{
                      opacity: 0,
                      x: 12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -12,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                  >
                    <div className="customer-form-heading">
                      <h2>Sign in to your account</h2>

                      <p>Access your orders, cart and invoices.</p>
                    </div>

                    <div className="customer-form-group">
                      <label>Email address</label>

                      <div className="customer-input-wrapper">
                        <FaEnvelope />

                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    <div className="customer-form-group">
                      <label>Password</label>

                      <div className="customer-input-wrapper">
                        <FaLock />

                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="customer-login-options">
                      <label>
                        <input type="checkbox" />
                        <span>Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          toast.info("Password reset will be connected here.")
                        }
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="customer-submit"
                      disabled={submitting}
                    >
                      {submitting ? "Signing in..." : "Sign In"}
                      <FaArrowRight />
                    </button>

                    <div className="customer-form-footer">
                      Don't have an account?
                      <button
                        type="button"
                        onClick={() => switchMode("register")}
                      >
                        Create one
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    className="customer-auth-form"
                    onSubmit={handleRegister}
                    initial={{
                      opacity: 0,
                      x: 12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -12,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                  >
                    <div className="customer-form-heading">
                      <h2>Create your account</h2>

                      <p>Join the IceCream Parlour customer portal.</p>
                    </div>

                    <div className="customer-form-group">
                      <label>Full name</label>

                      <div className="customer-input-wrapper">
                        <FaUser />

                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>

                    <div className="customer-form-group">
                      <label>Email address</label>

                      <div className="customer-input-wrapper">
                        <FaEnvelope />

                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    <div className="customer-form-group">
                      <label>
                        Phone number
                        <span>Optional</span>
                      </label>

                      <div className="customer-input-wrapper">
                        <FaPhone />

                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className="customer-password-grid">
                      <div className="customer-form-group">
                        <label>Password</label>

                        <div className="customer-input-wrapper">
                          <FaLock />

                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Minimum 6 characters"
                            autoComplete="new-password"
                            required
                          />

                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                              setShowPassword((previous) => !previous)
                            }
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="customer-form-group">
                        <label>Confirm password</label>

                        <div className="customer-input-wrapper">
                          <FaLock />

                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat password"
                            autoComplete="new-password"
                            required
                          />

                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                              setShowConfirmPassword((previous) => !previous)
                            }
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="customer-account-note">
                      <FaCheckCircle />

                      <span>
                        Your account will automatically be created as a{" "}
                        <strong>Customer</strong>.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="customer-submit"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Creating account..."
                        : "Create Customer Account"}

                      <FaArrowRight />
                    </button>

                    <div className="customer-form-footer">
                      Already have an account?
                      <button type="button" onClick={() => switchMode("login")}>
                        Sign in
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        <section className="customer-features">
          <div className="customer-section-heading">
            <span>WHY ORDER WITH US</span>

            <h2>Everything you need in one place.</h2>

            <p>
              Your customer account keeps ordering, payments and order history
              organized.
            </p>
          </div>

          <div className="customer-feature-grid">
            <FeatureCard
              icon={<FaShoppingBag />}
              title="Easy Ordering"
              text="Browse available ice creams and place orders quickly."
            />

            <FeatureCard
              icon={<FaCreditCard />}
              title="Secure Payments"
              text="Complete online payments through a secure payment flow."
            />

            <FeatureCard
              icon={<FaReceipt />}
              title="Digital Invoices"
              text="Keep your order and billing information accessible."
            />

            <FeatureCard
              icon={<FaClock />}
              title="Order Tracking"
              text="Follow the progress of your orders from your account."
            />
          </div>
        </section>

        <footer className="customer-footer">
          <div className="customer-footer-brand">
            <FaIceCream />

            <span>IceCream Parlour Billing System</span>
          </div>

          <span>Customer Ordering Portal</span>
        </footer>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, text }) => {
  return (
    <motion.div
      className="customer-feature-card"
      whileHover={{
        y: -5,
      }}
      transition={{
        duration: 0.2,
      }}
    >
      <div className="customer-feature-icon">{icon}</div>

      <h3>{title}</h3>

      <p>{text}</p>
    </motion.div>
  );
};

export default CustomerHome;
