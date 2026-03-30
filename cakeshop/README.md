# 🎂 CakeShop — Zomato-Style Cake & Pastry Backend

A full-featured Node.js + Express + MongoDB backend for a cake and pastry shop, complete with a built-in Admin Panel.

---

## 📁 Project Structure

```
cakeshop/
├── backend/
│   ├── server.js              # Main entry point
│   ├── package.json
│   ├── .env.example           # Copy to .env and configure
│   ├── models/
│   │   ├── User.js            # Customer & Admin users
│   │   ├── Product.js         # Cakes, pastries, etc.
│   │   ├── Category.js        # Product categories
│   │   ├── Order.js           # Orders with status tracking
│   │   ├── Cart.js            # Shopping cart
│   │   ├── Review.js          # Product reviews & ratings
│   │   └── Coupon.js          # Discount coupons
│   ├── routes/
│   │   ├── auth.js            # Register, login, profile, addresses, wishlist
│   │   ├── products.js        # Product CRUD + search + filters
│   │   ├── categories.js      # Category management
│   │   ├── orders.js          # Place orders, track, update status
│   │   ├── cart.js            # Cart management + coupon apply
│   │   ├── users.js           # User management (admin)
│   │   ├── reviews.js         # Reviews CRUD
│   │   ├── coupons.js         # Coupon management
│   │   ├── admin.js           # Admin login, staff, review moderation
│   │   ├── analytics.js       # Dashboard stats, sales chart
│   │   └── upload.js          # File/image upload
│   ├── middleware/
│   │   ├── auth.js            # JWT protection + role authorization
│   │   └── upload.js          # Multer file upload config
│   └── config/
│       └── seed.js            # Database seeder with sample data
└── admin/
    └── public/
        └── index.html         # Full Admin Panel (single file SPA)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)

### 2. Setup

```bash
cd backend
npm install

# Copy environment config
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET
```

### 3. Seed Database (Sample Data)

```bash
npm run seed
```

This creates:
- ✅ Admin: `admin@cakeshop.com` / `Admin@123`
- ✅ Staff: `staff@cakeshop.com` / `Staff@123`
- ✅ Customer: `customer@test.com` / `Test@123`
- 🎂 8 Categories
- 🍰 15 Sample Products
- 🏷️ 4 Coupons (WELCOME20, FLAT100, CAKE15, FREESHIP)

### 4. Start Server

```bash
npm start        # Production
npm run dev      # Development (nodemon)
```

### 5. Access

| URL | Description |
|-----|-------------|
| `http://localhost:5000/admin` | 🎂 Admin Panel |
| `http://localhost:5000/api/health` | 📡 API Health Check |
| `http://localhost:5000/api/...` | REST API |

---

## 🔑 Admin Panel Features

- **Dashboard** — Real-time stats, sales chart, order status donut chart, recent orders, top products
- **Orders** — View all orders, filter by status/date, update order status with one click
- **Products** — Full CRUD, search, filter by category, manage featured/bestseller/new flags
- **Categories** — Visual card grid, create/edit/delete categories with emoji & color
- **Customers** — View all users, search, activate/deactivate accounts
- **Reviews** — Moderate reviews, approve/reject, delete
- **Coupons** — Create percentage or fixed discount coupons with expiry and usage limits
- **Staff** — Add staff members, manage roles (admin/staff)
- **Settings** — Shop settings, delivery config, password change

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (🔒) |
| PUT | `/api/auth/update-profile` | Update profile (🔒) |
| PUT | `/api/auth/change-password` | Change password (🔒) |
| POST | `/api/auth/address` | Add address (🔒) |
| PUT | `/api/auth/address/:id` | Update address (🔒) |
| DELETE | `/api/auth/address/:id` | Delete address (🔒) |
| POST | `/api/auth/wishlist/:productId` | Toggle wishlist (🔒) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (search, filter, paginate) |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/bestsellers` | Best sellers |
| GET | `/api/products/:id` | Single product |
| POST | `/api/products` | Create product (🔒 Admin) |
| PUT | `/api/products/:id` | Update product (🔒 Admin) |
| DELETE | `/api/products/:id` | Deactivate product (🔒 Admin) |

**Query Params:** `search`, `category`, `minPrice`, `maxPrice`, `isVeg`, `isEggless`, `isFeatured`, `isBestSeller`, `isNewArrival`, `sort`, `page`, `limit`, `tag`

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | All active categories |
| POST | `/api/categories` | Create (🔒 Admin) |
| PUT | `/api/categories/:id` | Update (🔒 Admin) |
| DELETE | `/api/categories/:id` | Deactivate (🔒 Admin) |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user cart (🔒) |
| POST | `/api/cart/add` | Add item (🔒) |
| PUT | `/api/cart/item/:itemId` | Update quantity (🔒) |
| DELETE | `/api/cart/item/:itemId` | Remove item (🔒) |
| DELETE | `/api/cart/clear` | Clear cart (🔒) |
| POST | `/api/cart/apply-coupon` | Apply coupon (🔒) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order (🔒) |
| GET | `/api/orders` | My orders (🔒) |
| GET | `/api/orders/:id` | Order details (🔒) |
| PUT | `/api/orders/:id/cancel` | Cancel order (🔒) |
| GET | `/api/orders/admin/all` | All orders (🔒 Admin) |
| PUT | `/api/orders/:id/status` | Update status (🔒 Admin) |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/product/:productId` | Product reviews |
| POST | `/api/reviews` | Add review (🔒) |
| DELETE | `/api/reviews/:id` | Delete review (🔒 Admin) |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons/validate` | Validate coupon (🔒) |
| GET | `/api/coupons` | All coupons (🔒 Admin) |
| POST | `/api/coupons` | Create coupon (🔒 Admin) |
| PUT | `/api/coupons/:id` | Update coupon (🔒 Admin) |
| DELETE | `/api/coupons/:id` | Delete coupon (🔒 Admin) |

### Analytics (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/sales-chart?period=7days\|30days\|12months` | Sales chart data |
| GET | `/api/analytics/order-status` | Order status distribution |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/create-admin` | Create staff (🔒 Admin) |
| GET | `/api/admin/staff` | All staff (🔒 Admin) |
| GET | `/api/admin/reviews` | All reviews (🔒 Admin) |
| PUT | `/api/admin/reviews/:id/approve` | Approve/reject review (🔒 Admin) |
| PUT | `/api/admin/reviews/:id/reply` | Admin reply to review (🔒 Admin) |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/:type` | Upload images (🔒 Admin) — type: products, categories, avatars, reviews |
| DELETE | `/api/upload` | Delete uploaded file (🔒 Admin) |

---

## 🎟️ Sample Coupons

| Code | Type | Value | Condition |
|------|------|-------|-----------|
| `WELCOME20` | 20% off | Max ₹200 | Min order ₹300, once per user |
| `FLAT100` | ₹100 off | — | Min order ₹500 |
| `CAKE15` | 15% off | Max ₹300 | Min order ₹400 |
| `FREESHIP` | ₹50 off | — | Any order (covers delivery fee) |

---

## 🔒 Order Status Flow

```
pending → confirmed → preparing → ready → out_for_delivery → delivered
                                                          ↘ cancelled
```

---

## 🛡️ Security Features

- JWT authentication with 30-day expiry
- Password hashing with bcrypt (12 salt rounds)
- Rate limiting (200 req / 15 min)
- Helmet.js security headers
- CORS protection
- Role-based access control (customer / staff / admin)
- Input validation on critical routes

---

## 💡 Frontend Integration

```javascript
// Example: Login
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'customer@test.com', password: 'Test@123' })
});
const { token, user } = await res.json();

// Example: Get Products
const products = await fetch('http://localhost:5000/api/products?category=<id>&sort=rating&page=1');

// Example: Place Order (authenticated)
const order = await fetch('http://localhost:5000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ items: [...], deliveryAddress: {...}, paymentMethod: 'cod' })
});
```

---

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose ODM
- **Auth:** JWT + bcryptjs
- **File Upload:** Multer
- **Security:** Helmet, express-rate-limit, CORS
- **Admin Panel:** Vanilla JS SPA (no framework dependencies)
