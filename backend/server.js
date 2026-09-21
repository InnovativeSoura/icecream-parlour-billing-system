import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";

import { razorpayWebhook } from "./controllers/paymentController.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

connectDB();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(compression());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
  process.env.Customer_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`🚫 CORS blocked origin: ${origin}`);

      return callback(new Error(`CORS policy blocked origin: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
    limit: "2mb",
  }),
  razorpayWebhook,
);

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,

    message: "IceCream Billing API is running",

    environment: process.env.NODE_ENV || "development",

    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,

    message: "🍦 IceCream Billing API is running",

    version: "1.0.0",

    environment: process.env.NODE_ENV || "development",

    health: "/api/health",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/products", productRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/staff", staffRoutes);

app.use("/api/payments", paymentRoutes);

app.use(notFound);

app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🍦 IceCream Billing API running on port ${PORT}`);

  console.log("🌐 Allowed CORS origins:", allowedOrigins);

  console.log("💳 Razorpay webhook:", "/api/payments/webhook");

  console.log("🏥 Health check:", "/api/health");
});
