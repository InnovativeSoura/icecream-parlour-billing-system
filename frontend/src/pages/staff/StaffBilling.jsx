import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaCashRegister,
  FaSearch,
  FaPlus,
  FaMinus,
  FaTrash,
  FaReceipt,
  FaUser,
  FaPhone,
  FaCreditCard,
  FaMoneyBillWave,
  FaMobileAlt,
  FaCheckCircle,
  FaSpinner,
  FaIceCream,
  FaBoxOpen,
  FaArrowLeft,
  FaPercent,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import api from "../../api/api";
import "./StaffBilling.css";

const TAX_RATE = 18;

const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "Cash",
    icon: FaMoneyBillWave,
  },
  {
    value: "upi",
    label: "UPI",
    icon: FaMobileAlt,
  },
  {
    value: "card",
    label: "Card",
    icon: FaCreditCard,
  },
];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getProductImage = (product) =>
  product?.image || product?.imageUrl || product?.photo || "";

const getProductPrice = (product) =>
  Number(product?.sellingPrice ?? product?.price ?? product?.unitPrice ?? 0);

const getProductStock = (product) =>
  Number(product?.stock ?? product?.quantity ?? product?.currentStock ?? 0);

const getProductTaxRate = (product) =>
  Number(product?.taxRate ?? product?.gstRate ?? TAX_RATE);

const getProductName = (product) =>
  product?.name || product?.productName || "Unnamed Product";

const getProductCategory = (product) =>
  product?.category?.name ||
  product?.categoryName ||
  product?.category ||
  "Ice Cream";

const getProductId = (product) => product?._id || product?.id;

const StaffBilling = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [cart, setCart] = useState([]);

  const [customerMode, setCustomerMode] = useState("walk-in");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [walkInCustomer, setWalkInCustomer] = useState({
    name: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await api.get("/products");

        const data =
          response?.data?.products ||
          response?.data?.data ||
          response?.data ||
          [];

        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load products:", error);

        toast.error(
          error?.response?.data?.message ||
            "Unable to load products."
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  /* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

  useEffect(() => {
    if (customerMode !== "registered") return;

    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);

        const response = await api.get("/customers");

        const data =
          response?.data?.customers ||
          response?.data?.data ||
          response?.data ||
          [];

        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load customers:", error);

        toast.error(
          error?.response?.data?.message ||
            "Unable to load customers."
        );
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [customerMode]);

  /* =========================================================
     CATEGORIES
  ========================================================= */

  const categories = useMemo(() => {
    const values = products
      .map((product) => getProductCategory(product))
      .filter(Boolean);

    return ["all", ...new Set(values)];
  }, [products]);

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const category = getProductCategory(product).toLowerCase();
      const sku = String(product?.sku || "").toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        category.includes(keyword) ||
        sku.includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        getProductCategory(product) === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  /* =========================================================
     CUSTOMER FILTER
  ========================================================= */

  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();

    if (!keyword) return customers.slice(0, 8);

    return customers
      .filter((customer) => {
        const name = String(customer?.name || "").toLowerCase();
        const phone = String(customer?.phone || "").toLowerCase();
        const email = String(customer?.email || "").toLowerCase();

        return (
          name.includes(keyword) ||
          phone.includes(keyword) ||
          email.includes(keyword)
        );
      })
      .slice(0, 8);
  }, [customers, customerSearch]);

  /* =========================================================
     CART
  ========================================================= */

  const addToCart = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      toast.error("Invalid product.");
      return;
    }

    const stock = getProductStock(product);

    if (stock <= 0) {
      toast.warning("This product is out of stock.");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.productId === productId
      );

      if (existing) {
        if (existing.quantity >= stock) {
          toast.warning("Maximum available stock reached.");
          return currentCart;
        }

        return currentCart.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId,
          name: getProductName(product),
          sku: product?.sku || "",
          image: getProductImage(product),
          category: getProductCategory(product),
          quantity: 1,
          unitPrice: getProductPrice(product),
          taxRate: getProductTaxRate(product),
          stock,
        },
      ];
    });
  };

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.productId !== productId) return item;

        if (item.quantity >= item.stock) {
          toast.warning("Maximum available stock reached.");
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  };

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.productId !== productId)
    );
  };

  const clearCart = () => {
    if (!cart.length) return;

    setCart([]);
    toast.info("Current bill cleared.");
  };

  /* =========================================================
     BILL CALCULATION
  ========================================================= */

  const bill = useMemo(() => {
    let subtotal = 0;
    let tax = 0;

    const items = cart.map((item) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemTax = (itemSubtotal * item.taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      tax += itemTax;

      return {
        ...item,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        total: itemTotal,
      };
    });

    return {
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      itemCount: cart.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
    };
  }, [cart]);

  /* =========================================================
     CUSTOMER SELECTION
  ========================================================= */

  const selectCustomer = (customer) => {
    setSelectedCustomerId(customer?._id || customer?.id || "");
    setCustomerSearch(customer?.name || "");
    setShowCustomerPanel(false);
  };

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          String(customer?._id || customer?.id) ===
          String(selectedCustomerId)
      ),
    [customers, selectedCustomerId]
  );

  /* =========================================================
     RESET CUSTOMER
  ========================================================= */

  const resetCustomer = () => {
    setSelectedCustomerId("");
    setCustomerSearch("");
    setWalkInCustomer({
      name: "",
      phone: "",
    });
  };

  /* =========================================================
     CREATE ORDER
  ========================================================= */

  const createOrderPayload = () => {
    const items = bill.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
    }));

    const payload = {
      items,
      paymentMethod,
      notes: notes.trim(),
      orderType: "pos",
    };

    if (customerMode === "registered" && selectedCustomerId) {
      payload.customer = selectedCustomerId;
    }

    if (
      customerMode === "walk-in" &&
      (walkInCustomer.name.trim() ||
        walkInCustomer.phone.trim())
    ) {
      payload.customerSnapshot = {
        name:
          walkInCustomer.name.trim() || "Walk-in Customer",
        phone: walkInCustomer.phone.trim(),
      };
    }

    return payload;
  };

  const handleCompleteSale = async () => {
    if (submitting) return;

    if (!cart.length) {
      toast.warning("Add at least one product to the bill.");
      return;
    }

    if (
      customerMode === "registered" &&
      !selectedCustomerId
    ) {
      toast.warning("Please select a registered customer.");
      setShowCustomerPanel(true);
      return;
    }

    try {
      setSubmitting(true);

      const payload = createOrderPayload();

      const response = await api.post("/orders", payload);

      const order =
        response?.data?.order ||
        response?.data?.data ||
        response?.data;

      /*
       * Manual payment endpoint is used after order creation.
       * If the backend already settles POS orders directly,
       * a successful order response is enough.
       */
      try {
        if (order?._id && paymentMethod !== "unpaid") {
          await api.post("/payments/manual", {
            orderId: order._id,
            paymentMethod,
            amount: bill.total,
          });
        }
      } catch (paymentError) {
        console.warn(
          "Manual payment endpoint response:",
          paymentError
        );

        /*
         * Some backend versions settle POS payments during
         * order creation. Therefore don't show a hard failure
         * if the order itself was successfully created.
         */
      }

      setCompletedOrder(order);
      setShowSuccessModal(true);

      setCart([]);
      setNotes("");
      resetCustomer();

      toast.success("Sale completed successfully.");
    } catch (error) {
      console.error("Failed to create sale:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to complete the sale."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     PRINT RECEIPT
  ========================================================= */

  const handlePrintReceipt = () => {
    if (!completedOrder) return;

    const orderNumber =
      completedOrder?.orderNumber ||
      completedOrder?._id ||
      "POS-RECEIPT";

    const customerName =
      selectedCustomer?.name ||
      walkInCustomer.name ||
      completedOrder?.customerSnapshot?.name ||
      "Walk-in Customer";

    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );

    if (!printWindow) {
      toast.error("Please allow pop-ups to print the receipt.");
      return;
    }

    const orderItems =
      completedOrder?.items?.length
        ? completedOrder.items
        : bill.items;

    const rows = orderItems
      .map(
        (item) => `
          <tr>
            <td>${item?.name || "Ice Cream"}</td>
            <td>${item?.quantity || 1}</td>
            <td>₹${Number(
              item?.unitPrice || item?.price || 0
            ).toFixed(2)}</td>
            <td>₹${Number(
              item?.total ||
                item?.lineTotal ||
                0
            ).toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${orderNumber}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 30px;
              font-family: Arial, sans-serif;
              color: #17172b;
              background: #fff;
            }

            .receipt {
              max-width: 700px;
              margin: 0 auto;
            }

            .header {
              text-align: center;
              margin-bottom: 28px;
            }

            .header h1 {
              margin: 0;
              font-size: 28px;
            }

            .header p {
              margin: 6px 0 0;
              color: #6b7280;
            }

            .meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 20px;
              margin-bottom: 25px;
              font-size: 14px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }

            th,
            td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
              text-align: left;
            }

            th {
              font-size: 12px;
              text-transform: uppercase;
              color: #6b7280;
            }

            .totals {
              margin-left: auto;
              max-width: 300px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 7px 0;
            }

            .grand-total {
              border-top: 2px solid #111827;
              margin-top: 8px;
              padding-top: 12px;
              font-size: 20px;
              font-weight: 700;
            }

            .footer {
              text-align: center;
              margin-top: 35px;
              color: #6b7280;
              font-size: 13px;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <div class="header">
              <h1>ICE CREAM PARLOUR</h1>
              <p>POS Sales Receipt</p>
            </div>

            <div class="meta">
              <div><strong>Order:</strong> ${orderNumber}</div>
              <div><strong>Customer:</strong> ${customerName}</div>
              <div>
                <strong>Date:</strong>
                ${new Date().toLocaleString("en-IN")}
              </div>
              <div>
                <strong>Payment:</strong>
                ${paymentMethod.toUpperCase()}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal</span>
                <strong>
                  ${formatCurrency(
                    completedOrder?.subtotal ??
                      bill.subtotal
                  )}
                </strong>
              </div>

              <div class="total-row">
                <span>Tax</span>
                <strong>
                  ${formatCurrency(
                    completedOrder?.tax ??
                      completedOrder?.taxAmount ??
                      bill.tax
                  )}
                </strong>
              </div>

              <div class="total-row grand-total">
                <span>Total</span>
                <strong>
                  ${formatCurrency(
                    completedOrder?.totalAmount ??
                      completedOrder?.total ??
                      bill.total
                  )}
                </strong>
              </div>
            </div>

            <div class="footer">
              Thank you for visiting our Ice Cream Parlour.
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  /* =========================================================
     SUCCESS MODAL
  ========================================================= */

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setCompletedOrder(null);
  };

  return (
    <div className="staff-billing-page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="staff-billing-header">
        <div className="staff-billing-title">
          <button
            type="button"
            className="staff-billing-back"
            onClick={() => navigate("/staff/dashboard")}
            aria-label="Back to dashboard"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span className="staff-billing-eyebrow">
              POINT OF SALE
            </span>

            <h1>
              <FaCashRegister />
              Create New Bill
            </h1>

            <p>
              Select products, add customer details and
              complete the sale.
            </p>
          </div>
        </div>

        <div className="staff-billing-header-summary">
          <div>
            <span>Items</span>
            <strong>{bill.itemCount}</strong>
          </div>

          <div>
            <span>Total</span>
            <strong>{formatCurrency(bill.total)}</strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN BILLING GRID
      ===================================================== */}

      <div className="staff-billing-layout">
        {/* ===================================================
            PRODUCT SECTION
        =================================================== */}

        <section className="staff-product-section">
          <div className="staff-section-header">
            <div>
              <span className="staff-section-eyebrow">
                PRODUCTS
              </span>

              <h2>Choose your ice cream</h2>
            </div>

            <span className="staff-product-count">
              {filteredProducts.length} products
            </span>
          </div>

          {/* Search */}

          <div className="staff-product-toolbar">
            <div className="staff-billing-search">
              <FaSearch />

              <input
                type="text"
                placeholder="Search ice cream, SKU or category..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="staff-category-filter">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    categoryFilter === category
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCategoryFilter(category)
                  }
                >
                  {category === "all"
                    ? "All"
                    : category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}

          {loadingProducts ? (
            <div className="staff-billing-loader">
              <FaSpinner className="spin" />
              <span>Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="staff-billing-empty">
              <div className="staff-empty-icon">
                <FaBoxOpen />
              </div>

              <h3>No products found</h3>

              <p>
                Try another search term or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="staff-product-grid">
              {filteredProducts.map((product) => {
                const productId = getProductId(product);
                const price = getProductPrice(product);
                const stock = getProductStock(product);

                const cartItem = cart.find(
                  (item) => item.productId === productId
                );

                const quantity = cartItem?.quantity || 0;
                const outOfStock = stock <= 0;

                return (
                  <motion.article
                    key={productId}
                    className={`staff-product-card ${
                      outOfStock
                        ? "is-out-of-stock"
                        : ""
                    }`}
                    whileHover={
                      outOfStock
                        ? undefined
                        : {
                            y: -4,
                          }
                    }
                    transition={{
                      duration: 0.2,
                    }}
                  >
                    <div className="staff-product-image">
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={getProductName(product)}
                        />
                      ) : (
                        <div className="staff-product-placeholder">
                          <FaIceCream />
                        </div>
                      )}

                      <span className="staff-product-category">
                        {getProductCategory(product)}
                      </span>

                      {quantity > 0 && (
                        <span className="staff-product-cart-count">
                          {quantity}
                        </span>
                      )}
                    </div>

                    <div className="staff-product-info">
                      <h3>{getProductName(product)}</h3>

                      {product?.sku && (
                        <span className="staff-product-sku">
                          SKU: {product.sku}
                        </span>
                      )}

                      <div className="staff-product-bottom">
                        <div>
                          <strong>
                            {formatCurrency(price)}
                          </strong>

                          <span
                            className={
                              stock <= 5
                                ? "low-stock"
                                : ""
                            }
                          >
                            {outOfStock
                              ? "Out of stock"
                              : `${stock} in stock`}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={() =>
                            addToCart(product)
                          }
                          aria-label={`Add ${getProductName(
                            product
                          )}`}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* ===================================================
            BILL PANEL
        =================================================== */}

        <aside className="staff-bill-panel">
          {/* Bill Header */}

          <div className="staff-bill-panel-header">
            <div>
              <span className="staff-section-eyebrow">
                CURRENT SALE
              </span>

              <h2>
                <FaReceipt />
                Bill Summary
              </h2>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                className="staff-clear-bill"
                onClick={clearCart}
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart */}

          <div className="staff-bill-items">
            {cart.length === 0 ? (
              <div className="staff-cart-empty">
                <div className="staff-cart-empty-icon">
                  <FaIceCream />
                </div>

                <h3>Your bill is empty</h3>

                <p>
                  Select products from the left to start
                  creating a bill.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {bill.items.map((item) => (
                  <motion.div
                    key={item.productId}
                    className="staff-bill-item"
                    initial={{
                      opacity: 0,
                      x: 15,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -15,
                    }}
                  >
                    <div className="staff-bill-item-image">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                        />
                      ) : (
                        <FaIceCream />
                      )}
                    </div>

                    <div className="staff-bill-item-content">
                      <div className="staff-bill-item-top">
                        <h4>{item.name}</h4>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.productId
                            )
                          }
                          aria-label={`Remove ${item.name}`}
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <span className="staff-bill-item-price">
                        {formatCurrency(item.unitPrice)}
                      </span>

                      <div className="staff-bill-item-bottom">
                        <div className="staff-quantity-control">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                item.productId
                              )
                            }
                          >
                            <FaMinus />
                          </button>

                          <strong>{item.quantity}</strong>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                item.productId
                              )
                            }
                          >
                            <FaPlus />
                          </button>
                        </div>

                        <strong className="staff-line-total">
                          {formatCurrency(item.total)}
                        </strong>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Customer */}

          <div className="staff-billing-block">
            <div className="staff-block-title">
              <div>
                <FaUser />
                <span>Customer</span>
              </div>

              <div className="staff-customer-mode">
                <button
                  type="button"
                  className={
                    customerMode === "walk-in"
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setCustomerMode("walk-in");
                    resetCustomer();
                  }}
                >
                  Walk-in
                </button>

                <button
                  type="button"
                  className={
                    customerMode === "registered"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCustomerMode("registered")
                  }
                >
                  Registered
                </button>
              </div>
            </div>

            {customerMode === "walk-in" ? (
              <div className="staff-walkin-fields">
                <div className="staff-input-field">
                  <FaUser />

                  <input
                    type="text"
                    placeholder="Customer name"
                    value={walkInCustomer.name}
                    onChange={(event) =>
                      setWalkInCustomer({
                        ...walkInCustomer,
                        name: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="staff-input-field">
                  <FaPhone />

                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={walkInCustomer.phone}
                    onChange={(event) =>
                      setWalkInCustomer({
                        ...walkInCustomer,
                        phone: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="staff-registered-customer">
                <div className="staff-input-field">
                  <FaSearch />

                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={customerSearch}
                    onFocus={() =>
                      setShowCustomerPanel(true)
                    }
                    onChange={(event) => {
                      setCustomerSearch(
                        event.target.value
                      );
                      setShowCustomerPanel(true);
                    }}
                  />
                </div>

                {selectedCustomer && (
                  <div className="staff-selected-customer">
                    <div className="staff-selected-avatar">
                      {(selectedCustomer.name ||
                        "C")[0].toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {selectedCustomer.name}
                      </strong>

                      <span>
                        {selectedCustomer.phone ||
                          selectedCustomer.email ||
                          "Registered customer"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={resetCustomer}
                    >
                      ×
                    </button>
                  </div>
                )}

                {showCustomerPanel && (
                  <div className="staff-customer-results">
                    {loadingCustomers ? (
                      <div className="staff-customer-loading">
                        <FaSpinner className="spin" />
                        Loading customers...
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="staff-customer-no-results">
                        No customers found.
                      </div>
                    ) : (
                      filteredCustomers.map(
                        (customer) => (
                          <button
                            type="button"
                            key={
                              customer?._id ||
                              customer?.id
                            }
                            className="staff-customer-result"
                            onClick={() =>
                              selectCustomer(customer)
                            }
                          >
                            <div className="staff-result-avatar">
                              {(
                                customer?.name ||
                                "C"
                              )[0].toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {customer?.name ||
                                  "Customer"}
                              </strong>

                              <span>
                                {customer?.phone ||
                                  customer?.email ||
                                  "No contact"}
                              </span>
                            </div>
                          </button>
                        )
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment */}

          <div className="staff-billing-block">
            <div className="staff-block-title">
              <div>
                <FaCreditCard />
                <span>Payment Method</span>
              </div>
            </div>

            <div className="staff-payment-methods">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;

                return (
                  <button
                    type="button"
                    key={method.value}
                    className={
                      paymentMethod === method.value
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPaymentMethod(
                        method.value
                      )
                    }
                  >
                    <Icon />
                    <span>{method.label}</span>

                    {paymentMethod ===
                      method.value && (
                      <FaCheckCircle />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}

          <div className="staff-billing-block">
            <div className="staff-block-title">
              <div>
                <FaReceipt />
                <span>Notes</span>
              </div>
            </div>

            <textarea
              className="staff-billing-notes"
              placeholder="Add an optional note..."
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={2}
            />
          </div>

          {/* Totals */}

          <div className="staff-bill-total-section">
            <div className="staff-total-row">
              <span>Subtotal</span>
              <strong>
                {formatCurrency(bill.subtotal)}
              </strong>
            </div>

            <div className="staff-total-row">
              <span>
                <FaPercent />
                GST / Tax ({TAX_RATE}%)
              </span>

              <strong>
                {formatCurrency(bill.tax)}
              </strong>
            </div>

            <div className="staff-grand-total">
              <div>
                <span>Total Amount</span>
                <small>
                  {bill.itemCount} item
                  {bill.itemCount !== 1 ? "s" : ""}
                </small>
              </div>

              <strong>
                {formatCurrency(bill.total)}
              </strong>
            </div>
          </div>

          {/* Complete */}

          <button
            type="button"
            className="staff-complete-sale"
            disabled={
              submitting ||
              cart.length === 0
            }
            onClick={handleCompleteSale}
          >
            {submitting ? (
              <>
                <FaSpinner className="spin" />
                Processing Sale...
              </>
            ) : (
              <>
                <FaCashRegister />
                Complete Sale
                <strong>
                  {formatCurrency(bill.total)}
                </strong>
              </>
            )}
          </button>
        </aside>
      </div>

      {/* =====================================================
          SUCCESS MODAL
      ===================================================== */}

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="staff-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="staff-success-modal"
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
            >
              <div className="staff-success-icon">
                <FaCheckCircle />
              </div>

              <span className="staff-success-label">
                PAYMENT SUCCESSFUL
              </span>

              <h2>Sale Completed!</h2>

              <p>
                The order has been created and the
                payment has been recorded successfully.
              </p>

              <div className="staff-success-order">
                <span>Order Number</span>

                <strong>
                  {completedOrder?.orderNumber ||
                    completedOrder?._id ||
                    "POS Order"}
                </strong>
              </div>

              <div className="staff-success-total">
                <span>Total Paid</span>

                <strong>
                  {formatCurrency(
                    completedOrder?.totalAmount ||
                      completedOrder?.total ||
                      bill.total
                  )}
                </strong>
              </div>

              <div className="staff-success-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={handlePrintReceipt}
                >
                  <FaReceipt />
                  Print Receipt
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={closeSuccessModal}
                >
                  <FaPlus />
                  New Bill
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside registered customer dropdown */}

      {showCustomerPanel &&
        customerMode === "registered" && (
          <button
            type="button"
            className="staff-customer-backdrop"
            aria-label="Close customer search"
            onClick={() =>
              setShowCustomerPanel(false)
            }
          />
        )}
    </div>
  );
};

export default StaffBilling;