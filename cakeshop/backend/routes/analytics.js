const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/analytics/dashboard
router.get('/dashboard', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalOrders, todayOrders, monthOrders, lastMonthOrders,
      totalRevenue, todayRevenue, monthRevenue, lastMonthRevenue,
      totalUsers, newUsersToday, totalProducts,
      pendingOrders, preparingOrders, outForDelivery,
      recentOrders, topProducts,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: today } }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'preparing' }),
      Order.countDocuments({ status: 'out_for_delivery' }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      Product.find({ isActive: true }).sort({ totalSold: -1 }).limit(5).select('name thumbnail totalSold rating price'),
    ]);

    const safeRevenue = (arr) => arr[0]?.total || 0;

    res.json({
      success: true,
      data: {
        orders: { total: totalOrders, today: todayOrders, thisMonth: monthOrders, lastMonth: lastMonthOrders },
        revenue: {
          total: safeRevenue(totalRevenue),
          today: safeRevenue(todayRevenue),
          thisMonth: safeRevenue(monthRevenue),
          lastMonth: safeRevenue(lastMonthRevenue),
          growth: lastMonthRevenue[0]?.total
            ? Math.round(((safeRevenue(monthRevenue) - safeRevenue(lastMonthRevenue)) / safeRevenue(lastMonthRevenue)) * 100)
            : 0,
        },
        users: { total: totalUsers, newToday: newUsersToday },
        products: { total: totalProducts },
        activeOrders: { pending: pendingOrders, preparing: preparingOrders, outForDelivery },
        recentOrders,
        topProducts,
      },
    });
  } catch (err) { next(err); }
});

// @route GET /api/analytics/sales-chart
router.get('/sales-chart', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const { period = '7days' } = req.query;
    let startDate, groupFormat;
    const now = new Date();
    if (period === '7days') {
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      groupFormat = '%Y-%m-%d';
    } else if (period === '30days') {
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      groupFormat = '%Y-%m-%d';
    } else if (period === '12months') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      groupFormat = '%Y-%m';
    }

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// @route GET /api/analytics/order-status
router.get('/order-status', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
