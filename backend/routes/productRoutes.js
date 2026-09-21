import express from "express";

import {
  getProducts,
  getAvailableProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/available", getAvailableProducts);

router.get("/", protect, authorize("admin", "staff"), getProducts);

router.get("/:id", protect, authorize("admin", "staff"), getProductById);

router.post("/", protect, authorize("admin"), createProduct);

router.put("/:id", protect, authorize("admin"), updateProduct);

router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;
