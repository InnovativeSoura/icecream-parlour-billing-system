import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    gateway: {
      type: String,
      enum: ["razorpay", "cash", "upi", "card", "other"],
      required: [true, "Payment gateway is required"],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
      maxlength: 3,
    },

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "created",
      index: true,
    },

    razorpayOrderId: {
      type: String,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
    },

    razorpaySignature: {
      type: String,
      trim: true,
      default: null,
    },

    receipt: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    gatewayAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    gatewayCurrency: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
      maxlength: 3,
    },

    failureReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    failureCode: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    paidAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    webhookReceivedAt: {
      type: Date,
      default: null,
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastRefundAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({
  order: 1,
  createdAt: -1,
});

paymentSchema.index({
  status: 1,
  createdAt: -1,
});

paymentSchema.index({
  gateway: 1,
  status: 1,
  createdAt: -1,
});

paymentSchema.index(
  { razorpayOrderId: 1 },
  {
    name: "razorpayOrderId_unique",
    unique: true,
    partialFilterExpression: {
      razorpayOrderId: {
        $type: "string",
      },
    },
  },
);

paymentSchema.index(
  { razorpayPaymentId: 1 },
  {
    name: "razorpayPaymentId_unique",
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: {
        $type: "string",
      },
    },
  },
);

paymentSchema.pre("validate", function (next) {
  if (this.amount !== undefined && this.amount !== null) {
    this.amount = Math.round(Number(this.amount) * 100) / 100;
  }

  if (this.refundedAmount !== undefined && this.refundedAmount !== null) {
    this.refundedAmount = Math.round(Number(this.refundedAmount) * 100) / 100;
  }

  next();
});

paymentSchema.methods.isSuccessful = function () {
  return this.status === "paid";
};

paymentSchema.methods.isRefunded = function () {
  return this.status === "refunded" || this.status === "partially_refunded";
};

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
