const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createInvoice,
  getInvoices,
  downloadInvoice,
} = require("../controllers/billingController");

router.post("/", auth, authorizeRoles("cashier", "admin"), createInvoice);

router.get(
  "/",
  auth,
  authorizeRoles("admin", "cashier", "accountant"),
  getInvoices,
);
router.get("/invoice/:id", auth, downloadInvoice);

module.exports = router;
