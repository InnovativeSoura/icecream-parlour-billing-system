import User from "../models/User.js";
import Customer from "../models/Customer.js";
import generateToken from "../utils/generateToken.js";

const ensureCustomerProfile = async (user) => {
  if (!user || user.role !== "customer") {
    return null;
  }

  let customer = await Customer.findOne({
    user: user._id,
  });

  if (customer) {
    return customer;
  }

  if (user.email) {
    customer = await Customer.findOne({
      email: user.email.toLowerCase(),
    });

    if (customer) {
      customer.user = user._id;
      customer.customerType = "registered";
      customer.isActive = true;

      if (!customer.name) {
        customer.name = user.name;
      }

      if (!customer.phone && user.phone) {
        customer.phone = user.phone;
      }

      await customer.save();

      console.log(`Customer profile linked to User: ${user.email}`);

      return customer;
    }
  }

  customer = await Customer.create({
    user: user._id,
    name: user.name,
    phone: user.phone?.trim() || null,
    email: user.email.toLowerCase(),
    customerType: "registered",
    isActive: true,
  });

  console.log(`Customer profile created for User: ${user.email}`);

  return customer;
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedName = name.trim();

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedPhone = phone?.trim() || null;

    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedRole = String(role || "customer")
      .trim()
      .toLowerCase();

    if (!["customer", "staff"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: normalizedRole,
    });

    if (normalizedRole === "customer") {
      try {
        await ensureCustomerProfile(user);
      } catch (customerError) {
        await User.findByIdAndDelete(user._id);

        throw customerError;
      }
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,

      message:
        normalizedRole === "staff"
          ? "Staff account created successfully"
          : "Customer account created successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      if (duplicateField === "email") {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }

      if (duplicateField === "phone") {
        return res.status(409).json({
          success: false,
          message: "This phone number is already registered",
        });
      }

      return res.status(409).json({
        success: false,
        message: "A record with the provided information already exists",
      });
    }

    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0];

      return res.status(400).json({
        success: false,
        message: firstError?.message || "Invalid registration data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLogin = new Date();

    await user.save();

    if (user.role === "customer") {
      await ensureCustomerProfile(user);
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (req.user.role === "customer") {
      await ensureCustomerProfile(req.user);
    }

    return res.status(200).json({
      success: true,

      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        avatar: req.user.avatar,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user",
    });
  }
};
