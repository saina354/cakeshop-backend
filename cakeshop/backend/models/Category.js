const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  slug:        { type: String, unique: true, lowercase: true },
  description: { type: String },
  image:       { type: String, default: '' },
  icon:        { type: String, default: '🎂' },
  color:       { type: String, default: '#FF6B9D' },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  productCount:{ type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
