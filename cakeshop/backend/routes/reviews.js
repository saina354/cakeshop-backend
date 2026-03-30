const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.productId, isApproved: true })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Review.countDocuments({ product: req.params.productId, isApproved: true }),
    ]);
    res.json({ success: true, data: reviews, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) { next(err); }
});

// @route POST /api/reviews
router.post('/', protect, async (req, res, next) => {
  try {
    const { product, rating, title, comment, images } = req.body;
    const existing = await Review.findOne({ product, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    const review = await Review.create({ product, user: req.user._id, rating, title, comment, images });
    // Update product rating
    const allReviews = await Review.find({ product, isApproved: true });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(product, { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// @route DELETE /api/reviews/:id (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
