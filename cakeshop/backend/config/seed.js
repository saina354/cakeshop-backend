const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cakeshop';

const categories = [
  { name: 'Birthday Cakes', icon: '🎂', color: '#FF6B9D', description: 'Celebrate every birthday with our spectacular cakes', sortOrder: 1 },
  { name: 'Wedding Cakes', icon: '💍', color: '#C9A96E', description: 'Make your special day unforgettable', sortOrder: 2 },
  { name: 'Pastries', icon: '🥐', color: '#FF9F43', description: 'Fresh baked pastries every morning', sortOrder: 3 },
  { name: 'Cupcakes', icon: '🧁', color: '#A29BFE', description: 'Mini delights for every occasion', sortOrder: 4 },
  { name: 'Cheesecakes', icon: '🍰', color: '#FFC0CB', description: 'Creamy rich cheesecakes', sortOrder: 5 },
  { name: 'Brownies & Bars', icon: '🍫', color: '#6C5CE7', description: 'Fudgy brownies and delicious bars', sortOrder: 6 },
  { name: 'Macarons', icon: '🍬', color: '#FD79A8', description: 'Delicate French macarons', sortOrder: 7 },
  { name: 'Custom Cakes', icon: '✨', color: '#00B894', description: 'Personalized cakes for every occasion', sortOrder: 8 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Admin User
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@cakeshop.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true,
      phone: '9876543210',
    });
    console.log('👤 Admin created: admin@cakeshop.com / Admin@123');

    // Create Staff User
    await User.create({
      name: 'Staff Member',
      email: 'staff@cakeshop.com',
      password: 'Staff@123',
      role: 'staff',
      isActive: true,
      phone: '9876543211',
    });
    console.log('👤 Staff created: staff@cakeshop.com / Staff@123');

    // Create test customer
    await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'Test@123',
      role: 'customer',
      isActive: true,
      phone: '9876543212',
    });
    console.log('👤 Customer created: customer@test.com / Test@123');

    // Create Categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`📁 Created ${createdCategories.length} categories`);

    const catMap = {};
    createdCategories.forEach(c => { catMap[c.name] = c._id; });

    // Create Products
    const products = [
      // Birthday Cakes
      {
        name: 'Classic Chocolate Birthday Cake',
        description: 'A rich, moist chocolate sponge layered with silky chocolate ganache and topped with decorative rosettes. Perfect centerpiece for any birthday celebration.',
        shortDesc: 'Rich chocolate sponge with ganache frosting',
        category: catMap['Birthday Cakes'],
        price: 850,
        discountPrice: 699,
        stock: 25,
        isVeg: true,
        isFeatured: true,
        isBestSeller: true,
        rating: 4.8,
        reviewCount: 124,
        totalSold: 456,
        preparationTime: 120,
        shelfLife: '3 days',
        servings: 8,
        tags: ['chocolate', 'birthday', 'bestseller', 'popular'],
        variants: [
          { size: '500g (4-6 servings)', price: 699, stock: 20 },
          { size: '1kg (8-12 servings)', price: 1199, stock: 15 },
          { size: '2kg (16-20 servings)', price: 2199, stock: 8 },
        ],
        customizable: true,
        customOptions: [
          { label: 'Message on Cake', choices: [], required: false },
          { label: 'Candles', choices: ['No Candles', '1 Candle', 'Number Candles', 'Sparkler'], required: false },
        ],
      },
      {
        name: 'Strawberry Cream Birthday Cake',
        description: 'Light vanilla sponge layers filled with fresh strawberry cream and decorated with real strawberries. A fruity delight that everyone loves.',
        shortDesc: 'Vanilla sponge with fresh strawberry cream',
        category: catMap['Birthday Cakes'],
        price: 950,
        discountPrice: 799,
        stock: 20,
        isVeg: true,
        isFeatured: true,
        rating: 4.7,
        reviewCount: 89,
        totalSold: 234,
        preparationTime: 120,
        tags: ['strawberry', 'birthday', 'fruity'],
        variants: [
          { size: '500g', price: 799, stock: 15 },
          { size: '1kg', price: 1399, stock: 10 },
        ],
      },
      {
        name: 'Rainbow Unicorn Cake',
        description: 'A magical multi-colored cake with whipped cream frosting, edible glitter, and a fondant unicorn topper. Kids absolutely love this!',
        shortDesc: 'Colorful kids birthday cake with unicorn topper',
        category: catMap['Birthday Cakes'],
        price: 1200,
        discountPrice: 999,
        stock: 15,
        isVeg: true,
        isNewArrival: true,
        rating: 4.9,
        reviewCount: 67,
        totalSold: 123,
        tags: ['unicorn', 'kids', 'colorful', 'birthday'],
        variants: [
          { size: '1kg', price: 999, stock: 10 },
          { size: '2kg', price: 1799, stock: 5 },
        ],
      },
      // Wedding Cakes
      {
        name: 'Classic White Wedding Cake',
        description: 'Elegant 3-tier vanilla almond cake draped in pristine white fondant with delicate sugar flowers. A timeless choice for your perfect wedding.',
        shortDesc: '3-tier vanilla almond fondant cake',
        category: catMap['Wedding Cakes'],
        price: 4500,
        discountPrice: 3999,
        stock: 5,
        isVeg: true,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 45,
        totalSold: 67,
        preparationTime: 1440,
        servings: 50,
        tags: ['wedding', 'elegant', 'white', 'tiered'],
        customizable: true,
      },
      // Pastries
      {
        name: 'Butter Croissant',
        description: 'Flaky, golden, perfectly laminated butter croissant. Made fresh every morning with premium French butter.',
        shortDesc: 'Freshly baked flaky French butter croissant',
        category: catMap['Pastries'],
        price: 80,
        discountPrice: 0,
        stock: 50,
        isVeg: true,
        isBestSeller: true,
        rating: 4.6,
        reviewCount: 203,
        totalSold: 1200,
        preparationTime: 15,
        shelfLife: '1 day',
        servings: 1,
        tags: ['croissant', 'breakfast', 'french', 'fresh'],
      },
      {
        name: 'Chocolate Éclair',
        description: 'Classic French éclair filled with vanilla cream and topped with dark chocolate glaze. An indulgent treat that melts in your mouth.',
        shortDesc: 'Cream-filled French pastry with chocolate glaze',
        category: catMap['Pastries'],
        price: 120,
        discountPrice: 99,
        stock: 40,
        isVeg: true,
        isBestSeller: true,
        rating: 4.7,
        reviewCount: 156,
        totalSold: 890,
        tags: ['eclair', 'chocolate', 'cream', 'french'],
      },
      {
        name: 'Almond Danish Pastry',
        description: 'Buttery danish pastry filled with rich almond cream and topped with sliced almonds and a honey glaze.',
        shortDesc: 'Almond cream danish with honey glaze',
        category: catMap['Pastries'],
        price: 110,
        discountPrice: 89,
        stock: 35,
        isVeg: true,
        rating: 4.5,
        reviewCount: 78,
        totalSold: 450,
        tags: ['danish', 'almond', 'breakfast'],
      },
      // Cupcakes
      {
        name: 'Red Velvet Cupcakes (6-pack)',
        description: 'Velvety red sponge cupcakes with tangy cream cheese frosting and red velvet crumbles. A classic you can\'t resist.',
        shortDesc: 'Classic red velvet with cream cheese frosting',
        category: catMap['Cupcakes'],
        price: 450,
        discountPrice: 399,
        stock: 30,
        isVeg: true,
        isFeatured: true,
        isBestSeller: true,
        rating: 4.8,
        reviewCount: 189,
        totalSold: 678,
        tags: ['red velvet', 'cupcakes', 'cream cheese', 'party'],
      },
      {
        name: 'Lemon Blueberry Cupcakes (6-pack)',
        description: 'Zesty lemon cupcakes bursting with fresh blueberries and topped with lemon buttercream. A refreshing summer treat.',
        shortDesc: 'Lemon sponge with fresh blueberry and lemon cream',
        category: catMap['Cupcakes'],
        price: 420,
        discountPrice: 369,
        stock: 25,
        isVeg: true,
        isNewArrival: true,
        rating: 4.6,
        reviewCount: 45,
        totalSold: 123,
        tags: ['lemon', 'blueberry', 'cupcakes', 'fresh'],
      },
      // Cheesecakes
      {
        name: 'New York Baked Cheesecake',
        description: 'Dense, rich, and perfectly creamy New York style baked cheesecake on a buttery graham cracker crust. The ultimate cheesecake experience.',
        shortDesc: 'Classic NY-style dense and creamy cheesecake',
        category: catMap['Cheesecakes'],
        price: 699,
        discountPrice: 599,
        stock: 15,
        isVeg: true,
        isFeatured: true,
        isBestSeller: true,
        rating: 4.9,
        reviewCount: 234,
        totalSold: 567,
        preparationTime: 30,
        shelfLife: '4 days',
        tags: ['cheesecake', 'new york', 'baked', 'premium'],
      },
      {
        name: 'Mango Cheesecake',
        description: 'Luscious no-bake cheesecake with a mango jelly topping and fresh mango pieces. Tropical paradise in every bite.',
        shortDesc: 'No-bake cheesecake with mango jelly topping',
        category: catMap['Cheesecakes'],
        price: 749,
        discountPrice: 649,
        stock: 12,
        isVeg: true,
        isNewArrival: true,
        rating: 4.7,
        reviewCount: 89,
        totalSold: 245,
        tags: ['cheesecake', 'mango', 'tropical', 'no-bake'],
      },
      // Brownies
      {
        name: 'Classic Fudge Brownies (4-pack)',
        description: 'Ultra fudgy, dense chocolate brownies with a crinkly top and gooey center. Made with premium dark chocolate.',
        shortDesc: 'Fudgy dark chocolate brownies with crinkly top',
        category: catMap['Brownies & Bars'],
        price: 299,
        discountPrice: 249,
        stock: 40,
        isVeg: true,
        isBestSeller: true,
        rating: 4.8,
        reviewCount: 312,
        totalSold: 1089,
        tags: ['brownies', 'chocolate', 'fudgy', 'dark chocolate'],
      },
      {
        name: 'Walnut Chocolate Brownies (4-pack)',
        description: 'Rich chocolate brownies loaded with crunchy California walnuts. A perfect balance of texture and flavor.',
        shortDesc: 'Dark chocolate brownies with California walnuts',
        category: catMap['Brownies & Bars'],
        price: 349,
        discountPrice: 299,
        stock: 35,
        isVeg: true,
        rating: 4.7,
        reviewCount: 178,
        totalSold: 567,
        allergens: ['nuts'],
        tags: ['brownies', 'walnut', 'chocolate'],
      },
      // Macarons
      {
        name: 'French Macarons - Assorted (12-pack)',
        description: 'A beautiful assortment of 12 delicate French macarons in 6 flavors: Vanilla, Chocolate, Raspberry, Pistachio, Salted Caramel, and Lemon.',
        shortDesc: '12 assorted French macarons in 6 flavors',
        category: catMap['Macarons'],
        price: 899,
        discountPrice: 799,
        stock: 20,
        isVeg: true,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 145,
        totalSold: 389,
        tags: ['macarons', 'french', 'assorted', 'gift', 'premium'],
      },
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`🎂 Created ${createdProducts.length} products`);

    // Update category product counts
    for (const catId of Object.values(catMap)) {
      const count = await Product.countDocuments({ category: catId, isActive: true });
      await Category.findByIdAndUpdate(catId, { productCount: count });
    }

    // Create Coupons
    const now = new Date();
    const coupons = [
      {
        code: 'WELCOME20',
        description: '20% off on your first order',
        type: 'percentage',
        value: 20,
        minOrderAmount: 300,
        maxDiscount: 200,
        usageLimit: 1000,
        perUserLimit: 1,
        validFrom: now,
        validUntil: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        isActive: true,
      },
      {
        code: 'FLAT100',
        description: 'Flat ₹100 off on orders above ₹500',
        type: 'fixed',
        value: 100,
        minOrderAmount: 500,
        usageLimit: 500,
        perUserLimit: 2,
        validFrom: now,
        validUntil: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        isActive: true,
      },
      {
        code: 'CAKE15',
        description: '15% off on all cakes',
        type: 'percentage',
        value: 15,
        minOrderAmount: 400,
        maxDiscount: 300,
        usageLimit: null,
        perUserLimit: 3,
        validFrom: now,
        validUntil: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        isActive: true,
      },
      {
        code: 'FREESHIP',
        description: 'Free delivery on any order',
        type: 'fixed',
        value: 50,
        minOrderAmount: 0,
        usageLimit: 200,
        perUserLimit: 1,
        validFrom: now,
        validUntil: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
        isActive: true,
      },
    ];
    await Coupon.insertMany(coupons);
    console.log(`🏷️  Created ${coupons.length} coupons`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('  🔑 ADMIN CREDENTIALS');
    console.log('  Email:    admin@cakeshop.com');
    console.log('  Password: Admin@123');
    console.log('  Panel:    http://localhost:5000/admin');
    console.log('═══════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
