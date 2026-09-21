import express from "express";

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  activateCustomer,
  getCustomerStats,
  getCustomerByPhone,
} from "../controllers/customerController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/stats/summary",
  protect,
  authorize("admin", "staff"),
  getCustomerStats,
);

router.get(
  "/phone/:phone",
  protect,
  authorize("admin", "staff"),
  getCustomerByPhone,
);

router.get("/", protect, authorize("admin", "staff"), getCustomers);

router.post("/", protect, authorize("admin", "staff"), createCustomer);

router.get("/:id", protect, authorize("admin", "staff"), getCustomerById);

router.put("/:id", protect, authorize("admin", "staff"), updateCustomer);

router.delete("/:id", protect, authorize("admin"), deleteCustomer);

router.patch("/:id/activate", protect, authorize("admin"), activateCustomer);

export default router;
