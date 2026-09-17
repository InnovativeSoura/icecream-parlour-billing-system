// frontend/src/pages/customer/Invoices.jsx

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  FaFileInvoiceDollar,
  FaSearch,
  FaEye,
  FaDownload,
  FaTimes,
  FaCalendarAlt,
  FaCreditCard,
  FaReceipt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

import { toast } from "react-toastify";

import api from "./../api/api";

import "./Invoices.css";

const Invoices = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // =====================================================
  // FETCH INVOICES
  // =====================================================

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const response = await api.get("/orders/my-orders");

      const data = response?.data;

      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setOrders(orderList);
    } catch (error) {
      console.error("Invoice fetch error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load invoices"
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FILTER INVOICES
  // =====================================================

  const invoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        String(order?.orderNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(order?.paymentMethod || "")
          .toLowerCase()
          .includes(query) ||
        String(order?.paymentStatus || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [orders, search]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount || 0);

    return `₹${numericAmount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // =====================================================
  // PAYMENT ICON
  // =====================================================

  const getPaymentIcon = (method) => {
    switch (String(method || "").toLowerCase()) {
      case "razorpay":
      case "card":
        return <FaCreditCard />;

      case "upi":
        return <FaReceipt />;

      case "cash":
        return <FaReceipt />;

      default:
        return <FaCreditCard />;
    }
  };

  // =====================================================
  // STATUS ICON
  // =====================================================

  const getStatusIcon = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "paid":
        return <FaCheckCircle />;

      case "pending":
        return <FaClock />;

      case "failed":
      case "cancelled":
        return <FaTimesCircle />;

      default:
        return <FaClock />;
    }
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "paid":
        return "status-paid";

      case "pending":
        return "status-pending";

      case "failed":
      case "cancelled":
        return "status-failed";

      default:
        return "status-pending";
    }
  };

  // =====================================================
  // PAYMENT LABEL
  // =====================================================

  const getPaymentLabel = (method) => {
    if (!method) {
      return "Unpaid";
    }

    return String(method)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =====================================================
  // ESCAPE HTML
  // =====================================================

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // =====================================================
  // GET ITEM TOTAL
  // =====================================================

  const getItemTotal = (item) => {
    const explicitTotal = Number(
      item?.total ??
        item?.totalAmount ??
        item?.lineTotal
    );

    if (
      Number.isFinite(explicitTotal) &&
      explicitTotal >= 0
    ) {
      return explicitTotal;
    }

    const quantity =
      Number(item?.quantity || 1);

    const unitPrice =
      Number(
        item?.unitPrice ??
          item?.price ??
          0
      );

    return quantity * unitPrice;
  };

  // =====================================================
  // GET CUSTOMER NAME
  // =====================================================

  const getCustomerName = (invoice) => {
    return (
      invoice?.customerSnapshot?.name ||
      invoice?.customer?.name ||
      invoice?.customerName ||
      "Customer"
    );
  };

  // =====================================================
  // GET CUSTOMER EMAIL
  // =====================================================

  const getCustomerEmail = (invoice) => {
    return (
      invoice?.customerSnapshot?.email ||
      invoice?.customer?.email ||
      invoice?.email ||
      ""
    );
  };

  // =====================================================
  // GET CUSTOMER PHONE
  // =====================================================

  const getCustomerPhone = (invoice) => {
    return (
      invoice?.customerSnapshot?.phone ||
      invoice?.customer?.phone ||
      invoice?.phone ||
      ""
    );
  };

  // =====================================================
  // GENERATE INVOICE NUMBER
  // =====================================================

  const getInvoiceNumber = (invoice) => {
    return (
      invoice?.invoiceNumber ||
      invoice?.orderNumber ||
      (invoice?._id
        ? `INV-${invoice._id
            .slice(-8)
            .toUpperCase()}`
        : "INVOICE")
    );
  };

  // =====================================================
  // DOWNLOAD / PRINT INVOICE
  // =====================================================

  const handleDownload = (invoice) => {
    if (!invoice) {
      toast.error("Invoice information is unavailable.");
      return;
    }

    try {
      const invoiceNumber =
        getInvoiceNumber(invoice);

      const invoiceDate = formatDate(
        invoice.createdAt ||
          invoice.orderDate ||
          invoice.date
      );

      const invoiceTime = formatTime(
        invoice.createdAt ||
          invoice.orderDate ||
          invoice.date
      );

      const customerName =
        getCustomerName(invoice);

      const customerEmail =
        getCustomerEmail(invoice);

      const customerPhone =
        getCustomerPhone(invoice);

      const paymentMethod =
        getPaymentLabel(
          invoice.paymentMethod
        );

      const paymentStatus =
        invoice.paymentStatus ||
        "pending";

      const items = Array.isArray(
        invoice.items
      )
        ? invoice.items
        : [];

      const subtotal = Number(
        invoice.subtotal || 0
      );

      const discount = Number(
        invoice.discount || 0
      );

      const tax = Number(
        invoice.tax || 0
      );

      const totalAmount = Number(
        invoice.totalAmount ??
          invoice.total ??
          invoice.grandTotal ??
          0
      );

      // -------------------------------------------------
      // ITEM ROWS
      // -------------------------------------------------

      const itemRows =
        items.length > 0
          ? items
              .map((item, index) => {
                const name =
                  item?.name ||
                  item?.product?.name ||
                  `Ice Cream Item ${
                    index + 1
                  }`;

                const quantity =
                  Number(
                    item?.quantity || 1
                  );

                const unitPrice =
                  Number(
                    item?.unitPrice ??
                      item?.price ??
                      0
                  );

                const itemTotal =
                  getItemTotal(item);

                return `
                  <tr>
                    <td class="item-name">
                      ${escapeHtml(name)}
                    </td>

                    <td class="center">
                      ${quantity}
                    </td>

                    <td class="right">
                      ${formatCurrency(
                        unitPrice
                      )}
                    </td>

                    <td class="right strong">
                      ${formatCurrency(
                        itemTotal
                      )}
                    </td>
                  </tr>
                `;
              })
              .join("")
          : `
              <tr>
                <td
                  colspan="4"
                  class="empty-items"
                >
                  No item details available
                </td>
              </tr>
            `;

      // -------------------------------------------------
      // OPTIONAL SUMMARY ROWS
      // -------------------------------------------------

      const subtotalRow =
        subtotal > 0
          ? `
              <div class="summary-row">
                <span>Subtotal</span>
                <strong>
                  ${formatCurrency(subtotal)}
                </strong>
              </div>
            `
          : "";

      const discountRow =
        discount > 0
          ? `
              <div class="summary-row discount">
                <span>Discount</span>
                <strong>
                  -${formatCurrency(discount)}
                </strong>
              </div>
            `
          : "";

      const taxRow =
        tax > 0
          ? `
              <div class="summary-row">
                <span>Tax</span>
                <strong>
                  ${formatCurrency(tax)}
                </strong>
              </div>
            `
          : "";

      // -------------------------------------------------
      // CREATE PRINT DOCUMENT
      // -------------------------------------------------

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=900,height=900"
        );

      if (!printWindow) {
        toast.error(
          "Please allow pop-ups to download the invoice."
        );
        return;
      }

      printWindow.document.open();

      printWindow.document.write(`
        <!DOCTYPE html>

        <html lang="en">

        <head>

          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            ${escapeHtml(invoiceNumber)}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #1f2937;
              font-family:
                Inter,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Arial,
                sans-serif;
            }

            body {
              padding: 40px;
            }

            .invoice-document {
              width: 100%;
              max-width: 820px;
              margin: 0 auto;
              background: #ffffff;
            }

            .invoice-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 30px;
              padding-bottom: 28px;
              border-bottom: 2px solid #ede9fe;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 14px;
            }

            .brand-icon {
              width: 52px;
              height: 52px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 15px;
              color: #ffffff;
              background:
                linear-gradient(
                  135deg,
                  #7c3aed,
                  #a855f7
                );
              font-size: 25px;
              font-weight: 800;
            }

            .brand-name {
              margin: 0;
              color: #171b2d;
              font-size: 23px;
              font-weight: 850;
              letter-spacing: -0.7px;
            }

            .brand-subtitle {
              margin-top: 4px;
              color: #8b93a7;
              font-size: 11px;
              font-weight: 600;
            }

            .invoice-heading {
              text-align: right;
            }

            .invoice-label {
              margin-bottom: 5px;
              color: #8b5cf6;
              font-size: 10px;
              font-weight: 850;
              letter-spacing: 1.6px;
              text-transform: uppercase;
            }

            .invoice-heading h1 {
              margin: 0;
              color: #171b2d;
              font-size: 25px;
              font-weight: 850;
            }

            .invoice-heading p {
              margin: 5px 0 0;
              color: #8b93a7;
              font-size: 11px;
            }

            .invoice-meta {
              display: grid;
              grid-template-columns:
                repeat(3, 1fr);
              gap: 14px;
              margin-top: 25px;
            }

            .meta-card {
              padding: 14px;
              border: 1px solid #e9e7f4;
              border-radius: 12px;
              background: #faf9ff;
            }

            .meta-label {
              display: block;
              margin-bottom: 5px;
              color: #969daf;
              font-size: 9px;
              font-weight: 750;
              letter-spacing: 0.7px;
              text-transform: uppercase;
            }

            .meta-value {
              display: block;
              color: #30374a;
              font-size: 12px;
              font-weight: 750;
            }

            .customer-section {
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 20px;
              margin-top: 28px;
            }

            .section-box {
              padding: 18px;
              border: 1px solid #eceaf3;
              border-radius: 13px;
            }

            .section-title {
              margin: 0 0 10px;
              color: #7c3aed;
              font-size: 10px;
              font-weight: 850;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            .customer-name {
              margin: 0;
              color: #252b3d;
              font-size: 15px;
              font-weight: 800;
            }

            .customer-detail {
              margin-top: 5px;
              color: #777f92;
              font-size: 10px;
            }

            .items-section {
              margin-top: 28px;
            }

            .items-section h2 {
              margin: 0 0 12px;
              color: #242a3c;
              font-size: 14px;
              font-weight: 800;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              overflow: hidden;
              border: 1px solid #e9e7f1;
              border-radius: 12px;
            }

            thead {
              background: #f7f5ff;
            }

            th {
              padding: 12px 14px;
              color: #737b8d;
              font-size: 9px;
              font-weight: 850;
              letter-spacing: 0.6px;
              text-align: left;
              text-transform: uppercase;
              border-bottom: 1px solid #e8e5f1;
            }

            td {
              padding: 13px 14px;
              color: #4d5568;
              font-size: 11px;
              border-bottom: 1px solid #f0eef5;
            }

            tbody tr:last-child td {
              border-bottom: 0;
            }

            .item-name {
              color: #30374a;
              font-weight: 700;
            }

            .center {
              text-align: center;
            }

            .right {
              text-align: right;
            }

            .strong {
              color: #252b3c;
              font-weight: 800;
            }

            .empty-items {
              padding: 22px;
              color: #9aa1b0;
              text-align: center;
            }

            .bottom-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 24px;
            }

            .summary {
              width: 320px;
            }

            .summary-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              padding: 7px 0;
              color: #747c8e;
              font-size: 11px;
            }

            .summary-row strong {
              color: #343b4d;
              font-weight: 750;
            }

            .summary-row.discount strong {
              color: #059669;
            }

            .summary-total {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              margin-top: 8px;
              padding-top: 15px;
              border-top: 2px solid #e9e5f5;
            }

            .summary-total span {
              color: #252b3d;
              font-size: 13px;
              font-weight: 800;
            }

            .summary-total strong {
              color: #7c3aed;
              font-size: 20px;
              font-weight: 850;
            }

            .payment-status {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-top: 16px;
              padding: 7px 11px;
              border-radius: 999px;
              color: #047857;
              background: #ecfdf5;
              font-size: 9px;
              font-weight: 850;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }

            .payment-status.pending {
              color: #b45309;
              background: #fffbeb;
            }

            .payment-status.failed,
            .payment-status.cancelled {
              color: #b91c1c;
              background: #fef2f2;
            }

            .footer {
              margin-top: 40px;
              padding-top: 18px;
              border-top: 1px solid #eceaf2;
              text-align: center;
            }

            .footer strong {
              display: block;
              color: #626a7d;
              font-size: 11px;
            }

            .footer span {
              display: block;
              margin-top: 4px;
              color: #a0a6b3;
              font-size: 9px;
            }

            @media print {

              body {
                padding: 0;
              }

              .invoice-document {
                max-width: none;
              }

              @page {
                size: A4;
                margin: 14mm;
              }

            }

            @media (max-width: 650px) {

              body {
                padding: 20px;
              }

              .invoice-header {
                flex-direction: column;
              }

              .invoice-heading {
                text-align: left;
              }

              .invoice-meta,
              .customer-section {
                grid-template-columns: 1fr;
              }

              .bottom-section {
                justify-content: stretch;
              }

              .summary {
                width: 100%;
              }

            }

          </style>

        </head>

        <body>

          <div class="invoice-document">

            <!-- HEADER -->

            <header class="invoice-header">

              <div class="brand">

                <div class="brand-icon">
                  🍦
                </div>

                <div>

                  <h2 class="brand-name">
                    IceCream Billing System
                  </h2>

                  <div class="brand-subtitle">
                    Ice Cream Parlour
                  </div>

                </div>

              </div>

              <div class="invoice-heading">

                <div class="invoice-label">
                  Invoice
                </div>

                <h1>
                  ${escapeHtml(
                    invoiceNumber
                  )}
                </h1>

                <p>
                  Generated ${escapeHtml(
                    invoiceDate
                  )}
                </p>

              </div>

            </header>

            <!-- META -->

            <section class="invoice-meta">

              <div class="meta-card">

                <span class="meta-label">
                  Invoice Date
                </span>

                <span class="meta-value">
                  ${escapeHtml(
                    invoiceDate
                  )}
                </span>

              </div>

              <div class="meta-card">

                <span class="meta-label">
                  Order Time
                </span>

                <span class="meta-value">
                  ${escapeHtml(
                    invoiceTime || "—"
                  )}
                </span>

              </div>

              <div class="meta-card">

                <span class="meta-label">
                  Payment
                </span>

                <span class="meta-value">
                  ${escapeHtml(
                    paymentMethod
                  )}
                </span>

              </div>

            </section>

            <!-- CUSTOMER -->

            <section class="customer-section">

              <div class="section-box">

                <h3 class="section-title">
                  Billed To
                </h3>

                <p class="customer-name">
                  ${escapeHtml(
                    customerName
                  )}
                </p>

                ${
                  customerEmail
                    ? `
                      <div class="customer-detail">
                        ${escapeHtml(
                          customerEmail
                        )}
                      </div>
                    `
                    : ""
                }

                ${
                  customerPhone
                    ? `
                      <div class="customer-detail">
                        ${escapeHtml(
                          customerPhone
                        )}
                      </div>
                    `
                    : ""
                }

              </div>

              <div class="section-box">

                <h3 class="section-title">
                  Payment Status
                </h3>

                <p class="customer-name">
                  ${escapeHtml(
                    String(
                      paymentStatus
                    )
                      .replace(
                        /_/g,
                        " "
                      )
                      .replace(
                        /\b\w/g,
                        (letter) =>
                          letter.toUpperCase()
                      )
                  )}
                </p>

                ${
                  invoice.paymentId
                    ? `
                      <div class="customer-detail">
                        Payment ID:
                        ${escapeHtml(
                          invoice.paymentId
                        )}
                      </div>
                    `
                    : ""
                }

                ${
                  invoice.paymentOrderId
                    ? `
                      <div class="customer-detail">
                        Razorpay Order:
                        ${escapeHtml(
                          invoice.paymentOrderId
                        )}
                      </div>
                    `
                    : ""
                }

              </div>

            </section>

            <!-- ITEMS -->

            <section class="items-section">

              <h2>
                Order Items
              </h2>

              <table>

                <thead>

                  <tr>

                    <th>
                      Item
                    </th>

                    <th
                      style="text-align:center"
                    >
                      Qty
                    </th>

                    <th
                      style="text-align:right"
                    >
                      Unit Price
                    </th>

                    <th
                      style="text-align:right"
                    >
                      Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  ${itemRows}

                </tbody>

              </table>

            </section>

            <!-- TOTAL -->

            <section class="bottom-section">

              <div class="summary">

                ${subtotalRow}

                ${discountRow}

                ${taxRow}

                <div class="summary-total">

                  <span>
                    Total Amount
                  </span>

                  <strong>
                    ${formatCurrency(
                      totalAmount
                    )}
                  </strong>

                </div>

                <div
                  class="
                    payment-status
                    ${
                      String(
                        paymentStatus
                      ).toLowerCase()
                    }
                  "
                >
                  ${escapeHtml(
                    String(
                      paymentStatus
                    ).toUpperCase()
                  )}
                </div>

              </div>

            </section>

            <!-- FOOTER -->

            <footer class="footer">

              <strong>
                Thank you for choosing
                IceCream Billing System.
              </strong>

              <span>
                This is a computer-generated
                invoice.
              </span>

            </footer>

          </div>

          <script>

            window.onload = function () {

              setTimeout(function () {

                window.print();

              }, 350);

            };

            window.onafterprint = function () {

              setTimeout(function () {

                window.close();

              }, 250);

            };

          </script>

        </body>

        </html>
      `);

      printWindow.document.close();

      toast.success(
        "Invoice opened for PDF download."
      );
    } catch (error) {
      console.error(
        "Invoice download error:",
        error
      );

      toast.error(
        "Unable to generate invoice."
      );
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="customer-invoices-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <motion.div
        className="invoices-header"
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >

        <div>

          <span className="invoices-eyebrow">

            <FaFileInvoiceDollar />

            BILLING CENTER

          </span>

          <h1>
            My Invoices
          </h1>

          <p>
            View your order invoices,
            payment details, and purchase
            history.
          </p>

        </div>

        <div className="invoice-header-icon">

          <FaFileInvoiceDollar />

        </div>

      </motion.div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="invoice-summary-grid">

        {/* TOTAL */}

        <motion.div
          className="invoice-summary-card"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
          }}
        >

          <div className="summary-icon">

            <FaFileInvoiceDollar />

          </div>

          <div>

            <span>
              Total Invoices
            </span>

            <strong>
              {orders.length}
            </strong>

          </div>

        </motion.div>

        {/* PAID */}

        <motion.div
          className="invoice-summary-card"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
        >

          <div className="summary-icon paid">

            <FaCheckCircle />

          </div>

          <div>

            <span>
              Paid Orders
            </span>

            <strong>

              {
                orders.filter(
                  (order) =>
                    String(
                      order?.paymentStatus ||
                      ""
                    ).toLowerCase() ===
                    "paid"
                ).length
              }

            </strong>

          </div>

        </motion.div>

        {/* SPENT */}

        <motion.div
          className="invoice-summary-card"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
          }}
        >

          <div className="summary-icon amount">

            <FaReceipt />

          </div>

          <div>

            <span>
              Total Spent
            </span>

            <strong>

              {formatCurrency(
                orders
                  .filter(
                    (order) =>
                      String(
                        order?.paymentStatus ||
                        ""
                      ).toLowerCase() ===
                      "paid"
                  )
                  .reduce(
                    (
                      total,
                      order
                    ) =>
                      total +
                      Number(
                        order?.totalAmount ||
                          0
                      ),
                    0
                  )
              )}

            </strong>

          </div>

        </motion.div>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="invoices-toolbar">

        <div className="invoice-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Search invoice or order number..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="invoice-count">

          {invoices.length} invoice
          {invoices.length !== 1
            ? "s"
            : ""}

        </div>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="invoices-card">

        {/* LOADING */}

        {loading ? (

          <div className="invoice-loading">

            <div className="invoice-spinner" />

            <p>
              Loading your invoices...
            </p>

          </div>

        ) : invoices.length === 0 ? (

          /* EMPTY */

          <div className="invoice-empty">

            <div className="empty-invoice-icon">

              <FaFileInvoiceDollar />

            </div>

            <h3>
              No invoices found
            </h3>

            <p>

              {search
                ? "Try a different search term."
                : "Your invoices will appear here after you place an order."}

            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                DESKTOP TABLE
            ================================================= */}

            <div className="invoice-table-wrapper">

              <table className="invoice-table">

                <thead>

                  <tr>

                    <th>
                      Invoice
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Items
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {invoices.map(
                    (
                      order,
                      index
                    ) => (

                      <motion.tr
                        key={
                          order?._id ||
                          order?.id ||
                          index
                        }
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index * 0.03,
                        }}
                      >

                        {/* INVOICE */}

                        <td>

                          <div className="invoice-number">

                            <div className="invoice-mini-icon">

                              <FaFileInvoiceDollar />

                            </div>

                            <div>

                              <strong>

                                {order?.orderNumber ||
                                  "Invoice"}

                              </strong>

                              <small>

                                {order?._id
                                  ? `#${order._id
                                      .slice(
                                        -8
                                      )
                                      .toUpperCase()}`
                                  : ""}

                              </small>

                            </div>

                          </div>

                        </td>

                        {/* DATE */}

                        <td>

                          <div className="invoice-date">

                            <strong>
                              {formatDate(
                                order?.createdAt
                              )}
                            </strong>

                            <span>
                              {formatTime(
                                order?.createdAt
                              )}
                            </span>

                          </div>

                        </td>

                        {/* ITEMS */}

                        <td>

                          <span className="item-count">

                            {order?.items
                              ?.length ||
                              0}{" "}

                            item
                            {order?.items
                              ?.length !==
                            1
                              ? "s"
                              : ""}

                          </span>

                        </td>

                        {/* PAYMENT */}

                        <td>

                          <div className="payment-method">

                            {getPaymentIcon(
                              order?.paymentMethod
                            )}

                            <span>

                              {getPaymentLabel(
                                order?.paymentMethod
                              )}

                            </span>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`invoice-status ${getStatusClass(
                              order?.paymentStatus
                            )}`}
                          >

                            {getStatusIcon(
                              order?.paymentStatus
                            )}

                            {String(
                              order?.paymentStatus ||
                                "Pending"
                            )
                              .replace(
                                /_/g,
                                " "
                              )
                              .replace(
                                /\b\w/g,
                                (
                                  letter
                                ) =>
                                  letter.toUpperCase()
                              )}

                          </span>

                        </td>

                        {/* TOTAL */}

                        <td>

                          <strong className="invoice-total">

                            {formatCurrency(
                              order?.totalAmount
                            )}

                          </strong>

                        </td>

                        {/* ACTION */}

                        <td>

                          <div className="invoice-actions">

                            <button
                              type="button"
                              className="invoice-action view"
                              title="View Invoice"
                              onClick={() =>
                                setSelectedInvoice(
                                  order
                                )
                              }
                            >

                              <FaEye />

                            </button>

                            <button
                              type="button"
                              className="invoice-action download"
                              title="Download Invoice"
                              onClick={() =>
                                handleDownload(
                                  order
                                )
                              }
                            >

                              <FaDownload />

                            </button>

                          </div>

                        </td>

                      </motion.tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* =================================================
                MOBILE CARDS
            ================================================= */}

            <div className="invoice-mobile-list">

              {invoices.map(
                (order) => (

                  <motion.div
                    className="invoice-mobile-card"
                    key={
                      order?._id ||
                      order?.id
                    }
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >

                    <div className="mobile-invoice-top">

                      <div className="invoice-number">

                        <div className="invoice-mini-icon">

                          <FaFileInvoiceDollar />

                        </div>

                        <div>

                          <strong>

                            {order?.orderNumber ||
                              "Invoice"}

                          </strong>

                          <small>

                            {formatDate(
                              order?.createdAt
                            )}

                          </small>

                        </div>

                      </div>

                      <span
                        className={`invoice-status ${getStatusClass(
                          order?.paymentStatus
                        )}`}
                      >

                        {getStatusIcon(
                          order?.paymentStatus
                        )}

                        {String(
                          order?.paymentStatus ||
                            "Pending"
                        )
                          .replace(
                            /_/g,
                            " "
                          )
                          .replace(
                            /\b\w/g,
                            (letter) =>
                              letter.toUpperCase()
                          )}

                      </span>

                    </div>

                    <div className="mobile-invoice-details">

                      <div>

                        <span>
                          Items
                        </span>

                        <strong>
                          {order?.items
                            ?.length ||
                            0}
                        </strong>

                      </div>

                      <div>

                        <span>
                          Payment
                        </span>

                        <strong>
                          {getPaymentLabel(
                            order?.paymentMethod
                          )}
                        </strong>

                      </div>

                      <div>

                        <span>
                          Total
                        </span>

                        <strong>
                          {formatCurrency(
                            order?.totalAmount
                          )}
                        </strong>

                      </div>

                    </div>

                    <div className="mobile-invoice-actions">

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedInvoice(
                            order
                          )
                        }
                      >

                        <FaEye />

                        View Invoice

                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(
                            order
                          )
                        }
                      >

                        <FaDownload />

                        Download

                      </button>

                    </div>

                  </motion.div>

                )
              )}

            </div>

          </>

        )}

      </div>

      {/* =================================================
          INVOICE MODAL
      ================================================= */}

      <AnimatePresence>

        {selectedInvoice && (

          <motion.div
            className="invoice-modal-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() =>
              setSelectedInvoice(
                null
              )
            }
          >

            <motion.div
              className="invoice-modal"
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="invoice-modal-header">

                <div>

                  <span>
                    INVOICE
                  </span>

                  <h2>

                    {selectedInvoice?.orderNumber ||
                      "Invoice"}

                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedInvoice(
                      null
                    )
                  }
                >

                  <FaTimes />

                </button>

              </div>

              {/* META */}

              <div className="invoice-modal-meta">

                <div>

                  <FaCalendarAlt />

                  <div>

                    <span>
                      Date
                    </span>

                    <strong>

                      {formatDate(
                        selectedInvoice?.createdAt
                      )}

                    </strong>

                  </div>

                </div>

                <div>

                  <FaCreditCard />

                  <div>

                    <span>
                      Payment
                    </span>

                    <strong>

                      {getPaymentLabel(
                        selectedInvoice?.paymentMethod
                      )}

                    </strong>

                  </div>

                </div>

                <div>

                  <FaCheckCircle />

                  <div>

                    <span>
                      Status
                    </span>

                    <strong>

                      {String(
                        selectedInvoice?.paymentStatus ||
                          "Pending"
                      )
                        .replace(
                          /_/g,
                          " "
                        )
                        .replace(
                          /\b\w/g,
                          (letter) =>
                            letter.toUpperCase()
                        )}

                    </strong>

                  </div>

                </div>

              </div>

              {/* ITEMS */}

              <div className="invoice-modal-items">

                <h3>
                  Order Items
                </h3>

                {selectedInvoice?.items?.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="invoice-item"
                      key={`${item?.product?._id || item?.product || index}-${index}`}
                    >

                      <div>

                        <strong>
                          {item?.name ||
                            item?.product?.name ||
                            "Ice Cream Item"}
                        </strong>

                        <span>
                          Qty:{" "}
                          {item?.quantity ||
                            1}
                        </span>

                      </div>

                      <strong>

                        {formatCurrency(
                          getItemTotal(
                            item
                          )
                        )}

                      </strong>

                    </div>

                  )
                )}

              </div>

              {/* TOTAL */}

              <div className="invoice-modal-total">

                <span>
                  Total Amount
                </span>

                <strong>

                  {formatCurrency(
                    selectedInvoice?.totalAmount
                  )}

                </strong>

              </div>

              {/* FOOTER */}

              <div className="invoice-modal-footer">

                <button
                  type="button"
                  className="modal-download"
                  onClick={() =>
                    handleDownload(
                      selectedInvoice
                    )
                  }
                >

                  <FaDownload />

                  Download Invoice

                </button>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setSelectedInvoice(
                      null
                    )
                  }
                >

                  Close

                </button>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
};

export default Invoices;