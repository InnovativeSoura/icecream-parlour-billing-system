import express from "express";

import {
  getStaffDashboard,
  getStaffSalesSummary,
  getStaffRecentOrders,
  getStaffMySales,
  getStaffProfile,
} from "../controllers/staffController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("staff"));

router.get("/profile", getStaffProfile);

router.get("/dashboard", getStaffDashboard);

router.get("/sales-summary", getStaffSalesSummary);

router.get("/recent-orders", getStaffRecentOrders);

router.get("/my-sales", getStaffMySales);

export default router;
