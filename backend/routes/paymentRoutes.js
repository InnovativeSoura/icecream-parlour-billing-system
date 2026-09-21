import express from "express";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordManualPayment,
  getPaymentByOrder,
  getPayments,
  razorpayWebhook,
} from "../controllers/paymentController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/webhook", razorpayWebhook);

router.post(
  "/razorpay/create-order",
  protect,
  authorize("admin", "staff", "customer"),
  createRazorpayOrder,
);

router.post(
  "/razorpay/verify",
  protect,
  authorize("admin", "staff", "customer"),
  verifyRazorpayPayment,
);

router.post(
  "/manual",
  protect,
  authorize("admin", "staff"),
  recordManualPayment,
);

router.get(
  "/order/:orderId",
  protect,
  authorize("admin", "staff", "customer"),
  getPaymentByOrder,
);

router.get("/", protect, authorize("admin", "staff"), getPayments);

export default router;
