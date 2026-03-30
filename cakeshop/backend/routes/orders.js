const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const TAX_RATE = 0.05;
const DELIVERY_FEE_BASE = 50;
const FREE_DELIVERY_ABOVE = 500;

// @route POST /api/orders (Place Order)
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, deliveryAddress, deliveryType, deliveryDate, deliverySlot, paymentMethod, couponCode, specialInstructions, deliveryNote } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Validate products and calculate subtotal
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${item.product} not available` });
      }
      const price = item.variant?.price || product.discountPrice || product.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.thumbnail,
        price,
        quantity: item.quantity,
        variant: item.variant,
        customization: item.customization,
        subtotal: itemSubtotal,
      });
    }

    // Delivery fee
    let deliveryFee = deliveryType === 'pickup' ? 0 : (subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE_BASE);

    // Coupon
    let discountAmount = 0;
    let validCoupon = null;
    if (couponCode) {
      validCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (validCoupon) {
        const validity = validCoupon.isValid(req.user._id, subtotal);
        if (!validity.valid) {
          return res.status(400).json({ success: false, message: validity.message });
        }
        discountAmount = validCoupon.calculateDiscount(subtotal);
      }
    }

    const taxAmount = Math.round((subtotal - discountAmount) * TAX_RATE);
    const totalAmount = subtotal - discountAmount + deliveryFee + taxAmount;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      taxAmount,
      taxPercent: TAX_RATE * 100,
      discountAmount,
      couponCode: couponCode?.toUpperCase(),
      totalAmount,
      deliveryType,
      deliveryAddress,
      deliveryDate,
      deliverySlot,
      deliveryNote,
      paymentMethod,
      specialInstructions,
      statusHistory: [{ status: 'pending', message: 'Order placed successfully', updatedBy: req.user._id }],
    });

    // Update coupon usage
    if (validCoupon) {
      validCoupon.usedCount += 1;
      validCoupon.usedBy.push(req.user._id);
      await validCoupon.save();
    }

    // Update product sales
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { totalSold: item.quantity } });
    }

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalOrders: 1, totalSpent: totalAmount, loyaltyPoints: Math.floor(totalAmount / 10) },
    });

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], coupon: null });

    const populatedOrder = await Order.findById(order._id).populate('user', 'name email phone');
    res.status(201).json({ success: true, data: populatedOrder, message: 'Order placed successfully! 🎂' });
  } catch (err) { next(err); }
});

// @route GET /api/orders (My Orders)
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('items.product', 'name thumbnail'),
      Order.countDocuments(query),
    ]);
    res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
});

// @route GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'customer') query.user = req.user._id;
    const order = await Order.findOne(query).populate('user', 'name email phone').populate('items.product', 'name thumbnail');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// @route PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', message: req.body.reason || 'Cancelled by customer', updatedBy: req.user._id });
    await order.save();
    res.json({ success: true, data: order, message: 'Order cancelled successfully' });
  } catch (err) { next(err); }
});

// ─── Admin Order Routes ────────────────────────────────────────────────────

// @route GET /api/orders/admin/all
router.get('/admin/all', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.orderNumber = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit))
        .populate('user', 'name email phone'),
      Order.countDocuments(query),
    ]);
    res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
});

// @route PUT /api/orders/:id/status (Admin)
router.put('/:id/status', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const { status, message } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, message: message || `Order ${status}`, updatedBy: req.user._id });
    if (status === 'delivered') order.paymentStatus = 'paid';
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

module.exports = router;
