import express from "express";

import {
  createOrder,
  createCustomerOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
} from "../controllers/orderController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-orders", protect, authorize("customer"), getMyOrders);

router.post("/customer", protect, authorize("customer"), createCustomerOrder);

router.get(
  "/stats/summary",
  protect,
  authorize("admin", "staff"),
  getOrderStats,
);

router.get("/", protect, authorize("admin", "staff"), getOrders);

router.post("/", protect, authorize("admin", "staff"), createOrder);

router.get(
  "/:id",
  protect,
  authorize("admin", "staff", "customer"),
  getOrderById,
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  updateOrderStatus,
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "staff", "customer"),
  cancelOrder,
);

export default router;
