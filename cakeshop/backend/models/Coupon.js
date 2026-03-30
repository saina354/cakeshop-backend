const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String },
  type:        { type: String, enum: ['percentage', 'fixed'], required: true },
  value:       { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount:    { type: Number },  // cap for percentage coupons
  usageLimit:     { type: Number, default: null },  // null = unlimited
  usedCount:      { type: Number, default: 0 },
  perUserLimit:   { type: Number, default: 1 },
  validFrom:   { type: Date, required: true },
  validUntil:  { type: Date, required: true },
  isActive:    { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

couponSchema.methods.isValid = function (userId, orderAmount) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.validFrom) return { valid: false, message: 'Coupon not yet active' };
  if (now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  const userUsage = this.usedBy.filter(u => u.toString() === userId.toString()).length;
  if (userUsage >= this.perUserLimit) return { valid: false, message: 'You have already used this coupon' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (amount) {
  let discount = this.type === 'percentage' ? (amount * this.value) / 100 : this.value;
  if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  return Math.round(discount);
};

module.exports = mongoose.model('Coupon', couponSchema);
