import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1]?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = String(req.user.role || "")
      .trim()
      .toLowerCase();

    const allowedRoles = roles.map((role) => String(role).trim().toLowerCase());

    if (!userRole) {
      console.error("Authorization failed: user has no role", {
        userId: req.user._id?.toString(),
      });

      return res.status(403).json({
        success: false,
        message: "Your account does not have a valid role",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      console.error("Authorization failed:", {
        userId: req.user._id?.toString(),
        userRole,
        allowedRoles,
      });

      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action. Required role: ${allowedRoles.join(", ")}. Your role: ${userRole}.`,
      });
    }

    req.user.role = userRole;

    next();
  };
};
