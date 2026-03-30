const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/coupons (Admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
});

// @route POST /api/coupons/validate (Customer)
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    const validity = coupon.isValid(req.user._id, subtotal);
    if (!validity.valid) return res.status(400).json({ success: false, message: validity.message });
    const discount = coupon.calculateDiscount(subtotal);
    res.json({ success: true, data: { coupon, discount }, message: `Coupon valid! You save ₹${discount}` });
  } catch (err) { next(err); }
});

// @route POST /api/coupons (Admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

// @route PUT /api/coupons/:id (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

// @route DELETE /api/coupons/:id (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
