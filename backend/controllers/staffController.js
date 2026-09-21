import mongoose from "mongoose";

import User from "../models/User.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Payment from "../models/Payment.js";

const roundMoney = (value) => {
  return Math.round((Number(value) || 0) * 100) / 100;
};

const getStartOfDay = (date = new Date()) => {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
};

const getEndOfDay = (date = new Date()) => {
  const value = new Date(date);

  value.setHours(23, 59, 59, 999);

  return value;
};

const getStartOfPreviousDay = () => {
  const date = getStartOfDay();

  date.setDate(date.getDate() - 1);

  return date;
};

const getStartOfMonth = () => {
  const date = new Date();

  date.setDate(1);
  date.setHours(0, 0, 0, 0);

  return date;
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const formatStaffOrder = (order) => {
  if (!order) {
    return null;
  }

  return {
    id: order._id,

    _id: order._id,

    orderNumber: order.orderNumber,

    customer: order.customer || null,

    customerSnapshot: order.customerSnapshot || {
      name: "Walk-in Customer",
      phone: "",
      email: "",
      address: "",
    },

    items: Array.isArray(order.items) ? order.items : [],

    subtotal: roundMoney(order.subtotal),

    discountAmount: roundMoney(order.discountAmount),

    taxAmount: roundMoney(order.taxAmount),

    totalAmount: roundMoney(order.totalAmount),

    paymentStatus: order.paymentStatus || "pending",

    paymentMethod: order.paymentMethod || "unpaid",

    status: order.status || "pending",

    orderType: order.orderType || "pos",

    notes: order.notes || "",

    createdBy: order.createdBy || null,

    paidAt: order.paidAt || null,

    completedAt: order.completedAt || null,

    cancelledAt: order.cancelledAt || null,

    createdAt: order.createdAt,

    updatedAt: order.updatedAt,
  };
};

export const getStaffProfile = async (req, res) => {
  try {
    const staff = await User.findById(req.user._id).select(
      "_id name email phone avatar role isActive lastLogin createdAt",
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff account not found",
      });
    }

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("Get staff profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load staff profile",
    });
  }
};

export const getStaffDashboard = async (req, res) => {
  try {
    const todayStart = getStartOfDay();

    const todayEnd = getEndOfDay();

    const previousDayStart = getStartOfPreviousDay();

    const previousDayEnd = new Date(todayStart.getTime() - 1);

    const todayFilter = {
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    };

    const previousDayFilter = {
      createdAt: {
        $gte: previousDayStart,
        $lte: previousDayEnd,
      },
    };

    const [
      todayOrders,
      previousDayOrders,
      totalCustomers,
      activeCustomers,
      totalProducts,
      paidToday,
      pendingToday,
      completedToday,
      cancelledToday,
      todayRevenueResult,
      previousRevenueResult,
      recentOrders,
      recentPayments,
    ] = await Promise.all([
      Order.find(todayFilter)
        .populate("customer", "name phone email customerType")
        .populate("createdBy", "name email role")
        .populate("items.product", "name image sku price unit")
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      Order.find(previousDayFilter)
        .select("totalAmount paymentStatus status")
        .lean(),

      Customer.countDocuments(),

      Customer.countDocuments({
        isActive: true,
      }),

      Product.countDocuments({
        isActive: true,
      }),

      Order.countDocuments({
        ...todayFilter,
        paymentStatus: "paid",
      }),

      Order.countDocuments({
        ...todayFilter,
        status: {
          $in: ["pending", "confirmed", "processing"],
        },
      }),

      Order.countDocuments({
        ...todayFilter,
        status: "completed",
      }),

      Order.countDocuments({
        ...todayFilter,
        status: "cancelled",
      }),

      Order.aggregate([
        {
          $match: {
            ...todayFilter,
            paymentStatus: "paid",
          },
        },

        {
          $group: {
            _id: null,

            revenue: {
              $sum: "$totalAmount",
            },

            tax: {
              $sum: "$taxAmount",
            },

            discount: {
              $sum: "$discountAmount",
            },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            ...previousDayFilter,
            paymentStatus: "paid",
          },
        },

        {
          $group: {
            _id: null,

            revenue: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),

      Order.find()
        .populate("customer", "name phone email customerType")
        .populate("createdBy", "name email role")
        .populate("items.product", "name image sku price unit")
        .sort({
          createdAt: -1,
        })
        .limit(8)
        .lean(),

      Payment.find()
        .populate("order", "orderNumber totalAmount status paymentStatus")
        .populate("customer", "name phone email")
        .sort({
          createdAt: -1,
        })
        .limit(8)
        .lean(),
    ]);

    const todayRevenue = roundMoney(todayRevenueResult[0]?.revenue || 0);

    const todayTax = roundMoney(todayRevenueResult[0]?.tax || 0);

    const todayDiscount = roundMoney(todayRevenueResult[0]?.discount || 0);

    const previousRevenue = roundMoney(previousRevenueResult[0]?.revenue || 0);

    const averageOrderValue =
      paidToday > 0 ? roundMoney(todayRevenue / paidToday) : 0;

    let revenueChange = 0;

    if (previousRevenue > 0) {
      revenueChange = roundMoney(
        ((todayRevenue - previousRevenue) / previousRevenue) * 100,
      );
    } else if (todayRevenue > 0) {
      revenueChange = 100;
    }

    const previousPaidOrders = previousDayOrders.filter(
      (order) => order.paymentStatus === "paid",
    ).length;

    let orderChange = 0;

    if (previousPaidOrders > 0) {
      orderChange = roundMoney(
        ((paidToday - previousPaidOrders) / previousPaidOrders) * 100,
      );
    } else if (paidToday > 0) {
      orderChange = 100;
    }

    const formattedRecentOrders = recentOrders.map(formatStaffOrder);

    return res.status(200).json({
      success: true,

      staff: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },

      stats: {
        todaySales: todayRevenue,

        todayRevenue,

        todayOrders: todayOrders.length,

        paidOrders: paidToday,

        pendingOrders: pendingToday,

        completedOrders: completedToday,

        cancelledOrders: cancelledToday,

        averageOrderValue,

        totalCustomers,

        activeCustomers,

        totalProducts,

        tax: todayTax,

        discount: todayDiscount,

        revenueChange,

        orderChange,
      },

      today: {
        orders: todayOrders.map(formatStaffOrder),

        revenue: todayRevenue,

        ordersCount: todayOrders.length,

        paidOrders,

        pendingOrders,
        completedOrders,
        cancelledOrders,
      },

      comparison: {
        previousRevenue,
        previousPaidOrders,
        revenueChange,
        orderChange,
      },

      recentOrders: formattedRecentOrders,

      recentPayments,
    });
  } catch (error) {
    console.error("Get staff dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load staff dashboard",
    });
  }
};

export const getStaffSalesSummary = async (req, res) => {
  try {
    const period = String(req.query.period || "today").toLowerCase();

    const now = new Date();

    let startDate;
    let previousStartDate;
    let previousEndDate;

    if (period === "7days") {
      startDate = new Date(now);

      startDate.setDate(startDate.getDate() - 6);

      startDate.setHours(0, 0, 0, 0);

      previousEndDate = new Date(startDate);

      previousEndDate.setMilliseconds(-1);

      previousStartDate = new Date(previousEndDate);

      previousStartDate.setDate(previousStartDate.getDate() - 6);

      previousStartDate.setHours(0, 0, 0, 0);
    } else if (period === "30days") {
      startDate = new Date(now);

      startDate.setDate(startDate.getDate() - 29);

      startDate.setHours(0, 0, 0, 0);

      previousEndDate = new Date(startDate);

      previousEndDate.setMilliseconds(-1);

      previousStartDate = new Date(previousEndDate);

      previousStartDate.setDate(previousStartDate.getDate() - 29);

      previousStartDate.setHours(0, 0, 0, 0);
    } else {
      startDate = getStartOfDay();

      previousEndDate = new Date(startDate);

      previousEndDate.setMilliseconds(-1);

      previousStartDate = getStartOfPreviousDay();
    }

    const currentOrders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: now,
      },
    })
      .populate("customer", "name phone email")
      .populate("createdBy", "name email role")
      .populate("items.product", "name image sku price unit")
      .sort({
        createdAt: -1,
      })
      .lean();

    const paidOrders = currentOrders.filter(
      (order) => order.paymentStatus === "paid",
    );

    const grossSales = roundMoney(
      paidOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0,
      ),
    );

    const previousOrders = await Order.find({
      createdAt: {
        $gte: previousStartDate,
        $lte: previousEndDate,
      },

      paymentStatus: "paid",
    })
      .select("totalAmount")
      .lean();

    const previousSales = roundMoney(
      previousOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0,
      ),
    );

    let salesChange = 0;

    if (previousSales > 0) {
      salesChange = roundMoney(
        ((grossSales - previousSales) / previousSales) * 100,
      );
    } else if (grossSales > 0) {
      salesChange = 100;
    }

    const paymentMethodBreakdown = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },

          paymentStatus: "paid",
        },
      },

      {
        $group: {
          _id: "$paymentMethod",

          amount: {
            $sum: "$totalAmount",
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          amount: -1,
        },
      },
    ]);

    const statusBreakdown = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },

      {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },

          paymentStatus: "paid",
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          name: {
            $first: "$items.name",
          },

          quantity: {
            $sum: "$items.quantity",
          },

          revenue: {
            $sum: "$items.total",
          },
        },
      },

      {
        $sort: {
          quantity: -1,
        },
      },

      {
        $limit: 10,
      },
    ]);

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },

          paymentStatus: "paid",
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",

              date: "$createdAt",
            },
          },

          sales: {
            $sum: "$totalAmount",
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const totalOrders = currentOrders.length;

    const averageOrderValue = paidOrders.length
      ? roundMoney(grossSales / paidOrders.length)
      : 0;

    const collectionRate =
      totalOrders > 0 ? roundMoney((paidOrders.length / totalOrders) * 100) : 0;

    return res.status(200).json({
      success: true,

      period,

      summary: {
        grossSales,

        totalOrders,

        paidOrders: paidOrders.length,

        previousSales,

        salesChange,

        averageOrderValue,

        collectionRate,
      },

      paymentMethods: paymentMethodBreakdown,

      orderStatuses: statusBreakdown,

      topProducts,

      dailySales,

      orders: currentOrders.map(formatStaffOrder),
    });
  } catch (error) {
    console.error("Staff sales summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate sales summary",
    });
  }
};

export const getStaffRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const orders = await Order.find()
      .populate("customer", "name phone email customerType")
      .populate("createdBy", "name email role")
      .populate("items.product", "name image sku price unit")
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,

      count: orders.length,

      orders: orders.map(formatStaffOrder),
    });
  } catch (error) {
    console.error("Get staff recent orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent orders",
    });
  }
};

export const getStaffMySales = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const skip = (currentPage - 1) * perPage;

    const filter = {
      createdBy: req.user._id,
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name phone email customerType")
        .populate("createdBy", "name email role")
        .populate("items.product", "name image sku price unit")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Order.countDocuments(filter),
    ]);

    const paidOrders = orders.filter((order) => order.paymentStatus === "paid");

    const revenue = roundMoney(
      paidOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0,
      ),
    );

    return res.status(200).json({
      success: true,

      orders: orders.map(formatStaffOrder),

      summary: {
        totalOrders: total,

        paidOrders: paidOrders.length,

        revenue,
      },

      pagination: {
        page: currentPage,

        limit: perPage,

        total,

        pages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get staff sales error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load staff sales",
    });
  }
};
