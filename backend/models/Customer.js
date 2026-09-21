import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      default: null,
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must contain at least 2 characters"],
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
      default: null,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
      default: "",
    },

    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
      default: "",
    },

    customerType: {
      type: String,
      enum: ["registered", "walk-in"],
      default: "walk-in",
      index: true,
    },

    totalOrders: {
      type: Number,
      default: 0,
      min: [0, "Total orders cannot be negative"],
    },

    totalSpent: {
      type: Number,
      default: 0,
      min: [0, "Total spending cannot be negative"],
    },

    lastOrderAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

customerSchema.index({
  name: "text",
  phone: "text",
  email: "text",
});

customerSchema.index({
  createdAt: -1,
});

customerSchema.index({
  lastOrderAt: -1,
});

customerSchema.pre("validate", function (next) {
  if (this.user) {
    this.customerType = "registered";
  }

  if (typeof this.phone === "string" && this.phone.trim() === "") {
    this.phone = null;
  }

  next();
});

customerSchema.pre("save", function (next) {
  if (this.totalOrders < 0) {
    this.totalOrders = 0;
  }

  if (this.totalSpent < 0) {
    this.totalSpent = 0;
  }

  next();
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
