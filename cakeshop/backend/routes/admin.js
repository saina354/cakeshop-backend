const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');

// @route POST /api/admin/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email, role: { $in: ['admin', 'staff'] } }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    const token = user.getSignedJwtToken();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    user.password = undefined;
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
});

// @route POST /api/admin/create-admin (Super Admin only)
router.post('/create-admin', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role = 'staff' } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    user.password = undefined;
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
});

// @route GET /api/admin/staff
router.get('/staff', protect, authorize('admin'), async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'staff'] } }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: staff });
  } catch (err) { next(err); }
});

// @route GET /api/admin/reviews (All reviews with moderation)
router.get('/reviews', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isApproved } = req.query;
    const query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    const [reviews, total] = await Promise.all([
      Review.find(query).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit))
        .populate('user', 'name email')
        .populate('product', 'name thumbnail'),
      Review.countDocuments(query),
    ]);
    res.json({ success: true, data: reviews, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
});

// @route PUT /api/admin/reviews/:id/approve
router.put('/reviews/:id/approve', protect, authorize('admin'), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: req.body.isApproved }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

// @route PUT /api/admin/reviews/:id/reply
router.put('/reviews/:id/reply', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, {
      adminReply: { message: req.body.message, repliedAt: new Date() },
    }, { new: true });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

module.exports = router;
