import crypto from "crypto";
import Razorpay from "razorpay";

import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

import { settlePaidOrder } from "../services/orderSettlementService.js";

const ensureRazorpayConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay configuration is missing");
  }
};

const getRazorpayClient = () => {
  ensureRazorpayConfig();

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const safeCompare = (received, expected) => {
  if (!received || !expected) {
    return false;
  }

  const receivedBuffer = Buffer.from(received, "utf8");

  const expectedBuffer = Buffer.from(expected, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const generatePaymentSignature = (razorpayOrderId, razorpayPaymentId) => {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
};

const generateWebhookSignature = (rawBody) => {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
};

const isValidObjectId = (value) => {
  return /^[a-f\d]{24}$/i.test(String(value || ""));
};

const amountToPaise = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }

  return Math.round(numericAmount * 100);
};

const getAuthenticatedCustomer = async (req) => {
  if (!req.user?._id) {
    return null;
  }

  const customer = await Customer.findOne({
    user: req.user._id,
  });

  return customer;
};

const verifyCustomerOrderOwnership = async (req, order) => {
  if (req.user?.role !== "customer") {
    return {
      allowed: true,
      customer: null,
    };
  }

  const customer = await getAuthenticatedCustomer(req);

  if (!customer) {
    return {
      allowed: false,
      customer: null,
      message: "Customer profile not found for this account",
    };
  }

  if (!order.customer) {
    return {
      allowed: false,
      customer,
      message: "This order is not associated with a customer account",
    };
  }

  if (order.customer.toString() !== customer._id.toString()) {
    return {
      allowed: false,
      customer,
      message: "You are not authorized to pay for this order",
    };
  }

  if (!customer.user || customer.user.toString() !== req.user._id.toString()) {
    return {
      allowed: false,
      customer,
      message: "Customer account ownership could not be verified",
    };
  }

  return {
    allowed: true,
    customer,
  };
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const razorpay = getRazorpayClient();

    const { orderId } = req.body || {};

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const ownership = await verifyCustomerOrderOwnership(req, order);

    if (!ownership.allowed) {
      console.warn("Razorpay order ownership rejected:", {
        orderId: order._id.toString(),
        orderCustomer: order.customer ? order.customer.toString() : null,
        authenticatedUser: req.user?._id ? req.user._id.toString() : null,
        authenticatedRole: req.user?.role || null,
        customerProfile: ownership.customer?._id
          ? ownership.customer._id.toString()
          : null,
      });

      return res.status(403).json({
        success: false,
        message:
          ownership.message || "You are not authorized to pay for this order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid",
      });
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be created for this order",
      });
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot create payment for an empty order",
      });
    }

    const amount = Number(order.totalAmount);

    const amountInPaise = amountToPaise(amount);

    if (!amountInPaise) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const receipt = `rcpt_${order.orderNumber}_${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,

      currency: "INR",

      receipt,

      notes: {
        internalOrderId: order._id.toString(),

        orderNumber: order.orderNumber,
      },
    });

    const payment = await Payment.create({
      order: order._id,

      user: req.user._id,

      customer: order.customer || null,

      gateway: "razorpay",

      amount,

      currency: "INR",

      status: "created",

      razorpayOrderId: razorpayOrder.id,

      receipt,

      metadata: {
        orderNumber: order.orderNumber,

        createdBy: req.user._id.toString(),
      },
    });

    order.paymentMethod = "razorpay";

    order.paymentStatus = "pending";

    order.paymentOrderId = razorpayOrder.id;

    await order.save();

    return res.status(201).json({
      success: true,

      message: "Razorpay order created successfully",

      data: {
        paymentId: payment._id,

        orderId: order._id,

        orderNumber: order.orderNumber,

        razorpayOrderId: razorpayOrder.id,

        keyId: process.env.RAZORPAY_KEY_ID,

        amount: amountInPaise,

        currency: "INR",

        customer: {
          name:
            order.customerSnapshot?.name ||
            ownership.customer?.name ||
            req.user.name ||
            "",

          email:
            order.customerSnapshot?.email ||
            ownership.customer?.email ||
            req.user.email ||
            "",

          phone:
            order.customerSnapshot?.phone ||
            ownership.customer?.phone ||
            req.user.phone ||
            "",
        },
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const razorpay = getRazorpayClient();

    const {
      orderId,
      paymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (
      !orderId ||
      !paymentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete Razorpay payment verification data",
      });
    }

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!isValidObjectId(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (!payment.order || payment.order.toString() !== orderId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Payment does not belong to this order",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const ownership = await verifyCustomerOrderOwnership(req, order);

    if (!ownership.allowed) {
      return res.status(403).json({
        success: false,
        message:
          ownership.message || "You are not authorized to verify this order",
      });
    }

    if (payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID mismatch",
      });
    }

    const existingPayment = await Payment.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (
      existingPayment &&
      existingPayment._id.toString() !== payment._id.toString()
    ) {
      return res.status(409).json({
        success: false,
        message: "This Razorpay payment has already been processed",
      });
    }

    const expectedSignature = generatePaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
    );

    const signatureValid = safeCompare(razorpay_signature, expectedSignature);

    if (!signatureValid) {
      await Payment.findByIdAndUpdate(payment._id, {
        $set: {
          status: "failed",

          razorpayPaymentId: razorpay_payment_id,

          razorpaySignature: razorpay_signature,

          failureReason: "Invalid Razorpay signature",
        },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,

        message: "Payment was already processed",

        data: {
          orderId: order._id,

          orderNumber: order.orderNumber,

          paymentStatus: "paid",
        },
      });
    }

    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (razorpayPayment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment/order mismatch",
      });
    }

    if (String(razorpayPayment.currency).toUpperCase() !== "INR") {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment currency mismatch",
      });
    }

    const expectedAmount = amountToPaise(order.totalAmount);

    if (!expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    if (Number(razorpayPayment.amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment amount mismatch",
      });
    }

    if (razorpayPayment.status !== "captured") {
      await Payment.findByIdAndUpdate(payment._id, {
        $set: {
          status: "failed",

          razorpayPaymentId: razorpay_payment_id,

          razorpaySignature: razorpay_signature,

          gatewayAmount: razorpayPayment.amount,

          gatewayCurrency: razorpayPayment.currency,

          gatewayResponse: razorpayPayment,

          failureReason: `Razorpay payment status: ${razorpayPayment.status}`,
        },
      });

      return res.status(400).json({
        success: false,
        message: `Payment is not successful. Current status: ${razorpayPayment.status}`,
      });
    }

    const result = await settlePaidOrder({
      orderId: order._id.toString(),

      paymentId: payment._id.toString(),

      razorpayPaymentId: razorpay_payment_id,

      razorpaySignature: razorpay_signature,

      gatewayAmount: razorpayPayment.amount,

      gatewayCurrency: razorpayPayment.currency,

      gatewayResponse: razorpayPayment,
    });

    return res.status(200).json({
      success: true,

      message: result.alreadySettled
        ? "Payment was already settled"
        : "Payment verified and order settled successfully",

      data: {
        order: result.order,

        payment: result.payment,
      },
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);

    next(error);
  }
};

export const recordManualPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, reference } = req.body || {};

    const allowedMethods = ["cash", "upi", "card", "other"];

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manual payment method",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid",
      });
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be recorded for this order",
      });
    }

    const amount = Number(order.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const payment = await Payment.create({
      order: order._id,

      user: req.user._id,

      customer: order.customer || null,

      gateway: paymentMethod,

      amount,

      currency: "INR",

      status: "created",

      metadata: {
        reference: reference || "",

        recordedBy: req.user._id.toString(),
      },
    });

    const result = await settlePaidOrder({
      orderId: order._id.toString(),

      paymentId: payment._id.toString(),

      gatewayAmount: amountToPaise(amount),

      gatewayCurrency: "INR",

      gatewayResponse: {
        method: paymentMethod,

        reference: reference || null,
      },
    });

    return res.status(201).json({
      success: true,

      message: "Manual payment recorded successfully",

      data: {
        order: result.order,

        payment: result.payment,
      },
    });
  } catch (error) {
    console.error("Record manual payment error:", error);

    next(error);
  }
};

export const getPaymentByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const ownership = await verifyCustomerOrderOwnership(req, order);

    if (!ownership.allowed) {
      return res.status(403).json({
        success: false,
        message:
          ownership.message || "You are not authorized to view these payments",
      });
    }

    const payments = await Payment.find({
      order: orderId,
    })
      .populate("user", "name email role")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      count: payments.length,

      data: payments,
    });
  } catch (error) {
    console.error("Get payment by order error:", error);

    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const { status, gateway, page = 1, limit = 20, search = "" } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (gateway) {
      filter.gateway = gateway;
    }

    if (typeof search === "string" && search.trim()) {
      const searchValue = search.trim();

      filter.$or = [
        {
          razorpayOrderId: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          razorpayPaymentId: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          receipt: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }

    const skip = (currentPage - 1) * perPage;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("order", "orderNumber totalAmount paymentStatus status")
        .populate("customer", "name phone email")
        .populate("user", "name email role")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage),

      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      data: payments,

      pagination: {
        page: currentPage,

        limit: perPage,

        total,

        pages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get payments error:", error);

    next(error);
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Webhook configuration is missing",
      });
    }

    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay webhook signature",
      });
    }

    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).json({
        success: false,
        message: "Webhook body must be received as raw data",
      });
    }

    const expectedSignature = generateWebhookSignature(rawBody);

    if (!safeCompare(signature, expectedSignature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay webhook signature",
      });
    }

    let event;

    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch (parseError) {
      console.error("Razorpay webhook JSON parse error:", parseError);

      return res.status(400).json({
        success: false,
        message: "Invalid webhook payload",
      });
    }

    const eventType = event.event;

    console.log(`Razorpay webhook received: ${eventType}`);

    if (eventType === "payment.captured") {
      const razorpayPayment = event.payload?.payment?.entity;

      if (!razorpayPayment) {
        return res.status(200).json({
          success: true,
          message: "Webhook received without payment entity",
        });
      }

      const razorpayOrderId = razorpayPayment.order_id;

      if (!razorpayOrderId) {
        return res.status(200).json({
          success: true,
          message: "Webhook payment has no order ID",
        });
      }

      const payment = await Payment.findOne({
        razorpayOrderId,
      });

      if (!payment) {
        console.warn(
          `Payment record not found for Razorpay order ${razorpayOrderId}`,
        );

        return res.status(200).json({
          success: true,
          message: "Payment record not found; webhook acknowledged",
        });
      }

      if (payment.status === "paid") {
        await Payment.findByIdAndUpdate(payment._id, {
          $set: {
            webhookReceivedAt: new Date(),
          },
        });

        return res.status(200).json({
          success: true,
          message: "Webhook already processed",
        });
      }

      const order = await Order.findById(payment.order);

      if (!order) {
        console.warn(`Order not found for payment ${payment._id}`);

        return res.status(200).json({
          success: true,
          message: "Order not found; webhook acknowledged",
        });
      }

      const expectedAmount = amountToPaise(order.totalAmount);

      if (
        !expectedAmount ||
        Number(razorpayPayment.amount) !== expectedAmount
      ) {
        console.error(`Webhook amount mismatch for payment ${payment._id}`);

        await Payment.findByIdAndUpdate(payment._id, {
          $set: {
            status: "failed",

            failureReason: "Webhook payment amount mismatch",

            gatewayAmount: razorpayPayment.amount,

            gatewayCurrency: razorpayPayment.currency,

            gatewayResponse: razorpayPayment,

            webhookReceivedAt: new Date(),
          },
        });

        return res.status(200).json({
          success: true,
          message: "Webhook acknowledged despite amount mismatch",
        });
      }

      if (String(razorpayPayment.currency).toUpperCase() !== "INR") {
        await Payment.findByIdAndUpdate(payment._id, {
          $set: {
            status: "failed",

            failureReason: "Webhook currency mismatch",

            gatewayAmount: razorpayPayment.amount,

            gatewayCurrency: razorpayPayment.currency,

            gatewayResponse: razorpayPayment,

            webhookReceivedAt: new Date(),
          },
        });

        return res.status(200).json({
          success: true,
          message: "Webhook acknowledged despite currency mismatch",
        });
      }

      if (razorpayPayment.status !== "captured") {
        return res.status(200).json({
          success: true,
          message: `Webhook acknowledged with payment status ${razorpayPayment.status}`,
        });
      }

      const result = await settlePaidOrder({
        orderId: payment.order.toString(),

        paymentId: payment._id.toString(),

        razorpayPaymentId: razorpayPayment.id,

        gatewayAmount: razorpayPayment.amount,

        gatewayCurrency: razorpayPayment.currency,

        gatewayResponse: razorpayPayment,
      });

      await Payment.findByIdAndUpdate(payment._id, {
        $set: {
          webhookReceivedAt: new Date(),
        },
      });

      console.log(`Payment settled through webhook: ${payment._id}`);

      return res.status(200).json({
        success: true,

        message: result.alreadySettled
          ? "Payment already settled"
          : "Payment settled successfully",
      });
    }

    if (eventType === "payment.failed") {
      const razorpayPayment = event.payload?.payment?.entity;

      if (!razorpayPayment) {
        return res.status(200).json({
          success: true,
        });
      }

      const payment = await Payment.findOne({
        razorpayOrderId: razorpayPayment.order_id,
      });

      if (payment) {
        if (payment.status !== "paid") {
          await Payment.findByIdAndUpdate(payment._id, {
            $set: {
              status: "failed",

              razorpayPaymentId: razorpayPayment.id || null,

              gatewayAmount: razorpayPayment.amount || null,

              gatewayCurrency: razorpayPayment.currency || "INR",

              failureReason:
                razorpayPayment.error_description || "Razorpay payment failed",

              failureCode: razorpayPayment.error_code || "",

              gatewayResponse: razorpayPayment,

              webhookReceivedAt: new Date(),
            },
          });

          await Order.findByIdAndUpdate(payment.order, {
            $set: {
              paymentStatus: "failed",
            },
          });
        } else {
          await Payment.findByIdAndUpdate(payment._id, {
            $set: {
              webhookReceivedAt: new Date(),
            },
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Payment failure webhook processed",
      });
    }

    if (eventType === "order.paid") {
      const razorpayOrder = event.payload?.order?.entity;

      if (!razorpayOrder) {
        return res.status(200).json({
          success: true,
        });
      }

      const payment = await Payment.findOne({
        razorpayOrderId: razorpayOrder.id,
      });

      if (payment) {
        await Payment.findByIdAndUpdate(payment._id, {
          $set: {
            webhookReceivedAt: new Date(),
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Order paid webhook acknowledged",
      });
    }

    if (eventType === "refund.created" || eventType === "refund.processed") {
      console.log(`Razorpay refund event received: ${eventType}`);

      return res.status(200).json({
        success: true,
        message: "Refund webhook acknowledged",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Webhook received and acknowledged",
    });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
