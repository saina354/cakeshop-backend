const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size:   { type: String },  // e.g. "500g", "1kg", "6 inch"
  price:  { type: Number, required: true },
  stock:  { type: Number, default: 0 },
  sku:    { type: String },
});

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDesc:   { type: String },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images:      [{ type: String }],
  thumbnail:   { type: String },
  price:       { type: Number, required: true, min: 0 },
  discountPrice:{ type: Number, default: 0 },
  discountPercent:{ type: Number, default: 0 },
  variants:    [variantSchema],
  stock:       { type: Number, default: 0 },
  sku:         { type: String, unique: true, sparse: true },
  unit:        { type: String, default: 'piece' },  // piece, kg, dozen
  isVeg:       { type: Boolean, default: true },
  isEggless:   { type: Boolean, default: false },
  allergens:   [{ type: String }],  // gluten, dairy, nuts, etc.
  ingredients: [{ type: String }],
  tags:        [{ type: String }],
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  isBestSeller:{ type: Boolean, default: false },
  isNewArrival:{ type: Boolean, default: false },
  preparationTime: { type: Number, default: 60 }, // minutes
  shelfLife:   { type: String, default: '2 days' },
  servings:    { type: Number, default: 1 },
  calories:    { type: Number },
  // Reviews aggregate
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalSold:   { type: Number, default: 0 },
  // SEO
  metaTitle:   { type: String },
  metaDesc:    { type: String },
  // Customization options
  customizable:{ type: Boolean, default: false },
  customOptions: [{
    label:   String,
    choices: [String],
    required:{ type: Boolean, default: false },
  }],
}, { timestamps: true });

// Auto slug
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  }
  if (this.discountPrice > 0 && this.price > 0) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });

module.exports = mongoose.model('Product', productSchema);
