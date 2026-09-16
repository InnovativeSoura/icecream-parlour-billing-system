import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaIceCream,
  FaArrowRight,
  FaCheckCircle,
  FaReceipt,
  FaUsers,
  FaBoxes,
  FaChartLine,
} from "react-icons/fa";

import "./Home.css";

const features = [
  {
    icon: FaReceipt,
    title: "Smart Billing",
    description:
      "Create accurate bills and manage orders quickly from one centralized system.",
  },
  {
    icon: FaBoxes,
    title: "Inventory Control",
    description:
      "Monitor products, stock levels and inventory activity with ease.",
  },
  {
    icon: FaUsers,
    title: "Customer Management",
    description:
      "Keep customer records organized and accessible whenever you need them.",
  },
  {
    icon: FaChartLine,
    title: "Business Insights",
    description:
      "Track sales, revenue and operational activity through useful reports.",
  },
];

const highlights = [
  "Fast and reliable billing",
  "Role-based access control",
  "Product and inventory management",
  "Customer order tracking",
  "Razorpay payment support",
  "Sales and business reports",
];

const Home = () => {
  return (
    <main className="home-page">
      {/* Background decoration */}
      <div className="home-orb home-orb-one" />
      <div className="home-orb home-orb-two" />
      <div className="home-grid" />

      {/* NAVBAR */}
      <header className="home-navbar">
        <Link to="/" className="home-brand">
          <div className="home-brand-icon">
            <FaIceCream />
          </div>

          <div className="home-brand-text">
            <strong>IceCream</strong>
            <span>BILLING SYSTEM</span>
          </div>
        </Link>

        <nav className="home-nav">
          <a href="#features">Features</a>
          <a href="#about">About</a>

          <Link to="/login" className="home-login-link">
            Login
          </Link>

          <Link to="/register" className="home-register-link">
            Register
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <motion.div
            className="home-eyebrow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="home-eyebrow-dot" />
            MODERN PARLOUR MANAGEMENT
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            Run your ice cream parlour
            <span> smarter and faster.</span>
          </motion.h1>

          <motion.p
            className="home-hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            A complete billing and business management platform built for
            modern ice cream parlours. Manage billing, products, inventory,
            customers, payments and reports from one place.
          </motion.p>

          <motion.div
            className="home-hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/login" className="home-primary-button">
              Login to Dashboard
              <FaArrowRight />
            </Link>

            <Link to="/register" className="home-secondary-button">
              Create Account
            </Link>
          </motion.div>

          <motion.div
            className="home-trust-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
          >
            <div className="home-trust-item">
              <FaCheckCircle />
              <span>Secure authentication</span>
            </div>

            <div className="home-trust-item">
              <FaCheckCircle />
              <span>Role-based access</span>
            </div>

            <div className="home-trust-item">
              <FaCheckCircle />
              <span>Razorpay ready</span>
            </div>
          </motion.div>
        </div>

        {/* HERO VISUAL */}
        <motion.div
          className="home-hero-visual"
          initial={{ opacity: 0, x: 45 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="home-dashboard-card">
            <div className="home-dashboard-top">
              <div>
                <span>PARLOUR OVERVIEW</span>
                <h3>Today's Overview</h3>
              </div>

              <div className="home-dashboard-avatar">
                <FaIceCream />
              </div>
            </div>

            <div className="home-dashboard-stats">
              <div className="home-mini-stat">
                <span>ORDERS</span>
                <strong>128</strong>
                <small>Today's orders</small>
              </div>

              <div className="home-mini-stat">
                <span>REVENUE</span>
                <strong>₹18.4K</strong>
                <small>Today's revenue</small>
              </div>
            </div>

            <div className="home-dashboard-chart">
              <div className="home-chart-heading">
                <span>Sales Activity</span>
                <strong>+24.8%</strong>
              </div>

              <div className="home-chart-bars">
                <i style={{ height: "38%" }} />
                <i style={{ height: "52%" }} />
                <i style={{ height: "44%" }} />
                <i style={{ height: "67%" }} />
                <i style={{ height: "58%" }} />
                <i style={{ height: "82%" }} />
                <i style={{ height: "73%" }} />
                <i style={{ height: "94%" }} />
              </div>
            </div>

            <div className="home-dashboard-bottom">
              <div className="home-status-dot" />

              <div>
                <strong>System operational</strong>
                <span>All services are running normally</span>
              </div>

              <FaCheckCircle />
            </div>
          </div>

          <div className="home-floating-card home-floating-orders">
            <div className="home-floating-icon">
              <FaReceipt />
            </div>

            <div>
              <strong>New Order</strong>
              <span>Order #000128</span>
            </div>

            <b>₹420</b>
          </div>

          <div className="home-floating-card home-floating-stock">
            <div className="home-floating-icon">
              <FaBoxes />
            </div>

            <div>
              <strong>Inventory</strong>
              <span>Stock monitored</span>
            </div>

            <FaCheckCircle />
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="home-features-section" id="features">
        <div className="home-section-heading">
          <span>POWERFUL FEATURES</span>

          <h2>
            Everything your parlour needs,
            <strong> in one system.</strong>
          </h2>

          <p>
            Manage your day-to-day operations through a clean, centralized
            workspace designed for speed and simplicity.
          </p>
        </div>

        <div className="home-feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                className="home-feature-card"
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
              >
                <div className="home-feature-icon">
                  <Icon />
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>

                <span className="home-feature-arrow">
                  <FaArrowRight />
                </span>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ABOUT / HIGHLIGHTS */}
      <section className="home-about-section" id="about">
        <div className="home-about-card">
          <div className="home-about-content">
            <span className="home-about-eyebrow">
              BUILT FOR YOUR BUSINESS
            </span>

            <h2>
              From the first order
              <span> to the final report.</span>
            </h2>

            <p>
              IceCream Billing System brings your core parlour operations
              together so your team can spend less time managing systems and
              more time serving customers.
            </p>

            <Link to="/register" className="home-about-button">
              Create Your Account
              <FaArrowRight />
            </Link>
          </div>

          <div className="home-highlights">
            {highlights.map((item) => (
              <div className="home-highlight" key={item}>
                <FaCheckCircle />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="home-cta-icon">
          <FaIceCream />
        </div>

        <span>READY TO GET STARTED?</span>

        <h2>
          Your parlour deserves
          <strong> a smarter workflow.</strong>
        </h2>

        <p>
          Sign in to your existing account or create a new account to begin.
        </p>

        <div className="home-cta-actions">
          <Link to="/login" className="home-primary-button">
            Login
            <FaArrowRight />
          </Link>

          <Link to="/register" className="home-secondary-button">
            Register
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-footer-brand">
          <div className="home-brand-icon">
            <FaIceCream />
          </div>

          <div className="home-brand-text">
            <strong>IceCream</strong>
            <span>BILLING SYSTEM</span>
          </div>
        </div>

        <p>
          © {new Date().getFullYear()} IceCream Billing System. All rights
          reserved.
        </p>

        <div className="home-footer-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </main>
  );
};

export default Home;