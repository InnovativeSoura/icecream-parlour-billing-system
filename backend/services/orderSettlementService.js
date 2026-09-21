import mongoose from "mongoose";

import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import Customer from "../models/Customer.js";

export const settlePaidOrder = async ({
  orderId,
  paymentId,
  razorpayPaymentId = null,
  razorpaySignature = null,
  gatewayAmount = null,
  gatewayCurrency = "INR",
  gatewayResponse = null,
}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error("Invalid payment ID");
  }

  const session = await mongoose.startSession();

  try {
    let settlementResult = null;

    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);

      if (!payment) {
        throw new Error("Payment record not found");
      }

      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (payment.order.toString() !== order._id.toString()) {
        throw new Error("Payment does not belong to this order");
      }

      if (order.paymentStatus === "paid") {
        settlementResult = {
          alreadySettled: true,
          order,
          payment,
        };

        return;
      }

      const expectedAmount = Number(order.totalAmount);
      const receivedAmount =
        gatewayAmount !== null
          ? Number(gatewayAmount) / 100
          : Number(payment.amount);

      const amountDifference = Math.abs(expectedAmount - receivedAmount);

      if (amountDifference > 0.01) {
        throw new Error(
          `Payment amount mismatch. Expected ₹${expectedAmount.toFixed(
            2,
          )}, received ₹${receivedAmount.toFixed(2)}`,
        );
      }

      if (order.status === "cancelled" || order.status === "refunded") {
        throw new Error(`Cannot settle an order with status "${order.status}"`);
      }

      for (const item of order.items) {
        const quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity for product ${item.name}`);
        }

        const inventory = await Inventory.findOneAndUpdate(
          {
            product: item.product,
            currentStock: {
              $gte: quantity,
            },
          },
          {
            $inc: {
              currentStock: -quantity,
            },
            $set: {
              lastStockUpdateAt: new Date(),
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!inventory) {
          throw new Error(`Insufficient stock for "${item.name}"`);
        }

        const previousStock = inventory.currentStock + quantity;

        const newStock = inventory.currentStock;

        await StockMovement.create(
          [
            {
              product: item.product,
              inventory: inventory._id,
              type: "sale",
              quantity,
              previousStock,
              newStock,
              referenceType: "order",
              referenceId: order._id,
              reason: `Sale against order ${order.orderNumber}`,
              createdBy: order.createdBy || null,
            },
          ],
          {
            session,
          },
        );
      }

      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: {
            $ne: "paid",
          },
        },
        {
          $set: {
            paymentStatus: "paid",
            paymentMethod: payment.gateway,
            paymentId:
              razorpayPaymentId ||
              payment.razorpayPaymentId ||
              payment._id.toString(),
            paymentOrderId:
              payment.razorpayOrderId || order.paymentOrderId || null,
            paymentSignature:
              razorpaySignature || payment.razorpaySignature || null,
            status: "confirmed",
            paidAt: new Date(),
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedOrder) {
        throw new Error("Order was already settled by another payment process");
      }

      const updatedPayment = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          status: {
            $ne: "paid",
          },
        },
        {
          $set: {
            status: "paid",

            razorpayPaymentId:
              razorpayPaymentId || payment.razorpayPaymentId || null,

            razorpaySignature:
              razorpaySignature || payment.razorpaySignature || null,

            gatewayAmount:
              gatewayAmount !== null
                ? Number(gatewayAmount)
                : payment.gatewayAmount,

            gatewayCurrency:
              gatewayCurrency || payment.gatewayCurrency || "INR",

            gatewayResponse: gatewayResponse || payment.gatewayResponse || null,

            paidAt: new Date(),
            verifiedAt: new Date(),
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedPayment) {
        throw new Error("Payment was already processed by another request");
      }

      if (order.customer) {
        const updatedCustomer = await Customer.findOneAndUpdate(
          {
            _id: order.customer,
            isActive: true,
          },
          {
            $inc: {
              totalOrders: 1,
              totalSpent: Number(order.totalAmount),
            },
            $set: {
              lastOrderAt: new Date(),
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedCustomer) {
          throw new Error("Customer associated with this order was not found");
        }
      }

      settlementResult = {
        alreadySettled: false,
        order: updatedOrder,
        payment: updatedPayment,
      };
    });

    return settlementResult;
  } finally {
    await session.endSession();
  }
};
