const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');

// @route GET /api/cart
router.get('/', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name thumbnail price discountPrice stock isActive');
    if (!cart) return res.json({ success: true, data: { items: [], subtotal: 0 } });
    // Filter out inactive products
    cart.items = cart.items.filter(item => item.product && item.product.isActive);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

// @route POST /api/cart/add
router.post('/add', protect, async (req, res, next) => {
  try {
    const { productId, quantity = 1, variant, customization } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not available' });

    const price = variant?.price || product.discountPrice || product.price;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    const existingIdx = cart.items.findIndex(i => i.product.toString() === productId && JSON.stringify(i.variant) === JSON.stringify(variant));
    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, variant, customization, price });
    }
    await cart.save();
    await cart.populate('items.product', 'name thumbnail price discountPrice');
    res.json({ success: true, data: cart, message: 'Added to cart' });
  } catch (err) { next(err); }
});

// @route PUT /api/cart/item/:itemId
router.put('/item/:itemId', protect, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

// @route DELETE /api/cart/item/:itemId
router.delete('/item/:itemId', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    res.json({ success: true, data: cart, message: 'Item removed' });
  } catch (err) { next(err); }
});

// @route DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], coupon: null });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
});

// @route POST /api/cart/apply-coupon
router.post('/apply-coupon', protect, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    const validity = coupon.isValid(req.user._id, subtotal);
    if (!validity.valid) return res.status(400).json({ success: false, message: validity.message });
    const discount = coupon.calculateDiscount(subtotal);
    res.json({ success: true, data: { discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description } }, message: `Coupon applied! You save ₹${discount}` });
  } catch (err) { next(err); }
});

module.exports = router;
