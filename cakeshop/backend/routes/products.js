const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const {
      search, category, minPrice, maxPrice, isVeg, isEggless,
      isFeatured, isBestSeller, isNewArrival, sort, page = 1, limit = 12, tag
    } = req.query;

    const query = { isActive: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (isVeg === 'true') query.isVeg = true;
    if (isEggless === 'true') query.isEggless = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isNewArrival === 'true') query.isNewArrival = true;
    if (tag) query.tags = { $in: [tag] };

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'popular') sortObj = { totalSold: -1 };
    else if (sort === 'newest') sortObj = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug icon color')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .select('-ingredients -allergens -customOptions -metaTitle -metaDesc'),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { next(err); }
});

// @route GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(8).sort({ rating: -1 });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

// @route GET /api/products/bestsellers
router.get('/bestsellers', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isBestSeller: true })
      .populate('category', 'name slug')
      .limit(10).sort({ totalSold: -1 });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

// @route GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { slug: req.params.id }],
      isActive: true,
    }).populate('category', 'name slug icon');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────

// @route POST /api/products (Admin)
router.post('/', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    // Update category count
    await Category.findByIdAndUpdate(req.body.category, { $inc: { productCount: 1 } });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

// @route PUT /api/products/:id (Admin)
router.put('/:id', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// @route DELETE /api/products/:id (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
