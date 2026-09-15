// backend/routes/staffRoutes.js

import express from "express";

import {
  getStaffDashboard,
  getStaffSalesSummary,
  getStaffRecentOrders,
  getStaffMySales,
  getStaffProfile,
} from "../controllers/staffController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| STAFF ACCESS
|--------------------------------------------------------------------------
|
| Every route in this file requires:
|
| 1. Valid JWT
| 2. staff role
|
|--------------------------------------------------------------------------
*/

router.use(protect);
router.use(authorize("staff"));

/*
|--------------------------------------------------------------------------
| STAFF PROFILE
|--------------------------------------------------------------------------
|
| GET /api/staff/profile
|--------------------------------------------------------------------------
*/

router.get(
  "/profile",
  getStaffProfile
);

/*
|--------------------------------------------------------------------------
| STAFF DASHBOARD
|--------------------------------------------------------------------------
|
| GET /api/staff/dashboard
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  getStaffDashboard
);

/*
|--------------------------------------------------------------------------
| STAFF SALES REPORT
|--------------------------------------------------------------------------
|
| GET /api/staff/sales-summary
|
| period:
|   today
|   7days
|   30days
|--------------------------------------------------------------------------
*/

router.get(
  "/sales-summary",
  getStaffSalesSummary
);

/*
|--------------------------------------------------------------------------
| RECENT ORDERS
|--------------------------------------------------------------------------
|
| GET /api/staff/recent-orders
|--------------------------------------------------------------------------
*/

router.get(
  "/recent-orders",
  getStaffRecentOrders
);

/*
|--------------------------------------------------------------------------
| CURRENT STAFF SALES
|--------------------------------------------------------------------------
|
| GET /api/staff/my-sales
|--------------------------------------------------------------------------
*/

router.get(
  "/my-sales",
  getStaffMySales
);

export default router;