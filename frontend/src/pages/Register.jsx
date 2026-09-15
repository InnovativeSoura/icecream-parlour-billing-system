import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaIceCream,
  FaUser,
  FaUserTie,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaLock,
} from "react-icons/fa";

import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [role, setRole] = useState("customer");

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRoleChange = (selectedRole) => {
    if (submitting) return;

    setRole(selectedRole);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      toast.error(
        "Name, email and password are required."
      );
      return;
    }

    if (form.password.length < 6) {
      toast.error(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role,
      });

      toast.success(
        role === "staff"
          ? "Staff account created successfully!"
          : "Customer account created successfully!"
      );

      if (role === "staff") {
        navigate("/staff/dashboard", {
          replace: true,
        });
      } else {
        navigate("/customer", {
          replace: true,
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to create account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isStaff = role === "staff";

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-register">
        {/* =====================================================
            BRAND
        ====================================================== */}

        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FaIceCream />
          </div>

          <div>
            <h1>IceCream Parlour</h1>

            <p>
              {isStaff
                ? "Create your staff account"
                : "Create your customer account"}
            </p>
          </div>
        </div>

        {/* =====================================================
            HEADING
        ====================================================== */}

        <div className="auth-heading">
          <h2>
            {isStaff
              ? "Create staff account"
              : "Create account"}
          </h2>

          <p>
            {isStaff
              ? "Join the parlour team and manage daily operations."
              : "Join us and order your favourite ice cream."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ===================================================
              FULL NAME
          ==================================================== */}

          <div className="form-group">
            <label htmlFor="name">
              Full name
            </label>

            <div className="input-wrapper">
              <FaUser />

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                disabled={submitting}
              />
            </div>
          </div>

          {/* ===================================================
              EMAIL
          ==================================================== */}

          <div className="form-group">
            <label htmlFor="email">
              Email address
            </label>

            <div className="input-wrapper">
              <FaEnvelope />

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={submitting}
              />
            </div>
          </div>

          {/* ===================================================
              PHONE
          ==================================================== */}

          <div className="form-group">
            <label htmlFor="phone">
              Phone number{" "}
              <span>(optional)</span>
            </label>

            <div className="input-wrapper">
              <FaPhone />

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Your phone number"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                disabled={submitting}
              />
            </div>
          </div>

          {/* ===================================================
              ACCOUNT TYPE
          ==================================================== */}

          <div className="register-role-section">
            <div className="register-role-heading">
              <div>
                <label>
                  Account type
                </label>

                <span>
                  Select how you will use the system.
                </span>
              </div>
            </div>

            <div className="register-role-options">
              {/* CUSTOMER */}

              <button
                type="button"
                className={`register-role-card ${
                  role === "customer"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleRoleChange("customer")
                }
                disabled={submitting}
                aria-pressed={
                  role === "customer"
                }
              >
                <div className="register-role-icon">
                  <FaUser />
                </div>

                <div className="register-role-content">
                  <strong>
                    Customer
                  </strong>

                  <span>
                    Browse ice cream, place
                    orders and manage your
                    account.
                  </span>
                </div>

                <div className="register-role-radio">
                  {role === "customer" && (
                    <FaCheckCircle />
                  )}
                </div>
              </button>

              {/* STAFF */}

              <button
                type="button"
                className={`register-role-card ${
                  role === "staff"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleRoleChange("staff")
                }
                disabled={submitting}
                aria-pressed={
                  role === "staff"
                }
              >
                <div className="register-role-icon staff">
                  <FaUserTie />
                </div>

                <div className="register-role-content">
                  <strong>
                    Staff
                  </strong>

                  <span>
                    Manage billing, orders,
                    customers and parlour
                    operations.
                  </span>
                </div>

                <div className="register-role-radio">
                  {role === "staff" && (
                    <FaCheckCircle />
                  )}
                </div>
              </button>
            </div>

            <p className="register-role-hint">
              {isStaff ? (
                <>
                  Staff access includes{" "}
                  <strong>
                    billing, orders and reports.
                  </strong>
                </>
              ) : (
                <>
                  Customer access includes{" "}
                  <strong>
                    online ordering and invoices.
                  </strong>
                </>
              )}
            </p>
          </div>

          {/* ===================================================
              PASSWORD
          ==================================================== */}

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">
              <FaLock />

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={submitting}
              />
            </div>
          </div>

          {/* ===================================================
              CONFIRM PASSWORD
          ==================================================== */}

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <div className="input-wrapper">
              <FaLock />

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={submitting}
              />
            </div>
          </div>

          {/* ===================================================
              SUBMIT
          ==================================================== */}

          <button
            className={`auth-submit ${
              isStaff
                ? "auth-submit-staff"
                : ""
            }`}
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Creating account..."
              : isStaff
                ? "Create Staff Account"
                : "Create Customer Account"}
          </button>
        </form>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Register;