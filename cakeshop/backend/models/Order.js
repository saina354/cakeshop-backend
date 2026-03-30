const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:        { type: String, required: true },
  image:       { type: String },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  variant:     { size: String, price: Number },
  customization: { type: String },
  subtotal:    { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:       [orderItemSchema],
  
  // Pricing
  subtotal:      { type: Number, required: true },
  deliveryFee:   { type: Number, default: 0 },
  taxAmount:     { type: Number, default: 0 },
  taxPercent:    { type: Number, default: 5 },
  discountAmount:{ type: Number, default: 0 },
  couponCode:    { type: String },
  totalAmount:   { type: Number, required: true },
  
  // Delivery
  deliveryType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  deliveryAddress: {
    fullName: String,
    phone:    String,
    line1:    String,
    line2:    String,
    city:     String,
    state:    String,
    pincode:  String,
  },
  deliveryDate: { type: Date },
  deliverySlot: { type: String },  // "10:00 AM - 12:00 PM"
  deliveryNote: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  statusHistory: [{
    status:    String,
    message:   String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  
  // Payment
  paymentMethod: { type: String, enum: ['cod', 'online', 'upi', 'card', 'wallet'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId:     { type: String },
  
  // Special
  isSpecialOrder: { type: Boolean, default: false },
  specialInstructions: { type: String },
  
  // Rating
  isReviewed: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = 'CS' + String(count + 1001).padStart(6, '0');
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
