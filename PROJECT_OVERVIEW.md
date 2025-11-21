1\. User Application Flow
-------------------------

### 1.1 Onboarding & Authentication

1.  User installs IRA SATHI app.
    
2.  On launch → language selection via Google Translator API.
    
3.  OTP login using Firebase/SMS.
    
4.  User may optionally enter **IRA Partner ID** (previously Seller ID).
    
    *   All user purchases link to the IRA Partner for monthly commissions.
        
    *   ID stored in user profile.
        

### 1.2 Dashboard & Product Browsing

1.  User lands on Home screen with:
    
    *   Categories
        
    *   Offers
        
    *   Popular fertilizers
        
2.  All dashboards (User, Vendor, IRA Partner) include:
    
    *   **Solid light-green header background**
        
    *   **Light UI elements** for visibility
        
    *   **Centered watermark** (ultra-light brand logo)
        
3.  User browses:
    
    *   Product lists with vendor info, price, stock
        
    *   Delivery timelines (3 hr / 4 hr / 1 day)
        
4.  User views product → adds to cart.
    

2\. Cart & Checkout Flow
------------------------

### 2.1 Cart Validation

*   Minimum order value: **₹2,000**
    
*   Below threshold → alert shown.
    

### 2.2 Checkout (Updated Logic)

During checkout, system auto-assigns vendor based on user's location using a **strict 20 km radius rule** (one vendor allowed per zone).

Checkout now shows **two payment options**:

#### **Option 1: Full Payment (100%)**

*   User pays entire amount.
    
*   **Delivery becomes free** (₹0).
    
*   Standard delivery timeline applies.
    
*   Payment status: **Fully Paid**.
    

#### **Option 2: Split Payment (30% + 70%)**

*   User pays **30% advance**.
    
*   Delivery charge: **₹50**.
    
*   Remaining **70%** payable after delivery.
    
*   Payment status: **Partially Paid**.
    

### 2.3 Payment Gateway

*   Razorpay / Paytm / Stripe
    
*   After successful payment:
    
    *   Order created
        
    *   Passed to Vendor / Admin based on stock availability
        

3\. Order Fulfillment Flow
--------------------------

### 3.1 Vendor Stock Verification

Vendor checks item availability:

*   **Full Availability** → Accepts entire order
    
*   **No Availability** → Rejects → Order shifts to Admin
    
*   **Partial Availability** → Selects items to accept
    
    *   System automatically splits into:
        
        *   **Vendor Order**
            
        *   **Admin Order**
            
    *   User notified of partial fulfillment
        

### 3.2 Delivery Status Updates

Vendor manually updates each order:

*   **Awaiting**
    
*   **Dispatched**
    
*   **Delivered**
    

These statuses are visible live to the user.

### 3.3 Delivery Policies (Updated)

*   Standard delivery fee: **₹50**
    
*   Delivery time: **within 24 hours**
    
*   Users choosing **100% payment** receive:
    
    *   **Free delivery**
        
    *   Same 24-hour timeline
        

Deliveries may be combined or separate depending on Vendor/Admin involvement.

### 3.4 Remaining Payment (For Split Orders)

1.  After delivery → system sends 70% payment reminder.
    
2.  User pays outstanding amount.
    
3.  Order marked **Fully Paid & Completed**.
    

### 3.5 IRA Partner Commission Integration

When an order is fully paid:

1.  System checks linked IRA Partner ID.
    
2.  Tracks each user's **monthly cumulative purchase total**, reset at the start of every month.
    
3.  Commission slabs per user per month:
    
    *   Up to **₹50,000** → **2%**
        
    *   Above **₹50,000** → **3%**
        
4.  Commission auto-added to IRA Partner’s wallet instantly.
    

4\. Vendor Panel Flow
---------------------

### Key Vendor Features

*   Green header + watermark UI theme
    
*   Inventory management
    
*   Order management (accept/reject/partial)
    
*   Manual status updates (Awaiting → Dispatched → Delivered)
    
*   Stock purchase from Admin (min ₹50,000)
    
*   Credit limit handling & penalties
    
*   Region-wise analytics (20 km coverage enforcement)
    
*   Payment and order insights
    

5\. IRA Partner Panel Flow (Former Seller Panel)
------------------------------------------------

### Updated Branding

*   “Seller” fully replaced with **“IRA Partner”**
    
*   Dashboard carries green header + watermark
    

### Features

*   Referred users list
    
*   Monthly purchase tracking (auto-reset)
    
*   Commission tracking based on slab logic
    
*   Wallet + withdrawal requests
    
*   Monthly targets and achievements
    
*   Notifications for commissions, targets, announcements
    

6\. Admin Panel Flow
--------------------

### Admin Capabilities

*   Dashboard overview
    
*   Product management (pricing, stock, vendor assignment)
    
*   Vendor management
    
    *   Approvals
        
    *   Radius check (20 km rule)
        
    *   Credit limits and penalties
        
*   IRA Partner management
    
    *   IDs
        
    *   Commissions
        
    *   Targets
        
*   Order & payment management
    
    *   100% and 30/70 flows supported
        
    *   Delivery fee rules
        
*   Monthly reset for user-linked IRA Partner tallies
    
*   Reporting and analytics
    

7\. Technology Layer (Updated)
------------------------------

*   Multi-language support (Google Translator API)
    
*   OTP via Firebase/SMS
    
*   Payment Gateway supports both payment modes
    
*   Vendor radius check via Google Maps API
    
*   Monthly reset cron for IRA Partner tallies
    
*   UI theming (green headers + watermark) applied globally
    
*   Rebranded labels ("IRA Partner") across the system
    

8\. Unified End-to-End Summary
------------------------------

### Order Flow
`   User → Cart → Checkout          ├── Full Payment (100%) → Free Delivery → Vendor/Admin Fulfillment          └── 30/70 Payment → Delivery (₹50) → Vendor/Admin Fulfillment  Vendor → Stock Check → Accept / Reject / Partial → Status Updates → Delivery  After Delivery:      ├── If split order → 70% payment requested      ├── User pays balance      └── IRA Partner commission auto-credited (monthly rules)   `

---

## Backend Application Flow

### System Architecture

The backend is built using **Node.js** with **Express.js** framework and **MongoDB** database. All API endpoints follow RESTful principles and are organized by module (Admin, Vendor, Seller, User).

### Backend Implementation Status

#### ✅ Completed Components

1. **Project Structure**
   - Directory structure with models, routes, controllers, services, middleware, config, utils
   - All workflow files scaffolded (Admin, Vendor, Seller, User)
   - Routes registered in main `index.js`

2. **Configuration**
   - MongoDB connection setup (`config/database.js`)
   - SMS India Hub service for OTP (`config/sms.js`)
   - Real-time push notifications placeholder (`config/realtime.js`)
   - System constants defined (`utils/constants.js`)
   - Global error handler (`middleware/errorHandler.js`)

3. **Models Created**
   - `Admin.js` - Admin schema with two-step authentication
   - `Vendor.js` - Vendor schema with geospatial indexing
   - `User.js` - User schema with IRA Partner ID linking
   - `Seller.js` - Seller (IRA Partner) schema with wallet and commission structure

4. **Routes & Controllers Scaffolded**
   - All API routes defined for all 4 modules
   - Controller functions scaffolded with TODO markers
   - Authentication flows partially implemented (OTP generation, verification)

#### ⏳ Pending Implementation

- Shared models (Product, Order, Payment, Address, Cart, etc.)
- JWT authentication middleware
- Detailed controller business logic
- Service layer for complex operations
- **Payment gateway integration** ⚠️ (Dummy logic active, requires gateway access)
- **SMS India Hub integration** ⚠️ (Dummy logic active, requires API key)
- **Google Maps API integration** ⚠️ (Using MongoDB geospatial as workaround, requires API key for enhanced features)
- Real-time notification system

### Backend API Structure

#### Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.irasathi.com/api`

#### API Endpoint Organization

**Admin Endpoints** (`/api/admin/*`)
- Authentication, Dashboard, Products, Vendors, Sellers, Users, Orders, Payments, Finance, Analytics

**Vendor Endpoints** (`/api/vendors/*`)
- Authentication, Dashboard, Orders, Inventory, Credit Management, Reports

**Seller Endpoints** (`/api/sellers/*`)
- Authentication, Dashboard, Wallet, Referrals, Commissions, Targets, Performance

**User Endpoints** (`/api/users/*`)
- Authentication, Products, Cart, Orders, Payments, Addresses, Notifications, Support

### Authentication Flow (Backend)

#### Admin Authentication (Two-Step)
1. **Step 1**: `POST /api/admin/auth/login` - Email/Password verification
2. **Step 2**: `POST /api/admin/auth/request-otp` - OTP sent to email
3. **Step 2**: `POST /api/admin/auth/verify-otp` - OTP verification → JWT token

#### Vendor/Seller/User Authentication (OTP-Based)
1. `POST /api/{module}/auth/request-otp` - OTP sent to phone (SMS India Hub)
2. `POST /api/{module}/auth/verify-otp` or `/register` - OTP verification → JWT token

### Data Flow Patterns

#### Cross-Role Data Exchange

**Admin ↔ Vendor:**
- Admin approves vendor registration → Vendor status updated
- Admin sets credit policy → Vendor credit limits updated
- Vendor requests purchase → Admin approves/rejects → Vendor inventory updated

**Admin ↔ Seller:**
- Admin creates/approves seller → Seller activated
- Admin sets monthly target → Seller dashboard updated
- Seller requests withdrawal → Admin approves/rejects → Seller wallet updated

**Admin ↔ User:**
- Admin views all users → User data fetched
- Admin blocks user → User access revoked
- User creates order → Admin dashboard shows order (if escalated)

**Vendor ↔ User:**
- User places order → Vendor receives order notification
- Vendor updates order status → User dashboard shows real-time status
- Vendor checks stock → User sees availability

**Seller ↔ User:**
- User registers with Seller ID → Seller referral count updated
- User completes order → Seller commission calculated → Seller wallet credited
- Seller dashboard shows user purchase tallies (monthly reset)

### Order Processing Flow (Backend)

```
User Order Creation:
1. POST /api/users/orders
   → Validate minimum order (₹2,000)
   → Assign vendor based on location (20km radius)
   → Check vendor stock for each item
   → Create order with payment preference (30% or 100%)

Stock Availability Check:
2. For each item:
   - Full Availability → Order assigned to vendor
   - No Availability → Order escalated to admin
   - Partial Availability → Order split:
     * Vendor Order (items in stock)
     * Admin Order (items out of stock)

Payment Processing:
3. POST /api/users/payments/create-intent
   → Create payment intent (Razorpay/Paytm/Stripe)
   → POST /api/users/payments/confirm
   → Verify payment → Update order payment status

Order Fulfillment:
4. Vendor accepts/rejects/partially accepts
   → POST /api/vendors/orders/:orderId/accept
   → POST /api/vendors/orders/:orderId/reject
   → POST /api/vendors/orders/:orderId/accept-partial
   → Order status updates reflected in User dashboard

Delivery Tracking:
5. PUT /api/vendors/orders/:orderId/status
   → Status: Awaiting → Dispatched → Delivered
   → Real-time sync to User dashboard

Commission Calculation:
6. Order completed → Calculate Seller commission
   → Monthly purchase tally updated
   → Tiered commission (2% or 3%) applied
   → Seller wallet credited
```

### Real-Time Updates (Backend)

**WebSocket/SSE Infrastructure** (Placeholder Ready)
- Order status updates (Vendor → User)
- Payment reminders (System → User)
- Commission credits (System → Seller)
- Admin announcements (Admin → All)
- Vendor purchase approvals (Admin → Vendor)
- Order notifications (System → Vendor)

---

## Prerequisites & External Service Dependencies

### ⚠️ Important: Services Requiring API Access

The following external services are required for full system functionality. **Dummy/mock implementations should be used during development** until API keys and access are obtained.

### 1. SMS India Hub API (OTP Service)

**Status:** ⏳ **Pending API Key**

**Purpose:**
- Send OTP codes for authentication (Admin, Vendor, Seller, User)
- Send SMS notifications (order updates, payment reminders, etc.)

**Current Implementation:**
- ✅ SMS service structure created (`Backend/config/sms.js`)
- ✅ OTP generation logic implemented
- ⚠️ **Dummy Logic Active**: SMS sending currently logs OTP to console in development mode
- ⚠️ **Flag for Change**: Replace dummy logic with actual SMS India Hub API calls when API key is obtained

**Required Configuration:**
```env
SMS_INDIA_HUB_API_URL=https://api.smsindiahub.in/api/v3
SMS_INDIA_HUB_API_KEY=your_api_key_here  # ⚠️ TO BE OBTAINED
SMS_INDIA_HUB_SENDER_ID=IRASAT
```

**Implementation Notes:**
- Current code in `config/sms.js` has fallback for development (logs OTP instead of sending)
- Production will fail if API key is not configured
- **TODO**: Replace `console.log` fallback with actual API integration once key is available

**Files to Update When API Key is Obtained:**
- `Backend/config/sms.js` - Uncomment actual API calls, remove development fallback

**Affected Endpoints:**
- All authentication endpoints (`/api/*/auth/request-otp`)
- All registration endpoints
- Notification sending functionality

---

### 2. Payment Gateway Integration

**Status:** ⏳ **Pending Gateway Access**

**Purpose:**
- Process advance payments (30% or 100%)
- Process remaining payments (70%)
- Handle payment confirmations and refunds

**Supported Gateways:**
- **Razorpay** (Primary)
- **Paytm** (Secondary)
- **Stripe** (Optional)

**Current Implementation:**
- ⚠️ **Dummy Logic Active**: Payment intents and confirmations are mocked
- ⚠️ **Flag for Change**: Replace with actual gateway SDK integration when access is obtained

**Required Configuration:**
```env
# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id  # ⚠️ TO BE OBTAINED
RAZORPAY_KEY_SECRET=your_razorpay_key_secret  # ⚠️ TO BE OBTAINED

# Paytm
PAYTM_MERCHANT_ID=your_paytm_merchant_id  # ⚠️ TO BE OBTAINED
PAYTM_MERCHANT_KEY=your_paytm_merchant_key  # ⚠️ TO BE OBTAINED

# Stripe (Optional)
STRIPE_PUBLIC_KEY=your_stripe_public_key  # ⚠️ TO BE OBTAINED
STRIPE_SECRET_KEY=your_stripe_secret_key  # ⚠️ TO BE OBTAINED
```

**Implementation Notes:**
- Payment endpoints currently return mock responses
- Payment confirmation logic needs actual gateway SDK integration
- **TODO**: Install gateway SDKs (razorpay, paytm-nodejs, stripe) and implement actual payment flows

**Files to Update When Gateway Access is Obtained:**
- `Backend/controllers/userController.js` - Payment intent and confirmation functions
- `Backend/services/paymentService.js` - Create service file with gateway integration
- Install packages: `npm install razorpay paytm-nodejs stripe`

**Payment Flow (To be Implemented):**
1. Create payment intent → Gateway API call
2. User completes payment on frontend → Gateway callback
3. Verify payment webhook → Update order payment status
4. Handle refunds for cancellations

**Affected Endpoints:**
- `POST /api/users/payments/create-intent` - Create payment intent (30% or 100%)
- `POST /api/users/payments/confirm` - Confirm advance payment
- `POST /api/users/payments/create-remaining` - Create remaining payment intent (70%)
- `POST /api/users/payments/confirm-remaining` - Confirm remaining payment

---

### 3. Google Maps API

**Status:** ⏳ **Pending API Key**

**Purpose:**
- Location verification for vendor registration
- Geospatial queries for vendor assignment (20km radius)
- Address geocoding (convert address to coordinates)
- Reverse geocoding (convert coordinates to address)

**Current Implementation:**
- ⚠️ **Dummy Logic Active**: Geospatial queries use MongoDB's built-in geospatial features (works without Maps API)
- ⚠️ **Flag for Change**: Add Maps API for address validation, geocoding, and enhanced location services

**Required Configuration:**
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key  # ⚠️ TO BE OBTAINED
```

**Implementation Notes:**
- MongoDB geospatial queries (`$near`) work without Maps API for basic radius checks
- Maps API needed for:
  - Address validation during registration
  - Geocoding (address → coordinates) for vendor/user addresses
  - Reverse geocoding (coordinates → address) for display
  - Enhanced location services (route calculation, distance matrix)
- **TODO**: Integrate Google Maps API for address validation and geocoding

**Files to Update When API Key is Obtained:**
- `Backend/services/locationService.js` - Create service file with Maps API integration
- `Backend/controllers/vendorController.js` - Add address validation in registration
- `Backend/controllers/userController.js` - Add geocoding for address management
- Install package: `npm install @googlemaps/google-maps-services-js`

**Current Workaround:**
- Vendor registration accepts coordinates directly (frontend can use Maps API)
- Geospatial queries work with MongoDB (no external API needed for radius checks)
- Address validation can be added later when Maps API is available

**Affected Endpoints:**
- `POST /api/vendors/auth/register` - Vendor registration (location validation)
- `POST /api/users/vendors/assign` - Vendor assignment (20km radius)
- `POST /api/users/addresses` - Address management (geocoding)

---

### Development Strategy for External Services

#### Phase 1: Development with Dummy Logic (Current)
1. ✅ Implement all business logic with mock/dummy responses
2. ✅ Structure code to easily swap dummy logic with real API calls
3. ✅ Add clear TODO comments and flags for replacement
4. ✅ Test workflows end-to-end with dummy data

#### Phase 2: Integration When Access is Obtained
1. ⏳ Obtain API keys and credentials
2. ⏳ Update environment variables
3. ⏳ Replace dummy logic with actual API calls
4. ⏳ Test with real services
5. ⏳ Handle error cases and edge cases

#### Code Structure for Easy Replacement

**Example Pattern (SMS Service):**
```javascript
// Current (Dummy)
const sendOTP = async (phone, otp) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`OTP for ${phone}: ${otp}`); // ⚠️ DUMMY - Remove when API key obtained
    return { success: true };
  }
  // TODO: Uncomment when SMS_INDIA_HUB_API_KEY is obtained
  // return await axios.post(SMS_API_URL, { ... });
};

// Future (Real)
const sendOTP = async (phone, otp) => {
  const response = await axios.post(SMS_API_URL, {
    api_key: process.env.SMS_INDIA_HUB_API_KEY,
    to: phone,
    message: `Your OTP is ${otp}`,
  });
  return response.data;
};
```

**Example Pattern (Payment Service):**
```javascript
// Current (Dummy)
const createPaymentIntent = async (orderId, amount) => {
  // ⚠️ DUMMY - Replace with actual gateway SDK when access obtained
  return {
    paymentIntentId: 'mock_' + Date.now(),
    clientSecret: 'mock_secret',
  };
};

// Future (Real)
const createPaymentIntent = async (orderId, amount) => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  const order = await razorpay.orders.create({ amount, currency: 'INR' });
  return { paymentIntentId: order.id, clientSecret: order.id };
};
```

---

### Checklist: External Service Integration

**Before Production Deployment:**
- [ ] Obtain SMS India Hub API key
- [ ] Replace SMS dummy logic with actual API calls
- [ ] Test OTP delivery in production environment
- [ ] Obtain Payment Gateway credentials (Razorpay/Paytm)
- [ ] Install and configure payment gateway SDKs
- [ ] Replace payment dummy logic with actual gateway integration
- [ ] Test payment flows (advance, remaining, refunds)
- [ ] Set up payment webhooks for verification
- [ ] Obtain Google Maps API key
- [ ] Integrate Maps API for address validation and geocoding
- [ ] Test location services (vendor assignment, address validation)
- [ ] Update all environment variables in production
- [ ] Remove all dummy/mock logic and development fallbacks

---

### Notes for Development Team

1. **All dummy logic is clearly flagged** with `⚠️ DUMMY` or `TODO` comments
2. **Search for flags**: Use `grep -r "DUMMY\|TODO.*API\|Flag for Change" Backend/` to find all locations
3. **Environment variables**: All required keys are documented in `.env.template`
4. **Testing**: Dummy logic allows full workflow testing without external dependencies
5. **Production readiness**: System will not function in production until all API keys are obtained and integrated

---

## Backend Development Strategy

### Overview

This strategy outlines the step-by-step implementation approach, focusing on **Admin → Seller → Vendor → User** workflow, ensuring all interdependencies and cross-role data exchanges are properly handled.

### System Relationships Reference

Based on the system architecture diagram:
- **Admin ↔ Vendor** (Bidirectional): Vendor management, credit policy, purchase approvals
- **Admin ↔ Seller** (Bidirectional): Seller management, target setting, withdrawal approvals
- **Admin ↔ User** (Bidirectional): User management, order oversight, support
- **Vendor ↔ User** (Bidirectional): Order fulfillment, status updates, stock availability
- **Seller ↔ User** (Bidirectional): Referral tracking, commission calculation

---

## Phase 1: Admin Dashboard Implementation

### 1.1 Admin Authentication

**Routes Needed:**
- ✅ `POST /api/admin/auth/login` (Step 1: Email/Password)
- ✅ `POST /api/admin/auth/request-otp` (Step 2: Request OTP)
- ✅ `POST /api/admin/auth/verify-otp` (Step 2: Verify OTP)
- ✅ `POST /api/admin/auth/logout`
- ✅ `GET /api/admin/auth/profile`

**Data Required:**
- Email, password (Step 1)
- OTP code (Step 2)

**Authentication Logic:**
- Verify email/password from Admin model
- Generate OTP, store with expiry (5 minutes)
- Send OTP to email
  - ⚠️ **Email Service**: Currently using dummy logic, implement email service or use SMS India Hub
  - ⚠️ **Flag for Change**: Replace with actual email/SMS service when available
- Verify OTP, generate JWT token
- Token contains: adminId, email, role

**Authorization:**
- All admin endpoints require JWT token
- Role-based access: super_admin > admin > manager

**Impact on Other Dashboards:**
- None (authentication only)

**Implementation Status:** ✅ Partially implemented (OTP logic done, email service pending, JWT pending)

---

### 1.2 Admin Dashboard Overview

**Routes Needed:**
- ✅ `GET /api/admin/dashboard`

**Data Required:**
- Aggregated counts: Total Users, Vendors, Sellers
- Order statistics: Total Orders, Pending Orders
- Financial: Total Sales, Revenue, Pending Payments, Outstanding Credits

**Data Sources:**
- User.countDocuments()
- Vendor.countDocuments({ status: 'approved' })
- Seller.countDocuments({ status: 'approved' })
- Order.aggregate() - Total orders, revenue by status
- Payment.aggregate() - Pending payments
- CreditPurchase.aggregate() - Outstanding credits

**Authorization:**
- Admin only (JWT required)

**Impact on Other Dashboards:**
- None (read-only aggregation)

**Implementation TODO:**
- [ ] Create aggregation queries
- [ ] Calculate pending orders, payments, credits
- [ ] Return dashboard summary object

---

### 1.3 Product Management

**Routes Needed:**
- ✅ `GET /api/admin/products` - List all products (with filters)
- ✅ `GET /api/admin/products/:productId` - Get product details
- ✅ `POST /api/admin/products` - Create product
- ✅ `PUT /api/admin/products/:productId` - Update product
- ✅ `DELETE /api/admin/products/:productId` - Delete product
- ✅ `POST /api/admin/products/:productId/assign` - Assign to vendor
- ✅ `PUT /api/admin/products/:productId/visibility` - Toggle active/inactive

**Data Required:**
- Product: name, description, category, priceToVendor, priceToUser, stock, images, expiry
- Assignment: productId, vendorId, region

**Authorization:**
- Admin only

**Impact on Other Dashboards:**
- **Vendor Dashboard**: When product assigned → Vendor inventory updated
- **User Dashboard**: Product visibility affects product listing

**Models Needed:**
- `Product.js` - Product schema
- `ProductAssignment.js` - Vendor-product assignment

**Implementation TODO:**
- [ ] Create Product model
- [ ] Create ProductAssignment model
- [ ] Implement CRUD operations
- [ ] Vendor assignment logic (updates Vendor inventory)
- [ ] Visibility toggle (affects User product listing)

---

### 1.4 Vendor Management

**Routes Needed:**
- ✅ `GET /api/admin/vendors` - List all vendors (with filters)
- ✅ `GET /api/admin/vendors/:vendorId` - Get vendor details
- ✅ `POST /api/admin/vendors/:vendorId/approve` - Approve vendor
- ✅ `POST /api/admin/vendors/:vendorId/reject` - Reject vendor
- ✅ `PUT /api/admin/vendors/:vendorId/credit-policy` - Set credit policy
- ✅ `GET /api/admin/vendors/:vendorId/purchases` - Get vendor purchase requests
- ✅ `POST /api/admin/vendors/purchases/:requestId/approve` - Approve purchase
- ✅ `POST /api/admin/vendors/purchases/:requestId/reject` - Reject purchase

**Data Required:**
- Vendor: name, phone, location (coordinates), status
- Credit Policy: limit, repaymentDays, penaltyRate
- Purchase Request: items, totalAmount (min ₹50,000)

**Authorization:**
- Admin only

**Vendor Registration Impact:**
- When Admin approves vendor → Vendor status = 'approved', isActive = true
- **Geographic Check**: Verify no vendor within 20km radius (geospatial query)
- **Vendor Dashboard**: Vendor can now login and access dashboard

**Credit Policy Impact:**
- When Admin sets credit policy → Vendor.creditPolicy updated
- **Vendor Dashboard**: Credit limit, due date visible

**Purchase Approval Impact:**
- When Admin approves purchase → Vendor.creditUsed increased, Vendor inventory items added
- **Vendor Dashboard**: Credit balance updated, inventory updated
- When Admin rejects purchase → Vendor receives notification, no changes

**Models Needed:**
- `Vendor.js` ✅ (Created)
- `CreditPurchase.js` - Purchase request schema

**Implementation TODO:**
- [ ] Vendor approval logic (geographic check, status update)
  - ⚠️ **Maps API**: Currently using MongoDB geospatial queries, add Maps API validation when key obtained
- [ ] Credit policy update logic
- [ ] Create CreditPurchase model
- [ ] Purchase approval logic (update vendor credit, add inventory)
- [ ] Send notifications to vendor on approval/rejection
  - ⚠️ **SMS Service**: Replace dummy SMS logic with actual SMS India Hub API when key obtained

---

### 1.5 Seller (IRA Partner) Management

**Routes Needed:**
- ✅ `GET /api/admin/sellers` - List all sellers
- ✅ `GET /api/admin/sellers/:sellerId` - Get seller details
- ✅ `POST /api/admin/sellers` - Create seller (assign ID, target)
- ✅ `PUT /api/admin/sellers/:sellerId` - Update seller
- ✅ `PUT /api/admin/sellers/:sellerId/target` - Set monthly target
- ✅ `GET /api/admin/sellers/:sellerId/withdrawals` - Get withdrawal requests
- ✅ `POST /api/admin/sellers/withdrawals/:requestId/approve` - Approve withdrawal
- ✅ `POST /api/admin/sellers/withdrawals/:requestId/reject` - Reject withdrawal

**Data Required:**
- Seller: name, phone, sellerId (unique), area, monthlyTarget
- Withdrawal Request: amount, sellerId

**Authorization:**
- Admin only

**Seller Creation Impact:**
- When Admin creates seller → Seller.sellerId assigned (format: IRA-1001 or SLR-1001)
- Seller status = 'approved', isActive = true
- **Seller Dashboard**: Seller can login with phone number

**Target Setting Impact:**
- When Admin sets target → Seller.monthlyTarget updated
- **Seller Dashboard**: Target progress calculated, displayed

**Withdrawal Approval Impact:**
- When Admin approves withdrawal → Seller.wallet.balance decreased, pending decreased
- **Seller Dashboard**: Wallet balance updated
- When Admin rejects withdrawal → Seller receives notification, wallet unchanged

**Models Needed:**
- `Seller.js` ✅ (Created)
- `WithdrawalRequest.js` - Withdrawal request schema

**Implementation TODO:**
- [ ] Seller creation logic (generate unique sellerId)
- [ ] Target update logic
- [ ] Create WithdrawalRequest model
- [ ] Withdrawal approval/rejection logic (update seller wallet)
- [ ] Send notifications to seller

---

### 1.6 User Management

**Routes Needed:**
- ✅ `GET /api/admin/users` - List all users (with filters)
- ✅ `GET /api/admin/users/:userId` - Get user details
- ✅ `PUT /api/admin/users/:userId/block` - Block/deactivate user

**Data Required:**
- User filters: status, sellerId, date range
- User details: profile, orders, payments, linked seller

**Authorization:**
- Admin only

**Block User Impact:**
- When Admin blocks user → User.isBlocked = true, isActive = false
- **User Dashboard**: User cannot login (authentication check)
- **Seller Dashboard**: User's orders still count for commission, but user cannot make new orders

**Implementation TODO:**
- [ ] User listing with filters
- [ ] User detail aggregation (orders, payments)
- [ ] Block user logic (update status, prevent login)

---

### 1.7 Order & Payment Management

**Routes Needed:**
- ✅ `GET /api/admin/orders` - List all orders (with filters)
- ✅ `GET /api/admin/orders/:orderId` - Get order details
- ✅ `PUT /api/admin/orders/:orderId/reassign` - Reassign order to different vendor
- ✅ `GET /api/admin/payments` - List all payments (with filters)

**Data Required:**
- Order filters: status, vendor, date, payment status
- Order details: items, vendor, user, payment, delivery status
- Payment filters: status, method, date

**Authorization:**
- Admin only

**Order Reassignment Impact:**
- When Admin reassigns order → Order.vendorId updated
- **Vendor Dashboard**: Original vendor's order removed, new vendor receives order notification
- **User Dashboard**: Order vendor updated, user notified

**Models Needed:**
- `Order.js` - Order schema (with partial fulfillment support)
- `Payment.js` - Payment schema

**Implementation TODO:**
- [ ] Create Order model (support partial fulfillment)
- [ ] Create Payment model
- [ ] Order listing with complex filters
- [ ] Order reassignment logic (notify vendors, update user)
- [ ] Payment listing and tracking

---

### 1.8 Finance & Credit Management

**Routes Needed:**
- ✅ `GET /api/admin/finance/credits` - Get all vendor credits
- ✅ `GET /api/admin/finance/recovery` - Get recovery status

**Data Required:**
- Vendor credit summary: totalOutstanding, overdue, dueSoon
- Recovery status: recoveryRate, pendingAmount, recoveredAmount

**Authorization:**
- Admin only

**Impact on Other Dashboards:**
- **Vendor Dashboard**: Credit status visible, penalties applied automatically

**Implementation TODO:**
- [ ] Credit aggregation query
- [ ] Recovery status calculation
- [ ] Automatic penalty calculation (scheduled job)

---

### 1.9 Analytics & Reporting

**Routes Needed:**
- ✅ `GET /api/admin/analytics` - Get analytics data
- ✅ `GET /api/admin/reports` - Generate reports (daily/weekly/monthly)

**Data Required:**
- Analytics: revenue trends, order trends, top vendors, top sellers
- Reports: CSV/PDF export

**Authorization:**
- Admin only

**Impact on Other Dashboards:**
- None (read-only)

**Implementation TODO:**
- [ ] Analytics aggregation queries
- [ ] Report generation (CSV/PDF)
- [ ] Time-based filtering (daily/weekly/monthly)

---

## Phase 2: Seller (IRA Partner) Dashboard Implementation

### 2.1 Seller Authentication

**Routes Needed:**
- ✅ `POST /api/sellers/auth/register` - Register (pending admin approval)
- ✅ `POST /api/sellers/auth/request-otp` - Request OTP
- ✅ `POST /api/sellers/auth/verify-otp` - Verify OTP
- ✅ `POST /api/sellers/auth/logout`
- ✅ `GET /api/sellers/auth/profile`

**Data Required:**
- Registration: name, phone, area
- Login: phone, otp

**Authentication Logic:**
- Generate OTP, send via SMS India Hub
  - ⚠️ **SMS Service**: Currently using dummy logic (logs OTP), replace with actual SMS India Hub API when key obtained
- Verify OTP, generate JWT token
- Check seller status (must be 'approved' and isActive = true)

**Authorization:**
- Seller endpoints require JWT token
- Only approved sellers can access dashboard

**Impact on Other Dashboards:**
- **Admin Dashboard**: Seller registration shows in pending approvals

**Implementation Status:** ✅ Partially implemented (OTP logic done, JWT pending)

---

### 2.2 Seller Dashboard Overview

**Routes Needed:**
- ✅ `GET /api/sellers/dashboard` - Overall summary
- ✅ `GET /api/sellers/dashboard/overview` - Referrals, sales, target
- ✅ `GET /api/sellers/dashboard/wallet` - Wallet balance
- ✅ `GET /api/sellers/dashboard/referrals` - Referral list
- ✅ `GET /api/sellers/dashboard/performance` - Performance metrics

**Data Required:**
- Total referrals count (users linked to sellerId)
- Total sales amount (from orders with sellerId)
- Current month target and achieved percentage
- Wallet balance and pending withdrawals

**Data Sources:**
- User.countDocuments({ sellerId: seller.sellerId })
- Order.aggregate() - Total sales where order.user.sellerId matches
- Seller.monthlyTarget, calculate achieved %
- Seller.wallet.balance, wallet.pending

**Authorization:**
- Seller only (own data)

**Impact on Other Dashboards:**
- **Admin Dashboard**: Seller performance visible in analytics

**Implementation TODO:**
- [ ] Aggregate user count by sellerId
- [ ] Calculate total sales from orders
- [ ] Calculate target progress percentage
- [ ] Fetch wallet data

---

### 2.3 Seller Wallet & Commissions

**Routes Needed:**
- ✅ `GET /api/sellers/wallet` - Wallet details
- ✅ `GET /api/sellers/wallet/transactions` - Transaction history
- ✅ `POST /api/sellers/wallet/withdraw` - Request withdrawal
- ✅ `GET /api/sellers/wallet/withdrawals` - Withdrawal requests

**Data Required:**
- Wallet: balance, pending
- Transactions: commission per user per month, date, amount
- Withdrawal Request: amount (must be ≤ balance)

**Authorization:**
- Seller only (own wallet)

**Commission Calculation Logic:**
- **Trigger**: When User order is completed (payment fully paid)
- **Monthly Reset**: On day 1 of each month, reset all user purchase tallies
- **Per User Per Month**: Calculate commission for each user separately
  - If user's monthly purchases ≤ ₹50,000: 2% commission
  - If user's monthly purchases > ₹50,000: 3% commission (on entire month's purchases)
- **Wallet Credit**: Add commission to Seller.wallet.balance
- **Transaction Record**: Create commission transaction record

**Withdrawal Request Impact:**
- When Seller requests withdrawal → Create WithdrawalRequest (status: pending)
- **Admin Dashboard**: Withdrawal appears in pending approvals
- When Admin approves → Seller.wallet.balance decreased, pending decreased
- When Admin rejects → Seller notified, wallet unchanged

**Models Needed:**
- `Commission.js` - Commission transaction schema
- `WithdrawalRequest.js` - Withdrawal request schema

**Impact on Other Dashboards:**
- **Admin Dashboard**: Withdrawal requests visible, approvals affect seller wallet
- **User Dashboard**: User purchases trigger commission (background process)

**Implementation TODO:**
- [ ] Create Commission model
- [ ] Create WithdrawalRequest model
- [ ] Commission calculation service (monthly reset, tiered rates)
- [ ] Wallet transaction history query
- [ ] Withdrawal request creation logic
- [ ] Monthly reset scheduler (day 1 of each month)

---

### 2.4 Seller Referrals

**Routes Needed:**
- ✅ `GET /api/sellers/referrals` - List all referrals (users)
- ✅ `GET /api/sellers/referrals/:referralId` - Get referral details (specific user)
- ✅ `GET /api/sellers/referrals/stats` - Referral statistics

**Data Required:**
- Referral list: user name, phone, total purchases, monthly purchases, commission earned
- Referral details: Purchase history, monthly tallies, commission breakdown

**Data Sources:**
- User.find({ sellerId: seller.sellerId })
- Order.aggregate() - Group by user, calculate monthly totals
- Commission.aggregate() - Commission per user per month

**Authorization:**
- Seller only (own referrals)

**Monthly Purchase Tally:**
- Each user's purchase tally resets on day 1 of each month
- All orders in the month contribute to tally
- Commission rate changes when threshold (₹50,000) is crossed

**Impact on Other Dashboards:**
- **User Dashboard**: User's linked sellerId visible in profile
- **Admin Dashboard**: Seller referral count visible

**Implementation TODO:**
- [ ] Aggregate users by sellerId
- [ ] Calculate monthly purchase tallies per user
- [ ] Show commission breakdown per user
- [ ] Handle monthly reset logic

---

### 2.5 Seller Target & Performance

**Routes Needed:**
- ✅ `GET /api/sellers/target` - Monthly target and progress
- ✅ `GET /api/sellers/performance` - Performance analytics

**Data Required:**
- Target: monthlyTarget (set by Admin), achieved amount, percentage
- Performance: orders count, active users, conversion rate, trends

**Data Sources:**
- Seller.monthlyTarget
- Order.aggregate() - Calculate total sales for current month
- Calculate achieved % = (achieved / target) * 100

**Authorization:**
- Seller only

**Impact on Other Dashboards:**
- **Admin Dashboard**: Seller performance tracked, targets visible

**Implementation TODO:**
- [ ] Calculate monthly achieved sales
- [ ] Calculate target progress percentage
- [ ] Performance metrics calculation
- [ ] Trend analysis (month-over-month)

---

## Phase 3: Vendor Dashboard Implementation

### 3.1 Vendor Authentication

**Routes Needed:**
- ✅ `POST /api/vendors/auth/register` - Register (pending admin approval)
- ✅ `POST /api/vendors/auth/request-otp` - Request OTP
- ✅ `POST /api/vendors/auth/verify-otp` - Verify OTP
- ✅ `POST /api/vendors/auth/logout`
- ✅ `GET /api/vendors/auth/profile`

**Data Required:**
- Registration: name, phone, location (coordinates, address)
- Login: phone, otp

**Authentication Logic:**
- Generate OTP, send via SMS India Hub
  - ⚠️ **SMS Service**: Currently using dummy logic (logs OTP), replace with actual SMS India Hub API when key obtained
- Verify OTP, generate JWT token
- Check vendor status (must be 'approved' and isActive = true)

**Geographic Validation:**
- During registration, check if vendor exists within 20km radius
- Use geospatial query: Vendor.find({ location: { $near: { $maxDistance: 20000 } } })
  - ⚠️ **Maps API**: Currently using MongoDB geospatial queries (works without Maps API)
  - Add Maps API for address validation and geocoding when key obtained
- If vendor exists → Reject registration
- Admin approval also checks this rule

**Authorization:**
- Vendor endpoints require JWT token
- Only approved vendors can access dashboard

**Impact on Other Dashboards:**
- **Admin Dashboard**: Vendor registration shows in pending approvals
- **User Dashboard**: Vendor availability affects order assignment

**Implementation Status:** ✅ Partially implemented (OTP logic done, geographic check scaffolded, JWT pending)

---

### 3.2 Vendor Dashboard Overview

**Routes Needed:**
- ✅ `GET /api/vendors/dashboard` - Overall summary

**Data Required:**
- Pending orders count
- Low stock alerts
- Credit balance and due date
- Recent activity

**Data Sources:**
- Order.countDocuments({ vendorId: vendor._id, status: 'pending' })
- Inventory.find() - Items with stock < threshold
- Vendor.creditLimit, creditUsed, creditPolicy.dueDate

**Authorization:**
- Vendor only (own data)

**Impact on Other Dashboards:**
- **Admin Dashboard**: Vendor performance visible

**Implementation TODO:**
- [ ] Aggregate pending orders
- [ ] Check low stock items
- [ ] Calculate credit status

---

### 3.3 Vendor Inventory Management

**Routes Needed:**
- ✅ `GET /api/vendors/inventory` - List inventory items
- ✅ `GET /api/vendors/inventory/:itemId` - Get item details
- ✅ `PUT /api/vendors/inventory/:itemId/stock` - Update stock manually
- ✅ `GET /api/vendors/inventory/stats` - Inventory statistics

**Data Required:**
- Inventory items: product, stock quantity, purchase price, selling price
- Stock update: itemId, new quantity

**Data Sources:**
- ProductAssignment.find({ vendorId: vendor._id }) - Products assigned by Admin
- Inventory model (productId, vendorId, stock, prices)

**Authorization:**
- Vendor only (own inventory)

**Inventory Assignment:**
- When Admin assigns product to vendor → Create Inventory entry
- **Vendor Dashboard**: New product appears in inventory

**Stock Update Impact:**
- When Vendor updates stock → Inventory.stock updated
- **User Dashboard**: Stock availability affects product listing
- **Order Processing**: Stock check uses updated quantity

**Models Needed:**
- `Inventory.js` - Vendor inventory schema
- `ProductAssignment.js` - Admin product assignment schema

**Impact on Other Dashboards:**
- **Admin Dashboard**: Vendor inventory visible (assigned products)
- **User Dashboard**: Stock availability affects order creation

**Implementation TODO:**
- [ ] Create Inventory model
- [ ] Create ProductAssignment model
- [ ] Inventory listing query (filter by vendorId)
- [ ] Stock update logic (validate quantity, update availability)

---

### 3.4 Vendor Order Management

**Routes Needed:**
- ✅ `GET /api/vendors/orders` - List orders (with filters)
- ✅ `GET /api/vendors/orders/:orderId` - Get order details
- ✅ `POST /api/vendors/orders/:orderId/accept` - Accept order (full)
- ✅ `POST /api/vendors/orders/:orderId/reject` - Reject order (escalate to Admin)
- ✅ `POST /api/vendors/orders/:orderId/accept-partial` - Partially accept
- ✅ `PUT /api/vendors/orders/:orderId/status` - Update status (Awaiting → Dispatched → Delivered)
- ✅ `GET /api/vendors/orders/stats` - Order statistics

**Data Required:**
- Order details: items, quantities, user info, payment status
- Acceptance: orderId, accepted items (for partial)
- Rejection: orderId, reason
- Status update: orderId, status (awaiting/dispatched/delivered)

**Order Assignment Logic:**
- When User creates order → System assigns vendor based on location (20km radius)
- Order.vendorId set, Order.status = 'pending'
- **Vendor Dashboard**: Vendor receives order notification

**Order Acceptance Impact:**
- **Full Acceptance**: Order.vendorId confirmed, Order.status = 'accepted'
- **Rejection**: Order.vendorId = null, Order.assignedTo = 'admin', Order.status = 'escalated'
  - **Admin Dashboard**: Order appears in escalated orders
  - **User Dashboard**: User notified of escalation
- **Partial Acceptance**: Order split:
  - Vendor Order: acceptedItems, Order.vendorId = vendor._id, Order.status = 'partially_accepted'
  - Admin Order: rejectedItems, Order.assignedTo = 'admin', Order.status = 'escalated', Order.parentOrderId = originalOrderId
  - **Admin Dashboard**: Admin order created for rejected items
  - **User Dashboard**: User notified of partial fulfillment

**Status Update Impact:**
- When Vendor updates status → Order.status updated, Order.statusTimeline appended
- **User Dashboard**: Real-time status update (WebSocket/SSE)
- Status flow: 'awaiting' → 'dispatched' → 'delivered'
- When status = 'delivered' → Trigger remaining payment (if partial payment order)

**Models Needed:**
- `Order.js` - Order schema (with partial fulfillment support)
- `OrderStatusTimeline.js` - Status history schema

**Impact on Other Dashboards:**
- **Admin Dashboard**: Order status visible, escalated orders appear
- **User Dashboard**: Real-time status updates, partial fulfillment notifications
- **Seller Dashboard**: Order completion triggers commission (background process)

**Implementation TODO:**
- [ ] Create Order model (support partial fulfillment)
- [ ] Create OrderStatusTimeline model
- [ ] Order assignment logic (20km radius geospatial query)
- [ ] Full acceptance logic
- [ ] Rejection logic (escalate to admin)
- [ ] Partial acceptance logic (order splitting)
- [ ] Status update logic (real-time sync)
- [ ] WebSocket/SSE integration for real-time updates

---

### 3.5 Vendor Credit Management

**Routes Needed:**
- ✅ `GET /api/vendors/credit` - Get credit info
- ✅ `POST /api/vendors/credit/purchase` - Request credit purchase (min ₹50,000)
- ✅ `GET /api/vendors/credit/purchases` - Get purchase requests
- ✅ `GET /api/vendors/credit/purchases/:requestId` - Get purchase details
- ✅ `GET /api/vendors/credit/history` - Get credit history

**Data Required:**
- Credit info: limit, used, remaining, penalty status, due date
- Purchase request: items[], totalAmount (validate ≥ ₹50,000)

**Data Sources:**
- Vendor.creditLimit, creditUsed, creditPolicy
- CreditPurchase.find({ vendorId: vendor._id })

**Authorization:**
- Vendor only (own credit)

**Credit Policy:**
- Set by Admin via `PUT /api/admin/vendors/:vendorId/credit-policy`
- **Vendor Dashboard**: Credit info visible

**Purchase Request Impact:**
- When Vendor requests purchase → Create CreditPurchase (status: pending)
- Validate totalAmount ≥ ₹50,000
- **Admin Dashboard**: Purchase request appears in pending approvals
- When Admin approves → Vendor.creditUsed increased, Inventory items added
- When Admin rejects → Vendor notified, credit unchanged

**Penalty Calculation:**
- If payment delayed beyond due date → Penalty calculated daily
- Penalty = (overdue amount * penaltyRate) / 100 per day
- **Admin Dashboard**: Penalties visible, auto-calculated

**Models Needed:**
- `CreditPurchase.js` - Purchase request schema
- `CreditTransaction.js` - Credit history schema

**Impact on Other Dashboards:**
- **Admin Dashboard**: Purchase requests visible, approvals affect vendor credit and inventory

**Implementation TODO:**
- [ ] Create CreditPurchase model
- [ ] Create CreditTransaction model
- [ ] Credit info query (calculate remaining, penalties)
- [ ] Purchase request creation (validate minimum amount)
- [ ] Penalty calculation logic (scheduled job)
- [ ] Credit history query

---

### 3.6 Vendor Reports & Analytics

**Routes Needed:**
- ✅ `GET /api/vendors/reports` - Get reports
- ✅ `GET /api/vendors/reports/analytics` - Get performance analytics

**Data Required:**
- Reports: orders, sales, revenue by period
- Analytics: trends, top products, user region stats

**Data Sources:**
- Order.aggregate() - Group by period, calculate totals
- Inventory.aggregate() - Top selling products

**Authorization:**
- Vendor only

**Impact on Other Dashboards:**
- **Admin Dashboard**: Vendor performance visible in analytics

**Implementation TODO:**
- [ ] Reports aggregation queries
- [ ] Analytics calculations
- [ ] Trend analysis

---

## Phase 4: User Dashboard Implementation

### 4.1 User Authentication & Onboarding

**Routes Needed:**
- ✅ `POST /api/users/auth/request-otp` - Request OTP
- ✅ `POST /api/users/auth/register` - Register with OTP (optional sellerId)
- ✅ `POST /api/users/auth/login` - Login with OTP (optional sellerId)
- ✅ `POST /api/users/auth/logout`
- ✅ `GET /api/users/profile` - Get profile
- ✅ `PUT /api/users/profile` - Update profile
- ✅ `PUT /api/users/profile/seller-id` - Update Seller ID

**Data Required:**
- Registration: fullName, phone, otp, sellerId (optional), language
- Login: phone, otp, sellerId (optional)
- Profile update: name, location, sellerId

**Authentication Logic:**
- Generate OTP, send via SMS India Hub
  - ⚠️ **SMS Service**: Currently using dummy logic (logs OTP), replace with actual SMS India Hub API when key obtained
- Verify OTP, generate JWT token
- If sellerId provided → Link to Seller, validate sellerId exists

**Seller ID Linking Impact:**
- When User links sellerId → User.sellerId updated, User.seller reference set
- **Seller Dashboard**: User count increases, user appears in referrals
- All future orders from this user → Linked to Seller for commission

**Authorization:**
- User endpoints require JWT token
- Users can only access own data

**Impact on Other Dashboards:**
- **Seller Dashboard**: User linking affects referral count
- **Admin Dashboard**: User registration visible

**Implementation Status:** ✅ Partially implemented (OTP logic done, sellerId linking scaffolded, JWT pending)

---

### 4.2 User Product & Catalog

**Routes Needed:**
- ✅ `GET /api/users/products/categories` - Get categories
- ✅ `GET /api/users/products` - Get products (with filters)
- ✅ `GET /api/users/products/:productId` - Get product details
- ✅ `GET /api/users/products/popular` - Get popular products
- ✅ `GET /api/users/products/search` - Search products
- ✅ `GET /api/users/offers` - Get offers/banners

**Data Required:**
- Product filters: category, search, price range, sort
- Product details: name, price, description, stock, vendor info, delivery timeline

**Data Sources:**
- Product.find({ isActive: true }) - Only active products (set by Admin)
- Product with vendor assignment - Check stock availability
- Popular products - Based on order count

**Authorization:**
- Public (no auth required for browsing)

**Product Visibility:**
- Controlled by Admin via `PUT /api/admin/products/:productId/visibility`
- Only active products shown to users
- Stock availability based on assigned vendor

**Impact on Other Dashboards:**
- **Admin Dashboard**: Product visibility affects user experience
- **Vendor Dashboard**: Product assignment affects availability

**Implementation TODO:**
- [ ] Product listing with filters (only active products)
- [ ] Product details with vendor and stock info
- [ ] Popular products query
- [ ] Search functionality

---

### 4.3 User Cart Management

**Routes Needed:**
- ✅ `GET /api/users/cart` - Get cart
- ✅ `POST /api/users/cart` - Add to cart
- ✅ `PUT /api/users/cart/:itemId` - Update cart item
- ✅ `DELETE /api/users/cart/:itemId` - Remove from cart
- ✅ `DELETE /api/users/cart` - Clear cart
- ✅ `POST /api/users/cart/validate` - Validate cart (min ₹2,000)

**Data Required:**
- Cart items: productId, quantity
- Validation: cart total, meetsMinimum flag

**Data Sources:**
- Cart model (userId, items[])
- Calculate total: sum(product.price * quantity)

**Authorization:**
- User only (own cart)

**Cart Validation:**
- Minimum order value: ₹2,000 (constant: MIN_ORDER_VALUE)
- If cart total < ₹2,000 → Return error, prevent checkout
- **User Dashboard**: Show validation error

**Models Needed:**
- `Cart.js` - Cart schema

**Impact on Other Dashboards:**
- None (user-specific data)

**Implementation TODO:**
- [ ] Create Cart model
- [ ] Cart CRUD operations
- [ ] Cart validation logic (min ₹2,000)

---

### 4.4 User Checkout & Vendor Assignment

**Routes Needed:**
- ✅ `POST /api/users/vendors/assign` - Get assigned vendor (20km radius)
- ✅ `POST /api/users/vendors/check-stock` - Check vendor stock

**Data Required:**
- Location: address, coordinates (lat, lng), pincode
- Stock check: vendorId, productIds[]

**Vendor Assignment Logic:**
- Use geospatial query: Vendor.find({ 
    location: { 
      $near: { 
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 20000 // 20km in meters
      }
    },
    status: 'approved',
    isActive: true
  })
- Assign first vendor found within radius
- **User Dashboard**: Assigned vendor displayed

**Stock Check Logic:**
- For each product in cart → Check Inventory.stock for assigned vendor
- Return available/unavailable items
- **User Dashboard**: Show stock availability before checkout

**Authorization:**
- User only

**Impact on Other Dashboards:**
- **Vendor Dashboard**: User assignment affects order distribution

**Implementation TODO:**
- [ ] Vendor assignment service (20km geospatial query)
  - ⚠️ **Maps API**: Currently using MongoDB geospatial queries, add Maps API geocoding when key obtained
- [ ] Stock check logic (query inventory)
- [ ] Handle no vendor found scenario

---

### 4.5 User Order Creation & Payment

**Routes Needed:**
- ✅ `POST /api/users/orders` - Create order
- ✅ `POST /api/users/payments/create-intent` - Create payment intent (30% or 100%)
- ✅ `POST /api/users/payments/confirm` - Confirm payment
- ✅ `POST /api/users/payments/create-remaining` - Create remaining payment intent (70%)
- ✅ `POST /api/users/payments/confirm-remaining` - Confirm remaining payment
- ✅ `GET /api/users/payments/:paymentId` - Get payment status
- ✅ `GET /api/users/orders/:orderId/payments` - Get order payments

**Data Required:**
- Order creation: items[], addressId, shippingMethod, paymentPreference ('partial' or 'full'), vendorId
- Payment intent: orderId, amount, paymentMethod (razorpay/paytm/stripe)
- Payment confirmation: paymentIntentId, paymentDetails

**Order Creation Logic:**
1. Validate cart minimum (₹2,000)
2. Assign vendor based on location
3. Check vendor stock for each item
4. Calculate totals:
   - Subtotal = sum(item.price * quantity)
   - Delivery charge = paymentPreference === 'full' ? 0 : ₹50
   - Total = subtotal + delivery charge
5. Create order with payment preference
6. If paymentPreference === 'full' → upfrontAmount = total, deliveryChargeWaived = true
7. If paymentPreference === 'partial' → upfrontAmount = total * 30%, remainingAmount = total * 70%

**Stock Availability Handling:**
- **Full Availability**: Order.vendorId = vendor._id, Order.status = 'pending'
- **No Availability**: Order.assignedTo = 'admin', Order.status = 'escalated'
- **Partial Availability**: Order split (see Vendor Order Management section)

**Payment Processing:**
- Create payment intent via Razorpay/Paytm/Stripe
- Verify payment gateway response
- Create Payment record
- Update Order.paymentStatus
- If paymentPreference === 'full' → paymentStatus = 'fully_paid'
- If paymentPreference === 'partial' → paymentStatus = 'partial_paid'

**Remaining Payment:**
- Triggered when order status = 'delivered'
- Create payment intent for remaining 70%
- Verify payment → Update Order.paymentStatus = 'fully_paid'

**Models Needed:**
- `Order.js` - Order schema
- `Payment.js` - Payment schema
- `OrderItem.js` - Order items schema

**Authorization:**
- User only (own orders)

**Impact on Other Dashboards:**
- **Vendor Dashboard**: Order notification received, order appears in orders list
- **Admin Dashboard**: Order visible, escalated orders appear
- **Seller Dashboard**: Order completion triggers commission calculation (background)

**Implementation TODO:**
- [ ] Create Order model (partial fulfillment support)
- [ ] Create Payment model
- [ ] Create OrderItem model
- [ ] Order creation logic (stock check, vendor assignment)
- [ ] **Payment gateway integration** (Razorpay/Paytm/Stripe)
  - ⚠️ **Status**: Dummy logic active, replace with actual gateway SDK when access obtained
  - See "Prerequisites & External Service Dependencies" section
- [ ] Payment confirmation logic
- [ ] Remaining payment trigger logic

---

### 4.6 User Order Tracking

**Routes Needed:**
- ✅ `GET /api/users/orders` - Get orders (with status timeline)
- ✅ `GET /api/users/orders/:orderId` - Get order details
- ✅ `GET /api/users/orders/:orderId/track` - Track order
- ✅ `PUT /api/users/orders/:orderId/cancel` - Cancel order

**Data Required:**
- Order filters: status, date range
- Order details: items, vendor, payment, status timeline, delivery info

**Data Sources:**
- Order.find({ userId: user._id })
- OrderStatusTimeline.find({ orderId }) - Status history

**Real-Time Status Updates:**
- When Vendor updates status → WebSocket/SSE push to User
- Status flow: 'awaiting' → 'dispatched' → 'delivered'
- **User Dashboard**: Real-time status display

**Order Cancellation:**
- Only allowed if status = 'pending' or 'accepted'
- If payment made → Refund processed
- **Vendor Dashboard**: Order removed/cancelled
- **Admin Dashboard**: Cancellation logged

**Authorization:**
- User only (own orders)

**Impact on Other Dashboards:**
- **Vendor Dashboard**: Status updates visible, cancellations reflected
- **Admin Dashboard**: Order cancellations visible

**Implementation TODO:**
- [ ] Order listing with filters
- [ ] Order details query (with status timeline)
- [ ] Real-time status sync (WebSocket/SSE)
- [ ] Order cancellation logic (refund handling)

---

### 4.7 User Address Management

**Routes Needed:**
- ✅ `GET /api/users/addresses` - Get addresses
- ✅ `POST /api/users/addresses` - Add address
- ✅ `PUT /api/users/addresses/:addressId` - Update address
- ✅ `DELETE /api/users/addresses/:addressId` - Delete address
- ✅ `PUT /api/users/addresses/:addressId/default` - Set default address

**Data Required:**
- Address: name, address, city, state, pincode, phone, isDefault, coordinates

**Data Sources:**
- Address model (userId, address fields)

**Default Address:**
- Used for vendor assignment and delivery
- Only one default address per user

**Models Needed:**
- `Address.js` - Address schema

**Authorization:**
- User only (own addresses)

**Impact on Other Dashboards:**
- **Vendor Dashboard**: Address used for delivery

**Implementation TODO:**
- [ ] Create Address model
- [ ] Address CRUD operations
- [ ] Default address logic (only one default)

---

### 4.8 User Notifications & Support

**Routes Needed:**
- ✅ `GET /api/users/notifications` - Get notifications
- ✅ `PUT /api/users/notifications/:notificationId/read` - Mark as read
- ✅ `PUT /api/users/notifications/read-all` - Mark all as read
- ✅ `POST /api/users/support/tickets` - Create support ticket
- ✅ `GET /api/users/support/tickets` - Get support tickets
- ✅ `GET /api/users/support/tickets/:ticketId` - Get ticket details
- ✅ `POST /api/users/support/tickets/:ticketId/messages` - Send message
- ✅ `POST /api/users/support/call` - Initiate support call

**Data Required:**
- Notifications: type, title, message, orderId, timestamp
- Support ticket: subject, description, category, orderId (optional)

**Notification Types:**
- Order status updates (from Vendor)
- Payment reminders
- Delivery updates
- Offers/announcements (from Admin)

**Notification Triggers:**
- Order status change → Vendor updates status → Push notification to User
- Payment reminder → 24 hours after delivery → Push notification
- Admin announcement → Admin creates → Push to all users

**Models Needed:**
- `Notification.js` - Notification schema
- `SupportTicket.js` - Support ticket schema
- `SupportMessage.js` - Support message schema

**Authorization:**
- User only (own notifications and tickets)

**Impact on Other Dashboards:**
- **Admin Dashboard**: Support tickets visible, can respond
- **Vendor Dashboard**: Status updates trigger user notifications

**Implementation TODO:**
- [ ] Create Notification model
- [ ] Create SupportTicket model
- [ ] Create SupportMessage model
- [ ] Notification creation logic (order status, payment reminders)
- [ ] Support ticket creation and messaging
- [ ] WebSocket/SSE for real-time notifications

---

## Cross-Role Data Synchronization

### Order Status Updates
**Flow:** Vendor → User (Real-time)
- Vendor updates order status → WebSocket/SSE push → User dashboard updated
- **Implementation**: Real-time connection in `config/realtime.js`

### Commission Calculation
**Flow:** User Order Completion → Seller Wallet (Background)
- Order payment fully paid → Trigger commission calculation
- Monthly purchase tally updated → Commission calculated → Seller wallet credited
- **Implementation**: Background job/service

### Vendor Purchase Approval
**Flow:** Admin → Vendor (Notification)
- Admin approves purchase → Vendor credit updated → Vendor inventory updated → Notification sent
- **Implementation**: Notification service

### Seller Withdrawal Approval
**Flow:** Admin → Seller (Notification)
- Admin approves withdrawal → Seller wallet updated → Notification sent
- **Implementation**: Notification service

### Order Escalation
**Flow:** Vendor → Admin (Immediate)
- Vendor rejects/partially accepts → Order escalated → Admin dashboard shows new order
- **Implementation**: Order splitting logic

---

## Implementation Priority & Dependencies

### Phase 1: Foundation (Must Complete First)
1. ✅ Project structure and configuration
2. ✅ Core models (Admin, Vendor, Seller, User)
3. ⏳ Shared models (Product, Order, Payment, Address, Cart, etc.)
4. ⏳ JWT authentication middleware
5. ⏳ Basic authentication flows

### Phase 2: Admin First (No Dependencies)
1. Admin authentication ✅ (partial)
2. Admin dashboard overview
3. Product management
4. Vendor management (enables Vendor dashboard)
5. Seller management (enables Seller dashboard)
6. User management
7. Order & payment oversight

### Phase 3: Seller Second (Depends on Admin)
1. Seller authentication ✅ (partial)
2. Seller dashboard overview
3. Wallet & commission system (depends on Order completion)
4. Referral tracking (depends on User linking)

### Phase 4: Vendor Third (Depends on Admin)
1. Vendor authentication ✅ (partial)
2. Vendor dashboard overview
3. Inventory management (depends on Admin product assignment)
4. Order management (depends on User orders)
5. Credit management (depends on Admin credit policy)

### Phase 5: User Last (Depends on All)
1. User authentication ✅ (partial)
2. Product browsing (depends on Admin products)
3. Cart & checkout (depends on Vendor assignment)
4. Order creation (depends on Vendor, Payment gateway)
5. Order tracking (depends on Vendor status updates)
6. Commission triggering (depends on Seller system)

---

*Document Version: 1.1*  
*Last Updated: 2024*

**MongoDB Connection:**
- Connection String: `mongodb+srv://yash007patidar_db_user:oTtWNuYdLNaGKMe6@cluster0.bjmsiqo.mongodb.net/irasathi?retryWrites=true&w=majority&appName=Cluster0`
- See `Backend/MONGODB_CONNECTION.md` for details**
- Inventory items: product, stock quantity, purchase price, selling price
- Stock update: itemId, new quantity

**Data Sources:**
- ProductAssignment.find({ vendorId: vendor._id }) - Products assigned by Admin
- Inventory model (productId, vendorId, stock, prices)

**Authorization:**
- Vendor only (own inventory)

**Inventory Assignment:**
- When Admin assigns product to vendor → Create Inventory entry
- **Vendor Dashboard**: New product appears in inventory

**Stock Update Impact:**
- When Vendor updates stock → Inventory.stock updated
- **User Dashboard**: Stock availability affects product listing
- **Order Processing**: Stock check uses updated quantity

**Models Needed:**
- `Inventory.js` - Vendor inventory schema
- `ProductAssignment.js` - Admin product assignment schema

**Impact on Other Dashboards:**
- **Admin Dashboard**: Vendor inventory visible (assigned products)
- **User Dashboard**: Stock availability affects order creation

**Implementation TODO:**
- [ ] Create Inventory model
- [ ] Create ProductAssignment model
- [ ] Inventory listing query (filter by vendorId)
- [ ] Stock update logic (validate quantity, update availability)

---

### 3.4 Vendor Order Management

**Routes Needed:**
- ✅ `GET /api/vendors/orders` - List orders (with filters)
- ✅ `GET /api/vendors/orders/:orderId` - Get order details
- ✅ `POST /api/vendors/orders/:orderId/accept` - Accept order (full)
- ✅ `POST /api/vendors/orders/:orderId/reject` - Reject order (escalate to Admin)
- ✅ `POST /api/vendors/orders/:orderId/accept-partial` - Partially accept
- ✅ `PUT /api/vendors/orders/:orderId/status` - Update status (Awaiting → Dispatched → Delivered)
- ✅ `GET /api/vendors/orders/stats` - Order statistics

**Data Required:**
- Order details: items, quantities, user info, payment status
- Acceptance: orderId, accepted items (for partial)
- Rejection: orderId, reason
- Status update: orderId, status (awaiting/dispatched/delivered)

**Order Assignment Logic:**
- When User creates order → System assigns vendor based on location (20km radius)
- Order.vendorId set, Order.status = 'pending'
- **Vendor Dashboard**: Vendor receives order notification

**Order Acceptance Impact:**
- **Full Acceptance**: Order.vendorId confirmed, Order.status = 'accepted'
- **Rejection**: Order.vendorId = null, Order.assignedTo = 'admin', Order.status = 'escalated'
  - **Admin Dashboard**: Order appears in escalated orders
  - **User Dashboard**: User notified of escalation
- **Partial Acceptance**: Order split:
  - Vendor Order: acceptedItems, Order.vendorId = vendor._id, Order.status = 'partially_accepted'
  - Admin Order: rejectedItems, Order.assignedTo = 'admin', Order.status = 'escalated', Order.parentOrderId = originalOrderId
  - **Admin Dashboard**: Admin order created for rejected items
  - **User Dashboard**: User notified of partial fulfillment

**Status Update Impact:**
- When Vendor updates status → Order.status updated, Order.statusTimeline appended
- **User Dashboard**: Real-time status update (WebSocket/SSE)
- Status flow: 'awaiting' → 'dispatched' → 'delivered'
- When status = 'delivered' → Trigger remaining payment (if partial payment order)

**Models Needed:**
- `Order.js` - Order schema (with partial fulfillment support)
- `OrderStatusTimeline.js` - Status history schema

**Impact on Other Dashboards:**
- **Admin Dashboard**: Order status visible, escalated orders appear
- **User Dashboard**: Real-time status updates, partial fulfillment notifications
- **Seller Dashboard**: Order completion triggers commission (background process)

**Implementation TODO:**
- [ ] Create Order model (support partial fulfillment)
- [ ] Create OrderStatusTimeline model
- [ ] Order assignment logic (20km radius geospatial query)
- [ ] Full acceptance logic
- [ ] Rejection logic (escalate to admin)
- [ ] Partial acceptance logic (order splitting)
- [ ] Status update logic (real-time sync)
- [ ] WebSocket/SSE integration for real-time updates

---

### 3.5 Vendor Credit Management

**Routes Needed:**
- ✅ `GET /api/vendors/credit` - Get credit info
- ✅ `POST /api/vendors/credit/purchase` - Request credit purchase (min ₹50,000)
- ✅ `GET /api/vendors/credit/purchases` - Get purchase requests
- ✅ `GET /api/vendors/credit/purchases/:requestId` - Get purchase details
- ✅ `GET /api/vendors/credit/history` - Get credit history

**Data Required:**
- Credit info: limit, used, remaining, penalty status, due date
- Purchase request: items[], totalAmount (validate ≥ ₹50,000)

**Data Sources:**
- Vendor.creditLimit, creditUsed, creditPolicy
- CreditPurchase.find({ vendorId: vendor._id })

**Authorization:**
- Vendor only (own credit)

**Credit Policy:**
- Set by Admin via `PUT /api/admin/vendors/:vendorId/credit-policy`
- **Vendor Dashboard**: Credit info visible

**Purchase Request Impact:**
- When Vendor requests purchase → Create CreditPurchase (status: pending)
- Validate totalAmount ≥ ₹50,000
- **Admin Dashboard**: Purchase request appears in pending approvals
- When Admin approves → Vendor.creditUsed increased, Inventory items added
- When Admin rejects → Vendor notified, credit unchanged

**Penalty Calculation:**
- If payment delayed beyond due date → Penalty calculated daily
- Penalty = (overdue amount * penaltyRate) / 100 per day
- **Admin Dashboard**: Penalties visible, auto-calculated

**Models Needed:**
- `CreditPurchase.js` - Purchase request schema
- `CreditTransaction.js` - Credit history schema

**Impact on Other Dashboards:**
- **Admin Dashboard**: Purchase requests visible, approvals affect vendor credit and inventory

**Implementation TODO:**
- [ ] Create CreditPurchase model
- [ ] Create CreditTransaction model
- [ ] Credit info query (calculate remaining, penalties)
- [ ] Purchase request creation (validate minimum amount)
- [ ] Penalty calculation logic (scheduled job)
- [ ] Credit history query

---

### 3.6 Vendor Reports & Analytics

**Routes Needed:**
- ✅ `GET /api/vendors/reports` - Get reports
- ✅ `GET /api/vendors/reports/analytics` - Get performance analytics

**Data Required:**
- Reports: orders, sales, revenue by period
- Analytics: trends, top products, user region stats

**Data Sources:**
- Order.aggregate() - Group by period, calculate totals
- Inventory.aggregate() - Top selling products

**Authorization:**
- Vendor only

**Impact on Other Dashboards:**
- **Admin Dashboard**: Vendor performance visible in analytics

**Implementation TODO:**
- [ ] Reports aggregation queries
- [ ] Analytics calculations
- [ ] Trend analysis

---

## Phase 4: User Dashboard Implementation

### 4.1 User Authentication & Onboarding

**Routes Needed:**
- ✅ `POST /api/users/auth/request-otp` - Request OTP
- ✅ `POST /api/users/auth/register` - Register with OTP (optional sellerId)
- ✅ `POST /api/users/auth/login` - Login with OTP (optional sellerId)
- ✅ `POST /api/users/auth/logout`
- ✅ `GET /api/users/profile` - Get profile
- ✅ `PUT /api/users/profile` - Update profile
- ✅ `PUT /api/users/profile/seller-id` - Update Seller ID

**Data Required:**
- Registration: fullName, phone, otp, sellerId (optional), language
- Login: phone, otp, sellerId (optional)
- Profile update: name, location, sellerId

**Authentication Logic:**
- Generate OTP, send via SMS India Hub
  - ⚠️ **SMS Service**: Currently using dummy logic (logs OTP), replace with actual SMS India Hub API when key obtained
- Verify OTP, generate JWT token
- If sellerId provided → Link to Seller, validate sellerId exists

**Seller ID Linking Impact:**
- When User links sellerId → User.sellerId updated, User.seller reference set
- **Seller Dashboard**: User count increases, user appears in referrals
- All future orders from this user → Linked to Seller for commission

**Authorization:**
- User endpoints require JWT token
- Users can only access own data

**Impact on Other Dashboards:**
- **Seller Dashboard**: User linking affects referral count
- **Admin Dashboard**: User registration visible

**Implementation Status:** ✅ Partially implemented (OTP logic done, sellerId linking scaffolded, JWT pending)

---

### 4.2 User Product & Catalog

**Routes Needed:**
- ✅ `GET /api/users/products/categories` - Get categories
- ✅ `GET /api/users/products` - Get products (with filters)
- ✅ `GET /api/users/products/:productId` - Get product details
- ✅ `GET /api/users/products/popular` - Get popular products
- ✅ `GET /api/users/products/search` - Search products
- ✅ `GET /api/users/offers` - Get offers/banners

**Data Required:**
- Product filters: category, search, price range, sort
- Product details: name, price, description, stock, vendor info, delivery timeline

**Data Sources:**
- Product.find({ isActive: true }) - Only active products (set by Admin)
- Product with vendor assignment - Check stock availability
- Popular products - Based on order count

**Authorization:**
- Public (no auth required for browsing)

**Product Visibility:**
- Controlled by Admin via `PUT /api/admin/products/:productId/visibility`
- Only active products shown to users
- Stock availability based on assigned vendor

**Impact on Other Dashboards:**
- **Admin Dashboard**: Product visibility affects user experience
- **Vendor Dashboard**: Product assignment affects availability

**Implementation TODO:**
- [ ] Product listing with filters (only active products)
- [ ] Product details with vendor and stock info
- [ ] Popular products query
- [ ] Search functionality

---

### 4.3 User Cart Management

**Routes Needed:**
- ✅ `GET /api/users/cart` - Get cart
- ✅ `POST /api/users/cart` - Add to cart
- ✅ `PUT /api/users/cart/:itemId` - Update cart item
- ✅ `DELETE /api/users/cart/:itemId` - Remove from cart
- ✅ `DELETE /api/users/cart` - Clear cart
- ✅ `POST /api/users/cart/validate` - Validate cart (min ₹2,000)

**Data Required:**
- Cart items: productId, quantity
- Validation: cart total, meetsMinimum flag

**Data Sources:**
- Cart model (userId, items[])
- Calculate total: sum(product.price * quantity)

**Authorization:**
- User only (own cart)

**Cart Validation:**
- Minimum order value: ₹2,000 (constant: MIN_ORDER_VALUE)
- If cart total < ₹2,000 → Return error, prevent checkout
- **User Dashboard**: Show validation error

**Models Needed:**
- `Cart.js` - Cart schema

**Impact on Other Dashboards:**
- None (user-specific data)

**Implementation TODO:**
- [ ] Create Cart model
- [ ] Cart CRUD operations
- [ ] Cart validation logic (min ₹2,000)

---

### 4.4 User Checkout & Vendor Assignment

**Routes Needed:**
- ✅ `POST /api/users/vendors/assign` - Get assigned vendor (20km radius)
- ✅ `POST /api/users/vendors/check-stock` - Check vendor stock

**Data Required:**
- Location: address, coordinates (lat, lng), pincode
- Stock check: vendorId, productIds[]

**Vendor Assignment Logic:**
- Use geospatial query: Vendor.find({ 
    location: { 
      $near: { 
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 20000 // 20km in meters
      }
    },
    status: 'approved',
    isActive: true
  })
- Assign first vendor found within radius
- **User Dashboard**: Assigned vendor displayed

**Stock Check Logic:**
- For each product in cart → Check Inventory.stock for assigned vendor
- Return available/unavailable items
- **User Dashboard**: Show stock availability before checkout

**Authorization:**
- User only

**Impact on Other Dashboards:**
- **Vendor Dashboard**: User assignment affects order distribution

**Implementation TODO:**
- [ ] Vendor assignment service (20km geospatial query)
  - ⚠️ **Maps API**: Currently using MongoDB geospatial queries, add Maps API geocoding when key obtained
- [ ] Stock check logic (query inventory)
- [ ] Handle no vendor found scenario

---

### 4.5 User Order Creation & Payment

**Routes Needed:**
- ✅ `POST /api/users/orders` - Create order
- ✅ `POST /api/users/payments/create-intent` - Create payment intent (30% or 100%)
- ✅ `POST /api/users/payments/confirm` - Confirm payment
- ✅ `POST /api/users/payments/create-remaining` - Create remaining payment intent (70%)
- ✅ `POST /api/users/payments/confirm-remaining` - Confirm remaining payment
- ✅ `GET /api/users/payments/:paymentId` - Get payment status
- ✅ `GET /api/users/orders/:orderId/payments` - Get order payments

**Data Required:**
- Order creation: items[], addressId, shippingMethod, paymentPreference ('partial' or 'full'), vendorId
- Payment intent: orderId, amount, paymentMethod (razorpay/paytm/stripe)
- Payment confirmation: paymentIntentId, paymentDetails

**Order Creation Logic:**
1. Validate cart minimum (₹2,000)
2. Assign vendor based on location
3. Check vendor stock for each item
4. Calculate totals:
   - Subtotal = sum(item.price * quantity)
   - Delivery charge = paymentPreference === 'full' ? 0 : ₹50
   - Total = subtotal + delivery charge
5. Create order with payment preference
6. If paymentPreference === 'full' → upfrontAmount = total, deliveryChargeWaived = true
7. If paymentPreference === 'partial' → upfrontAmount = total * 30%, remainingAmount = total * 70%

**Stock Availability Handling:**
- **Full Availability**: Order.vendorId = vendor._id, Order.status = 'pending'
- **No Availability**: Order.assignedTo = 'admin', Order.status = 'escalated'
- **Partial Availability**: Order split (see Vendor Order Management section)

**Payment Processing:**
- Create payment intent via Razorpay/Paytm/Stripe
- Verify payment gateway response
- Create Payment record
- Update Order.paymentStatus
- If paymentPreference === 'full' → paymentStatus = 'fully_paid'
- If paymentPreference === 'partial' → paymentStatus = 'partial_paid'

**Remaining Payment:**
- Triggered when order status = 'delivered'
- Create payment intent for remaining 70%
- Verify payment → Update Order.paymentStatus = 'fully_paid'

**Models Needed:**
- `Order.js` - Order schema
- `Payment.js` - Payment schema
- `OrderItem.js` - Order items schema

**Authorization:**
- User only (own orders)

**Impact on Other Dashboards:**
- **Vendor Dashboard**: Order notification received, order appears in orders list
- **Admin Dashboard**: Order visible, escalated orders appear
- **Seller Dashboard**: Order completion triggers commission calculation (background)

**Implementation TODO:**
- [ ] Create Order model (partial fulfillment support)
- [ ] Create Payment model
- [ ] Create OrderItem model
- [ ] Order creation logic (stock check, vendor assignment)
- [ ] **Payment gateway integration** (Razorpay/Paytm/Stripe)
  - ⚠️ **Status**: Dummy logic active, replace with actual gateway SDK when access obtained
  - See "Prerequisites & External Service Dependencies" section
- [ ] Payment confirmation logic
- [ ] Remaining payment trigger logic

---

### 4.6 User Order Tracking

**Routes Needed:**
- ✅ `GET /api/users/orders` - Get orders (with status timeline)
- ✅ `GET /api/users/orders/:orderId` - Get order details
- ✅ `GET /api/users/orders/:orderId/track` - Track order
- ✅ `PUT /api/users/orders/:orderId/cancel` - Cancel order

**Data Required:**
- Order filters: status, date range
- Order details: items, vendor, payment, status timeline, delivery info

**Data Sources:**
- Order.find({ userId: user._id })
- OrderStatusTimeline.find({ orderId }) - Status history

**Real-Time Status Updates:**
- When Vendor updates status → WebSocket/SSE push to User
- Status flow: 'awaiting' → 'dispatched' → 'delivered'
- **User Dashboard**: Real-time status display

**Order Cancellation:**
- Only allowed if status = 'pending' or 'accepted'
- If payment made → Refund processed
- **Vendor Dashboard**: Order removed/cancelled
- **Admin Dashboard**: Cancellation logged

**Authorization:**
- User only (own orders)

**Impact on Other Dashboards:**
- **Vendor Dashboard**: Status updates visible, cancellations reflected
- **Admin Dashboard**: Order cancellations visible

**Implementation TODO:**
- [ ] Order listing with filters
- [ ] Order details query (with status timeline)
- [ ] Real-time status sync (WebSocket/SSE)
- [ ] Order cancellation logic (refund handling)

---

### 4.7 User Address Management

**Routes Needed:**
- ✅ `GET /api/users/addresses` - Get addresses
- ✅ `POST /api/users/addresses` - Add address
- ✅ `PUT /api/users/addresses/:addressId` - Update address
- ✅ `DELETE /api/users/addresses/:addressId` - Delete address
- ✅ `PUT /api/users/addresses/:addressId/default` - Set default address

**Data Required:**
- Address: name, address, city, state, pincode, phone, isDefault, coordinates

**Data Sources:**
- Address model (userId, address fields)

**Default Address:**
- Used for vendor assignment and delivery
- Only one default address per user

**Models Needed:**
- `Address.js` - Address schema

**Authorization:**
- User only (own addresses)

**Impact on Other Dashboards:**
- **Vendor Dashboard**: Address used for delivery

**Implementation TODO:**
- [ ] Create Address model
- [ ] Address CRUD operations
- [ ] Default address logic (only one default)

---

### 4.8 User Notifications & Support

**Routes Needed:**
- ✅ `GET /api/users/notifications` - Get notifications
- ✅ `PUT /api/users/notifications/:notificationId/read` - Mark as read
- ✅ `PUT /api/users/notifications/read-all` - Mark all as read
- ✅ `POST /api/users/support/tickets` - Create support ticket
- ✅ `GET /api/users/support/tickets` - Get support tickets
- ✅ `GET /api/users/support/tickets/:ticketId` - Get ticket details
- ✅ `POST /api/users/support/tickets/:ticketId/messages` - Send message
- ✅ `POST /api/users/support/call` - Initiate support call

**Data Required:**
- Notifications: type, title, message, orderId, timestamp
- Support ticket: subject, description, category, orderId (optional)

**Notification Types:**
- Order status updates (from Vendor)
- Payment reminders
- Delivery updates
- Offers/announcements (from Admin)

**Notification Triggers:**
- Order status change → Vendor updates status → Push notification to User
- Payment reminder → 24 hours after delivery → Push notification
- Admin announcement → Admin creates → Push to all users

**Models Needed:**
- `Notification.js` - Notification schema
- `SupportTicket.js` - Support ticket schema
- `SupportMessage.js` - Support message schema

**Authorization:**
- User only (own notifications and tickets)

**Impact on Other Dashboards:**
- **Admin Dashboard**: Support tickets visible, can respond
- **Vendor Dashboard**: Status updates trigger user notifications

**Implementation TODO:**
- [ ] Create Notification model
- [ ] Create SupportTicket model
- [ ] Create SupportMessage model
- [ ] Notification creation logic (order status, payment reminders)
- [ ] Support ticket creation and messaging
- [ ] WebSocket/SSE for real-time notifications

---

## Cross-Role Data Synchronization

### Order Status Updates
**Flow:** Vendor → User (Real-time)
- Vendor updates order status → WebSocket/SSE push → User dashboard updated
- **Implementation**: Real-time connection in `config/realtime.js`

### Commission Calculation
**Flow:** User Order Completion → Seller Wallet (Background)
- Order payment fully paid → Trigger commission calculation
- Monthly purchase tally updated → Commission calculated → Seller wallet credited
- **Implementation**: Background job/service

### Vendor Purchase Approval
**Flow:** Admin → Vendor (Notification)
- Admin approves purchase → Vendor credit updated → Vendor inventory updated → Notification sent
- **Implementation**: Notification service

### Seller Withdrawal Approval
**Flow:** Admin → Seller (Notification)
- Admin approves withdrawal → Seller wallet updated → Notification sent
- **Implementation**: Notification service

### Order Escalation
**Flow:** Vendor → Admin (Immediate)
- Vendor rejects/partially accepts → Order escalated → Admin dashboard shows new order
- **Implementation**: Order splitting logic

---

## Implementation Priority & Dependencies

### Phase 1: Foundation (Must Complete First)
1. ✅ Project structure and configuration
2. ✅ Core models (Admin, Vendor, Seller, User)
3. ⏳ Shared models (Product, Order, Payment, Address, Cart, etc.)
4. ⏳ JWT authentication middleware
5. ⏳ Basic authentication flows

### Phase 2: Admin First (No Dependencies)
1. Admin authentication ✅ (partial)
2. Admin dashboard overview
3. Product management
4. Vendor management (enables Vendor dashboard)
5. Seller management (enables Seller dashboard)
6. User management
7. Order & payment oversight

### Phase 3: Seller Second (Depends on Admin)
1. Seller authentication ✅ (partial)
2. Seller dashboard overview
3. Wallet & commission system (depends on Order completion)
4. Referral tracking (depends on User linking)

### Phase 4: Vendor Third (Depends on Admin)
1. Vendor authentication ✅ (partial)
2. Vendor dashboard overview
3. Inventory management (depends on Admin product assignment)
4. Order management (depends on User orders)
5. Credit management (depends on Admin credit policy)

### Phase 5: User Last (Depends on All)
1. User authentication ✅ (partial)
2. Product browsing (depends on Admin products)
3. Cart & checkout (depends on Vendor assignment)
4. Order creation (depends on Vendor, Payment gateway)
5. Order tracking (depends on Vendor status updates)
6. Commission triggering (depends on Seller system)

---

*Document Version: 1.1*  
*Last Updated: 2024*

**MongoDB Connection:**
- Connection String: `mongodb+srv://yash007patidar_db_user:oTtWNuYdLNaGKMe6@cluster0.bjmsiqo.mongodb.net/irasathi?retryWrites=true&w=majority&appName=Cluster0`
- See `Backend/MONGODB_CONNECTION.md` for details