# IRA SATHI - Complete Project Context

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Root Routes Structure](#root-routes-structure)
4. [Module Routes & Navigation](#module-routes--navigation)
5. [Backend API Routes](#backend-api-routes)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Module Dependencies](#module-dependencies)

---

## Project Overview

**IRA SATHI** is a Fertilizer Management Ecosystem with 4 main user roles:
- **Admin**: Platform management, vendor/seller approvals, product management
- **User**: End customers who purchase fertilizers
- **Vendor**: Regional distributors who fulfill orders
- **Seller (IRA Partner)**: Referral partners who earn commissions

**Tech Stack:**
- **Frontend**: React 19, Vite, React Router v7, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Services**: Razorpay (payment), Google Maps API (location), SMS India Hub (OTP)

---

## Architecture

### Frontend Structure
```
Frontend/src/
├── App.jsx                    # Root router with all route definitions
├── main.jsx                   # App entry point
├── components/                # Shared components
├── modules/
│   ├── Admin/                # Admin module
│   ├── User/                 # User module
│   ├── Vendor/               # Vendor module
│   └── Seller/               # Seller (IRA Partner) module
└── utils/                     # Shared utilities
```

### Backend Structure
```
Backend/
├── index.js                   # Express server entry, route registration
├── routes/                    # API route definitions
│   ├── admin.js
│   ├── user.js
│   ├── vendor.js
│   └── seller.js
├── controllers/               # Business logic handlers
├── models/                    # MongoDB schemas
├── services/                  # External service integrations
├── middleware/                # Auth, error handling
└── config/                    # Database, realtime configs
```

---

## Root Routes Structure

### Frontend Routes (App.jsx)

All routes are defined in `src/App.jsx`:

```jsx
/                          # Home page (route selection)
/admin/login              # Admin login page
/admin/dashboard          # Admin dashboard (with internal routing)

/user/login               # User login page
/user/register            # User registration page
/user/dashboard           # User dashboard (with internal routing)

/vendor/language          # Vendor language selection
/vendor/role              # Vendor/Seller role selection
/vendor/login             # Vendor login page
/vendor/register          # Vendor registration page
/vendor/dashboard         # Vendor dashboard

/seller/login             # Seller login page
/seller/register          # Seller registration page
/seller/dashboard         # Seller dashboard (with internal routing)
```

### Route Hierarchy
- **Admin**: `/admin/*` - Simple routes (login → dashboard)
- **User**: `/user/*` - Simple routes (login/register → dashboard)
- **Vendor**: `/vendor/*` - Nested routes (VendorRouteContainer with Outlet)
- **Seller**: `/seller/*` - Simple routes (login/register → dashboard)

---

## Module Routes & Navigation

### 1. Admin Module

**Entry Route**: `/admin/dashboard`

**Internal Navigation**: State-based routing (no React Router)
- Uses `AdminDashboardRoute.jsx` with `activeRoute` state
- Navigation handled via `Sidebar` component with `setActiveRoute`

**Available Routes**:
```
dashboard              # Dashboard overview
products               # Product management (with sub-routes: add/edit)
vendors                # Vendor management
sellers                # Seller management
users                  # User management
orders                 # Order management
finance                # Finance & credit management
operations             # Operations & logistics
analytics              # Analytics & reporting
vendor-withdrawals     # Vendor withdrawal requests
seller-withdrawals     # Seller withdrawal requests
payment-history        # Payment history
offers                 # Offers management
repayments             # Credit repayments
```

**Route Config** (AdminDashboardRoute.jsx):
- Uses `routeConfig` array mapping route IDs to page components
- Supports sub-routes like `products/add`, `products/edit/:id`
- Routes parsed as: `pageId/subRoute`

**Components**:
- `AdminLayout`: Wraps all pages with sidebar
- `Sidebar`: Navigation menu
- Pages: `Dashboard`, `Products`, `Vendors`, `Sellers`, `Users`, `Orders`, etc.

**Context**:
- `AdminContext`: Global state management (products, vendors, sellers, users, orders, notifications)
- State: dashboard data, filters, notifications, real-time connection status

**API Services**:
- `adminApi.js`: All backend API calls
- Base URL: `/api/admin/*`

---

### 2. User Module

**Entry Route**: `/user/dashboard`

**Internal Navigation**: Tab-based (bottom navigation)
- Uses `MobileShell` with bottom navigation
- Tabs: Home, Favourites, Cart, Orders, Account

**Available Views**:
```
home                    # HomeView - Browse products, categories, offers
favourites              # FavouritesView - Saved products
cart                    # CartView - Shopping cart
orders                  # OrdersView - Order history
account                 # AccountView - Profile, addresses, settings
product-detail          # ProductDetailView - Product details (modal/overlay)
checkout                # CheckoutView - Checkout process
order-confirmation      # OrderConfirmationView - Order success
category-products       # CategoryProductsView - Products by category
carousel-products       # CarouselProductsView - Products from carousel
search                  # SearchView - Product search
```

**Navigation Flow**:
1. Home → Product Detail → Add to Cart
2. Cart → Checkout → Order Confirmation
3. Orders → Order Details
4. Account → Profile/Addresses

**Components**:
- `MobileShell`: Main layout with bottom nav
- `BottomNavItem`: Navigation items
- Views: `HomeView`, `CartView`, `CheckoutView`, etc.

**Context**:
- `UserContext`: Global state (profile, cart, orders, addresses, favourites, assigned vendor)
- State: authentication, cart items, order history, vendor availability

**API Services**:
- `userApi.js`: All backend API calls
- Base URL: `/api/users/*`

---

### 3. Vendor Module

**Entry Route**: `/vendor/dashboard`

**Internal Navigation**: Tab-based or view-based (depending on implementation)
- Uses `VendorDashboard` component
- Navigation structure similar to User/Seller modules

**Route Container**:
- `VendorRouteContainer`: Wraps all `/vendor/*` routes with `VendorProvider`

**Available Routes**:
```
/vendor/language       # Language selection page
/vendor/role           # Role selection (Vendor vs Seller)
/vendor/login          # Vendor login page
/vendor/register       # Vendor registration page
/vendor/dashboard      # Vendor dashboard
```

**Dashboard Views** (internal):
- Orders management
- Inventory management
- Credit management
- Earnings & withdrawals
- Reports & analytics

**Components**:
- `VendorDashboard`: Main dashboard component
- Views: Order management, inventory, credit, earnings

**Context**:
- `VendorContext`: Global state (profile, orders, inventory, credit, earnings)
- State: authentication, orders, inventory, credit balance

**API Services**:
- `vendorApi.js`: All backend API calls
- Base URL: `/api/vendors/*`

---

### 4. Seller Module

**Entry Route**: `/seller/dashboard`

**Internal Navigation**: Tab-based (bottom navigation)
- Uses `MobileShell` with bottom navigation
- Tabs: Overview, Referrals, Wallet, Updates, Profile

**Available Views**:
```
overview              # OverviewView - Dashboard summary, targets
referrals             # ReferralsView - Referred users list
wallet                # WalletView - Balance, transactions, withdrawals
announcements         # AnnouncementsView - Admin announcements
performance           # PerformanceView - Performance analytics
profile               # ProfileView - Profile settings
```

**Navigation Flow**:
1. Overview → View targets, wallet summary
2. Referrals → View referred users, commissions
3. Wallet → View balance, request withdrawal
4. Announcements → View admin updates
5. Profile → Update profile, bank accounts

**Components**:
- `MobileShell`: Main layout with bottom nav
- `BottomNavItem`: Navigation items
- Views: `OverviewView`, `ReferralsView`, `WalletView`, etc.
- Panels: `WithdrawalRequestPanel`, `ShareSellerIdPanel`, `BankAccountForm`

**Context**:
- `SellerContext`: Global state (profile, referrals, wallet, targets, notifications)
- State: authentication, referrals, wallet balance, target progress

**API Services**:
- `sellerApi.js`: All backend API calls
- Base URL: `/api/sellers/*`

---

## Backend API Routes

### Base Configuration
- **Development**: `http://localhost:3000/api`
- **Production**: Configured via environment variables

### Route Registration (Backend/index.js)
```javascript
app.use('/api/users', userRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/sellers', sellerRoutes)
app.use('/api/admin', adminRoutes)
```

---

### Admin API Routes (`/api/admin/*`)

**Authentication**:
- `POST /api/admin/auth/login` - Step 1: Phone verification
- `POST /api/admin/auth/request-otp` - Step 2: Request OTP
- `POST /api/admin/auth/verify-otp` - Step 2: Verify OTP
- `POST /api/admin/auth/logout` - Logout
- `GET /api/admin/auth/profile` - Get profile

**Dashboard**:
- `GET /api/admin/dashboard` - Dashboard overview

**Products**:
- `GET /api/admin/products` - List products
- `GET /api/admin/products/:productId` - Get product details
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:productId` - Update product
- `DELETE /api/admin/products/:productId` - Delete product
- `POST /api/admin/products/:productId/assign` - Assign to vendor
- `PUT /api/admin/products/:productId/visibility` - Toggle visibility

**Vendors**:
- `GET /api/admin/vendors` - List vendors
- `GET /api/admin/vendors/:vendorId` - Get vendor details
- `POST /api/admin/vendors/:vendorId/approve` - Approve vendor
- `POST /api/admin/vendors/:vendorId/reject` - Reject vendor
- `PUT /api/admin/vendors/:vendorId/credit-policy` - Set credit policy
- `GET /api/admin/vendors/withdrawals` - Get withdrawal requests
- `POST /api/admin/vendors/withdrawals/:requestId/approve` - Approve withdrawal
- `POST /api/admin/vendors/purchases/:requestId/approve` - Approve purchase

**Sellers**:
- `GET /api/admin/sellers` - List sellers
- `GET /api/admin/sellers/:sellerId` - Get seller details
- `POST /api/admin/sellers` - Create seller
- `PUT /api/admin/sellers/:sellerId/target` - Set target
- `GET /api/admin/sellers/withdrawals` - Get withdrawal requests
- `POST /api/admin/sellers/withdrawals/:requestId/approve` - Approve withdrawal

**Users**:
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/block` - Block user

**Orders**:
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:orderId` - Get order details
- `PUT /api/admin/orders/:orderId/reassign` - Reassign order
- `POST /api/admin/orders/:orderId/fulfill` - Fulfill from warehouse

**Finance**:
- `GET /api/admin/finance/credits` - Get vendor credits
- `GET /api/admin/finance/repayments` - Get repayments
- `GET /api/admin/finance/recovery` - Get recovery status

**Analytics**:
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/reports` - Generate reports

---

### User API Routes (`/api/users/*`)

**Authentication**:
- `POST /api/users/auth/request-otp` - Request OTP
- `POST /api/users/auth/register` - Register with OTP
- `POST /api/users/auth/login` - Login with OTP
- `POST /api/users/auth/logout` - Logout
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile

**Products**:
- `GET /api/users/products/categories` - Get categories
- `GET /api/users/products` - List products
- `GET /api/users/products/:productId` - Get product details
- `GET /api/users/products/popular` - Get popular products
- `GET /api/users/products/search` - Search products
- `GET /api/users/offers` - Get offers

**Cart**:
- `GET /api/users/cart` - Get cart
- `POST /api/users/cart` - Add to cart
- `PUT /api/users/cart/:itemId` - Update cart item
- `DELETE /api/users/cart/:itemId` - Remove item
- `DELETE /api/users/cart` - Clear cart
- `POST /api/users/cart/validate` - Validate cart (min ₹2,000)

**Vendor Assignment**:
- `POST /api/users/vendors/assign` - Get assigned vendor (20km radius)
- `POST /api/users/vendors/check-stock` - Check vendor stock

**Orders**:
- `POST /api/users/orders` - Create order
- `GET /api/users/orders` - List orders
- `GET /api/users/orders/:orderId` - Get order details
- `GET /api/users/orders/:orderId/track` - Track order
- `PUT /api/users/orders/:orderId/cancel` - Cancel order

**Payments**:
- `POST /api/users/payments/create-intent` - Create payment intent (30% or 100%)
- `POST /api/users/payments/confirm` - Confirm payment
- `POST /api/users/payments/create-remaining` - Create remaining payment intent (70%)
- `POST /api/users/payments/confirm-remaining` - Confirm remaining payment
- `GET /api/users/payments/:paymentId` - Get payment status

**Addresses**:
- `GET /api/users/addresses` - List addresses
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:addressId` - Update address
- `DELETE /api/users/addresses/:addressId` - Delete address
- `PUT /api/users/addresses/:addressId/default` - Set default address

**Favourites**:
- `GET /api/users/favourites` - Get favourites
- `POST /api/users/favourites` - Add to favourites
- `DELETE /api/users/favourites/:productId` - Remove from favourites

**Notifications**:
- `GET /api/users/notifications` - Get notifications
- `PUT /api/users/notifications/:notificationId/read` - Mark as read

---

### Vendor API Routes (`/api/vendors/*`)

**Authentication**:
- `POST /api/vendors/auth/register` - Register
- `POST /api/vendors/auth/request-otp` - Request OTP
- `POST /api/vendors/auth/verify-otp` - Verify OTP
- `POST /api/vendors/auth/logout` - Logout
- `GET /api/vendors/auth/profile` - Get profile

**Dashboard**:
- `GET /api/vendors/dashboard` - Dashboard overview

**Orders**:
- `GET /api/vendors/orders` - List orders
- `GET /api/vendors/orders/:orderId` - Get order details
- `POST /api/vendors/orders/:orderId/accept` - Accept order
- `POST /api/vendors/orders/:orderId/reject` - Reject order
- `POST /api/vendors/orders/:orderId/accept-partial` - Partially accept
- `PUT /api/vendors/orders/:orderId/status` - Update status
- `GET /api/vendors/orders/stats` - Order statistics

**Inventory**:
- `GET /api/vendors/inventory` - List inventory
- `GET /api/vendors/inventory/:itemId` - Get item details
- `PUT /api/vendors/inventory/:itemId/stock` - Update stock
- `GET /api/vendors/inventory/stats` - Inventory statistics

**Credit**:
- `GET /api/vendors/credit` - Get credit info
- `POST /api/vendors/credit/purchase` - Request credit purchase (min ₹50,000)
- `GET /api/vendors/credit/purchases` - Get purchase requests
- `POST /api/vendors/credit/repayment/create-intent` - Create repayment intent
- `POST /api/vendors/credit/repayment/confirm` - Confirm repayment

**Earnings**:
- `GET /api/vendors/earnings` - Get earnings summary
- `GET /api/vendors/earnings/history` - Get earnings history
- `GET /api/vendors/balance` - Get available balance

**Withdrawals**:
- `POST /api/vendors/withdrawals/request` - Request withdrawal
- `GET /api/vendors/withdrawals` - Get withdrawal requests

**Messages**:
- `POST /api/vendors/messages` - Create message to admin
- `GET /api/vendors/messages` - Get messages

---

### Seller API Routes (`/api/sellers/*`)

**Authentication**:
- `POST /api/sellers/auth/register` - Register
- `POST /api/sellers/auth/request-otp` - Request OTP
- `POST /api/sellers/auth/verify-otp` - Verify OTP
- `POST /api/sellers/auth/logout` - Logout
- `GET /api/sellers/auth/profile` - Get profile
- `PUT /api/sellers/profile` - Update profile

**Dashboard**:
- `GET /api/sellers/dashboard` - Dashboard overview
- `GET /api/sellers/dashboard/overview` - Overview data
- `GET /api/sellers/dashboard/wallet` - Wallet data
- `GET /api/sellers/dashboard/referrals` - Referrals data
- `GET /api/sellers/dashboard/performance` - Performance data

**Wallet**:
- `GET /api/sellers/wallet` - Get wallet details
- `GET /api/sellers/wallet/transactions` - Get transactions
- `POST /api/sellers/wallet/withdrawals/request` - Request withdrawal
- `GET /api/sellers/wallet/withdrawals` - Get withdrawal requests

**Referrals**:
- `GET /api/sellers/referrals` - Get referrals
- `GET /api/sellers/referrals/:referralId` - Get referral details
- `GET /api/sellers/referrals/stats` - Get referral statistics

**Targets**:
- `GET /api/sellers/target` - Get monthly target
- `GET /api/sellers/targets/history` - Get target history
- `GET /api/sellers/performance` - Get performance analytics

**Announcements**:
- `GET /api/sellers/announcements` - Get announcements
- `PUT /api/sellers/announcements/:id/read` - Mark as read

**Notifications**:
- `GET /api/sellers/notifications` - Get notifications
- `PUT /api/sellers/notifications/:id/read` - Mark as read

---

## Data Flow Patterns

### 1. Authentication Flow

**All Modules** (except Admin):
1. User enters phone number
2. Frontend calls: `POST /api/{module}/auth/request-otp`
3. Backend generates OTP, sends SMS (or logs in dev)
4. Frontend calls: `POST /api/{module}/auth/verify-otp`
5. Backend returns JWT token
6. Frontend stores token in localStorage
7. Frontend updates context state (`AUTH_LOGIN` action)
8. Navigate to dashboard

**Admin Module**:
1. Admin enters phone (Step 1)
2. Frontend calls: `POST /api/admin/auth/login`
3. Admin requests OTP (Step 2)
4. Frontend calls: `POST /api/admin/auth/request-otp`
5. Admin verifies OTP
6. Frontend calls: `POST /api/admin/auth/verify-otp`
7. Backend returns JWT token
8. Navigate to dashboard

---

### 2. Order Creation Flow

**User Creates Order**:
1. User adds products to cart
2. User proceeds to checkout
3. Frontend calls: `POST /api/users/vendors/assign` (20km radius check)
4. Frontend calls: `POST /api/users/vendors/check-stock` (stock verification)
5. User selects payment preference (30% or 100%)
6. Frontend calls: `POST /api/users/payments/create-intent`
7. User completes payment
8. Frontend calls: `POST /api/users/payments/confirm`
9. Frontend calls: `POST /api/users/orders` (create order)
10. Backend assigns vendor, creates order
11. Vendor receives order notification (real-time)

**Vendor Handles Order**:
1. Vendor views orders
2. Vendor accepts/rejects/partially accepts
3. If rejected → Order escalated to Admin
4. If partially accepted → Order split (Vendor order + Admin order)
5. Vendor updates status: Awaiting → Dispatched → Delivered
6. Status updates pushed to User (real-time)

**Commission Calculation**:
1. Order marked as delivered and fully paid
2. Backend calculates commission based on:
   - User's monthly purchase total
   - Commission tier (2% if ≤₹50,000, 3% if >₹50,000)
3. Commission added to Seller wallet
4. Seller receives notification

---

### 3. Vendor Credit Purchase Flow

1. Vendor requests credit purchase (min ₹50,000)
2. Frontend calls: `POST /api/vendors/credit/purchase`
3. Backend creates CreditPurchase request (status: pending)
4. Admin views purchase request
5. Admin approves/rejects
6. If approved:
   - Vendor credit used increased
   - Inventory items added to vendor
   - Notification sent to vendor
7. If rejected:
   - Notification sent to vendor
   - No changes to credit/inventory

---

### 4. Seller Withdrawal Flow

1. Seller requests withdrawal from wallet
2. Frontend calls: `POST /api/sellers/wallet/withdrawals/request`
3. Backend creates WithdrawalRequest (status: pending)
4. Admin views withdrawal request
5. Admin approves/rejects
6. If approved:
   - Create payment intent
   - Process payment
   - Update seller wallet balance
   - Notification sent to seller
7. If rejected:
   - Notification sent to seller
   - Wallet unchanged

---

### 5. Product Assignment Flow

1. Admin creates product
2. Admin assigns product to vendor (region-wise)
3. Frontend calls: `POST /api/admin/products/:productId/assign`
4. Backend creates ProductAssignment
5. Backend creates Inventory entry for vendor
6. Vendor sees new product in inventory
7. User can see product if:
   - Product is active (visibility toggle)
   - Vendor is within 20km of user location
   - Product is in stock

---

### 6. Real-Time Data Flow

**Real-Time Updates**:
- Order status updates (Vendor → User)
- Payment reminders (System → User)
- Commission credits (System → Seller)
- Admin announcements (Admin → All)
- Vendor purchase approvals (Admin → Vendor)
- Order notifications (System → Vendor)

**Implementation**:
- Uses WebSocket/SSE (configured in `config/realtime.js`)
- Each module has real-time connection in context
- Notifications pushed to respective dashboards

---

## Module Dependencies

### Dependency Graph

```
Admin (Independent)
  ├── Creates products
  ├── Approves vendors
  ├── Approves sellers
  └── Manages orders

Vendor (Depends on Admin)
  ├── Receives product assignments
  ├── Receives credit policy
  ├── Receives orders (from Users)
  └── Updates order status

Seller (Depends on Admin)
  ├── Receives target from Admin
  ├── Receives withdrawal approvals
  └── Earns commissions (from User orders)

User (Depends on All)
  ├── Views products (from Admin)
  ├── Gets assigned vendor (20km radius)
  ├── Creates orders (Vendor fulfills)
  └── Links to Seller (for commissions)
```

### Data Synchronization Points

1. **Product Assignment**: Admin → Vendor Inventory
2. **Order Assignment**: User Location → Vendor (20km)
3. **Order Status**: Vendor → User (Real-time)
4. **Commission**: User Order → Seller Wallet (Background)
5. **Credit Purchase**: Vendor Request → Admin Approval → Vendor Inventory
6. **Withdrawal**: Seller Request → Admin Approval → Seller Wallet

---

## Key Business Rules

### Vendor Assignment
- **20km radius rule**: Only one vendor per 20km zone
- Geospatial query using MongoDB `$near`
- Vendor must be `approved` and `isActive`

### Payment Options
- **Full Payment (100%)**: Free delivery (₹0)
- **Split Payment (30% + 70%)**: Delivery charge ₹50

### Minimum Order Value
- **Cart minimum**: ₹2,000
- Validation before checkout

### Commission System
- **Monthly reset**: Day 1 of each month
- **Per user per month**:
  - ≤₹50,000: 2% commission
  - >₹50,000: 3% commission (on entire month)

### Credit System
- **Minimum purchase**: ₹50,000
- Admin approval required
- Credit limit set by Admin
- Penalties for overdue payments

### Order Fulfillment
- **Full availability**: Vendor fulfills
- **No availability**: Escalated to Admin
- **Partial availability**: Order split (Vendor + Admin)

---

## State Management

### Context Providers

Each module has its own context provider:
- `AdminProvider`: Admin state, filters, notifications
- `UserProvider`: User profile, cart, orders, vendor assignment
- `VendorProvider`: Vendor profile, orders, inventory, credit
- `SellerProvider`: Seller profile, referrals, wallet, targets

### State Updates

1. **API Calls**: Modules call their respective API services
2. **Context Dispatch**: API responses update context state
3. **Component Re-render**: Components consume context state
4. **Real-Time Updates**: WebSocket/SSE push updates to context

---

## File Organization

### Frontend Module Structure

Each module follows this structure:
```
module/
├── index.js              # Public exports
├── context/              # Context provider
│   └── {Module}Context.jsx
├── routes/               # Route components
│   └── {Module}DashboardPage.jsx
├── pages/                # Page components
│   ├── {Module}Dashboard.jsx
│   ├── {Module}Login.jsx
│   └── views/            # View components
├── components/           # Module-specific components
├── services/             # API service functions
│   ├── {module}Api.js
│   └── {module}Data.js
└── hooks/                # Custom hooks
    └── use{Module}Api.js
```

### Backend Module Structure

Each module follows this structure:
```
routes/
└── {module}.js          # Route definitions

controllers/
└── {module}Controller.js  # Business logic

models/
└── {Model}.js           # MongoDB schemas
```

---

## Important Notes

1. **Authentication**: JWT tokens stored in localStorage
2. **Real-Time**: WebSocket/SSE for live updates
3. **Location Services**: MongoDB geospatial queries (Google Maps API optional)
4. **Payment Gateway**: Razorpay integration (dummy logic in dev)
5. **SMS Service**: SMS India Hub (dummy logic in dev)
6. **Monthly Resets**: Commission tallies reset on day 1 of each month

---

*Last Updated: 2024*
*Document Version: 1.0*

