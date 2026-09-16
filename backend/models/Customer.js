import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    /*
     * Optional link to the registered User account.
     *
     * Registered customer:
     * User -> Customer
     *
     * Walk-in customer:
     * Customer only
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      default: null,
    },

    /*
     * Customer name.
     */
    name: {
      type: String,
      required: [
        true,
        "Customer name is required",
      ],
      trim: true,
      minlength: [
        2,
        "Customer name must contain at least 2 characters",
      ],
      maxlength: [
        100,
        "Customer name cannot exceed 100 characters",
      ],
    },

    /*
     * Phone is optional.
     *
     * IMPORTANT:
     * Do NOT make this field unique.
     */
    phone: {
      type: String,
      trim: true,
      maxlength: [
        20,
        "Phone number cannot exceed 20 characters",
      ],
      default: null,
    },

    /*
     * Email.
     */
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: [
        150,
        "Email cannot exceed 150 characters",
      ],
      default: "",
    },

    /*
     * Address.
     */
    address: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Address cannot exceed 500 characters",
      ],
      default: "",
    },

    /*
     * Customer type.
     */
    customerType: {
      type: String,
      enum: [
        "registered",
        "walk-in",
      ],
      default: "walk-in",
      index: true,
    },

    /*
     * Denormalized order statistics.
     */
    totalOrders: {
      type: Number,
      default: 0,
      min: [
        0,
        "Total orders cannot be negative",
      ],
    },

    totalSpent: {
      type: Number,
      default: 0,
      min: [
        0,
        "Total spending cannot be negative",
      ],
    },

    /*
     * Last order date.
     */
    lastOrderAt: {
      type: Date,
      default: null,
    },

    /*
     * Internal notes.
     */
    notes: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Notes cannot exceed 1000 characters",
      ],
      default: "",
    },

    /*
     * Customer account status.
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Search Index
|--------------------------------------------------------------------------
*/

customerSchema.index({
  name: "text",
  phone: "text",
  email: "text",
});

/*
|--------------------------------------------------------------------------
| Created At Index
|--------------------------------------------------------------------------
*/

customerSchema.index({
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Last Order Index
|--------------------------------------------------------------------------
*/

customerSchema.index({
  lastOrderAt: -1,
});

/*
|--------------------------------------------------------------------------
| Normalize Customer Type
|--------------------------------------------------------------------------
*/

customerSchema.pre(
  "validate",
  function (next) {
    if (this.user) {
      this.customerType =
        "registered";
    }

    /*
     * Convert empty phone strings to null.
     */
    if (
      typeof this.phone === "string" &&
      this.phone.trim() === ""
    ) {
      this.phone = null;
    }

    next();
  }
);

/*
|--------------------------------------------------------------------------
| Protect Statistics
|--------------------------------------------------------------------------
*/

customerSchema.pre(
  "save",
  function (next) {
    if (this.totalOrders < 0) {
      this.totalOrders = 0;
    }

    if (this.totalSpent < 0) {
      this.totalSpent = 0;
    }

    next();
  }
);

const Customer =
  mongoose.model(
    "Customer",
    customerSchema
  );

export default Customer;