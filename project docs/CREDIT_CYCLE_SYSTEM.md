# Credit Cycle System - Technical Documentation

## 🎯 Core Concept

**Each credit purchase creates an independent credit cycle. Repayments affect ONLY that specific cycle.**

This is fundamentally different from a balance-based system where repayments reduce a total outstanding balance.

---

## 📊 System Architecture

### Key Entities

#### 1. **Credit Cycle** (CreditPurchase Model)
Each approved credit purchase becomes an independent cycle.

```javascript
{
  _id: ObjectId,
  creditPurchaseId: "CRP-101",
  vendorId: ObjectId,
  
  // Cycle Fields
  cycleStatus: "active" | "partially_paid" | "fully_paid" | "closed",
  principalAmount: 20000,        // Original credit taken
  outstandingAmount: 15000,      // Remaining to repay
  totalRepaid: 5000,             // Sum of all repayments
  cycleStartDate: Date,          // All calculations relative to this
  
  // Repayment tracking
  repayments: [ObjectId],        // Array of CreditRepayment refs
  lastRepaymentDate: Date,
  totalDiscountEarned: 1000,
  totalInterestPaid: 0,
  
  repaymentStatus: "not_started" | "in_progress" | "completed"
}
```

#### 2. **Vendor Model (Enhanced)**
Tracks overall credit but delegates cycle management to CreditPurchase.

```javascript
{
  creditLimit: 100000,
  creditUsed: 50000,          // Sum of all active cycle outstandings
  availableCredit: 50000,     // creditLimit - creditUsed
  
  creditHistory: {
    // Aggregated across ALL cycles
    totalCreditTaken: 200000,
    totalRepaid: 150000,
    totalDiscountsEarned: 15000,
    totalInterestPaid: 2000,
    creditScore: 92
  }
}
```

---

## 🔄 Credit Cycle Lifecycle

### State Machine

```
┌─────────────┐
│  inactive   │  (Pending admin approval)
└──────┬──────┘
       │ Admin approves
       ↓
┌─────────────┐
│   active    │  (Cycle started, outstanding = principal)
└──────┬──────┘
       │ First partial repayment
       ↓
┌─────────────┐
│partially_   │  (0 \u003c outstanding \u003c principal)
│   paid      │
└──────┬──────┘
       │ Final repayment (outstanding = 0)
       ↓
┌─────────────┐
│ fully_paid  │  (All repaid, cycle can be closed)
└──────┬──────┘
       │ Admin/System closes
       ↓
┌─────────────┐
│   closed    │  (Cycle archived)
└─────────────┘
```

---

## 💰 Partial Repayment Flow

### Example Scenario

**Initial State**:
```
Vendor Credit Limit: ₹100,000
Available Credit: ₹100,000
Active Cycles: 0
```

### Step 1: First Credit Purchase (₹20,000)
```javascript
// Vendor places order using credit
POST /api/vendors/credit/purchase
Body: { items: [...], totalAmount: 20000 }

// System creates Cycle #1
Cycle #1: {
  principalAmount: 20000,
  outstandingAmount: 20000,
  totalRepaid: 0,
  cycleStatus: 'active',
  cycleStartDate: '2026-01-23'
}

// Vendor credit updated
creditUsed: 20000
availableCredit: 80000
```

### Step 2: Partial Repayment #1 (₹5,000)
```javascript
// Vendor repays ₹5,000 on Day 25
POST /api/vendors/credit/cycles/:cycleId/repay
Body: { amount: 5000 }

// System calculates discount (5% for 0-30 days)
Discount: ₹250 (5% of ₹5,000)
Actual Payment: ₹4,750

// Cycle #1 updated
Cycle #1: {
  outstandingAmount: 15000,  // 20000 - 5000
  totalRepaid: 5000,
  cycleStatus: 'partially_paid',
  totalDiscountEarned: 250
}

// Vendor credit restored by PRINCIPAL amount
creditUsed: 15000         // 20000 - 5000
availableCredit: 85000    // 100000 - 15000
```

### Step 3: Second Credit Purchase (₹30,000)
```javascript
// Vendor makes another purchase
POST /api/vendors/credit/purchase
Body: { items: [...], totalAmount: 30000 }

// System creates Cycle #2 (independent!)
Cycle #2: {
  principalAmount: 30000,
  outstandingAmount: 30000,
  totalRepaid: 0,
  cycleStatus: 'active',
  cycleStartDate: '2026-01-28'
}

// Vendor credit updated
creditUsed: 45000          // 15000 (Cycle #1) + 30000 (Cycle #2)
availableCredit: 55000

// Current State:
// - Cycle #1: ₹15,000 outstanding (started Day 1)
// - Cycle #2: ₹30,000 outstanding (started Day 6)
// - Total outstanding: ₹45,000
// - Both cycles independent!
```

### Step 4: Partial Repayment #2 - Cycle #1 (₹10,000)
```javascript
// Vendor repays remaining Cycle #1 on Day 35
POST /api/vendors/credit/cycles/cycle1-id/repay
Body: { amount: 10000 }

// Calculation based on Cycle #1 start date (Day 35)
Discount: ₹400 (4% for 31-40 days)
Actual Payment: ₹9,600

// Cycle #1 updated
Cycle #1: {
  outstandingAmount: 5000,   // 15000 - 10000
  totalRepaid: 15000,         // 5000 + 10000
  cycleStatus: 'partially_paid',
  totalDiscountEarned: 650    // 250 + 400
}

// Vendor credit
creditUsed: 35000           // 5000 (Cycle #1) + 30000 (Cycle #2)
availableCredit: 65000
```

### Step 5: Final Payment Cycle #1 (₹5,000)
```javascript
// Vendor completes Cycle #1 on Day 40
POST /api/vendors/credit/cycles/cycle1-id/repay
Body: { amount: 5000 }

// Calculation
Discount: ₹200 (4% for 31-40 days)
Actual Payment: ₹4,800

// Cycle #1 CLOSED
Cycle #1: {
  outstandingAmount: 0,
  totalRepaid: 20000,
  cycleStatus: 'closed',
  cycleClosedDate: '2026-02-02',
  totalDiscountEarned: 850
}

// Vendor credit
creditUsed: 30000           // Only Cycle #2 remains
availableCredit: 70000

// Cycle #2 still independent at ₹30,000 outstanding
```

---

## 🛡️ Overpayment Prevention

The system **prevents vendors from paying more than what's owed** on a specific cycle:

```javascript
// Cycle outstanding: ₹5,000
// Vendor attempts: ₹7,000

Response: {
  error: "Repayment amount (₹7,000) exceeds outstanding (₹5,000). Maximum allowed: ₹5,000"
}
```

---

## 📐 Discount/Interest Calculation (Prorata)

All calculations are based on **days elapsed from cycle start**:

```javascript
// Cycle started: Day 0
// Repayment made: Day 25
// Principal being repaid: ₹5,000

// Step 1: Find applicable tier for Day 25
Tier: "0-30 days" → 5% discount

// Step 2: Apply to THIS repayment
Discount: ₹5,000 × 5% = ₹250
Adjusted Payment: ₹5,000 - ₹250 = ₹4,750

// Vendor pays ₹4,750
// Principal ₹5,000 is deducted from outstanding
// Credit ₹5,000 is restored
```

---

## 🔔 Notifications (Cycle-Based)

Reminders are sent PER CYCLE, not for total credit:

```javascript
// Cycle #1: Started Day 0, Outstanding ₹15,000
// Cycle #2: Started Day 6, Outstanding ₹30,000

// Day 60 for Cycle #1
Notification: "Cycle #1 (₹15,000): Pay now for 3% discount"

// Day 54 for Cycle #2 (54 days since its start)
Notification: "Cycle #2 (₹30,000): Pay now for 5% discount"
```

---

## 🗂️ Database Structure

### Collections

1. **CreditPurchase** (Cycles)
   - One document per credit purchase
   - Tracks cycle-specific repayment progress
   - References vendor and repayments

2. **CreditRepayment**
   - One document per repayment transaction
   - Links to specific cycle via `purchaseOrderId`
   - Stores discount/interest applied

3. **Vendor**
   - Aggregate credit tracking
   - Overall performance metrics

---

## 🔌 API Endpoints

### Process Partial Repayment
```http
POST /api/vendors/credit/cycles/:cycleId/repay

Body:
{
  "amount": 5000,
  "paymentMethod": "razorpay",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx"
}

Response:
{
  "success": true,
  "repayment": {
    "principalRepaid": 5000,
    "actualAmountPaid": 4750,
    "discountEarned": 250,
    "discountRate": 5
  },
  "cycle": {
    "outstandingAmount": 15000,
    "cycleStatus": "partially_paid"
  },
  "vendor": {
    "availableCredit": 85000
  }
}
```

### Get Active Cycles
```http
GET /api/vendors/credit/cycles/active

Response:
{
  "cycles": [
    {
      "id": "...",
      "creditPurchaseId": "CRP-101",
      "principalAmount": 20000,
      "outstandingAmount": 15000,
      "totalRepaid": 5000,
      "daysElapsed": 25,
      "cycleStatus": "partially_paid"
    }
  ],
  "totalOutstanding": 15000
}
```

### Get Vendor Credit Summary
```http
GET /api/vendors/credit/summary

Response:
{
  "vendor": {
    "creditLimit": 100000,
    "creditUsed": 45000,
    "availableCredit": 55000,
    "creditScore": 92
  },
  "cycles": {
    "active": [ /* array of active cycles */ ],
    "activeCount": 2,
    "closedCount": 5,
    "totalOutstanding": 45000
  }
}
```

---

## ⚙️ Service Layer

### CreditCycleService

```javascript
// Process partial repayment
await CreditCycleService.processPartialRepayment(
  cycleId,
  repaymentAmount,
  repaymentDate,
  paymentDetails
);

// Get active cycles
const cycles = await CreditCycleService.getActiveCyclesForVendor(vendorId);

// Validate new purchase
const validation = await CreditCycleService.validateNewPurchase(
  vendorId,
  purchaseAmount
);

// Get full summary
const summary = await CreditCycleService.getVendorCreditSummary(vendorId);
```

---

## ✅ Implementation Checklist

- [x] Enhanced CreditPurchase model with cycle fields
- [x] Added lifecycle hooks (auto-initialize on approval)
- [x] Created CreditCycleService for cycle operations
- [x] Overpayment prevention validation
- [x] Pro-rata discount/interest calculation
- [x] Independent cycle tracking
- [ ] Update vendorRepaymentController to use CreditCycleService
- [ ] Update notification service for cycle-based reminders
- [ ] Frontend UI for selecting which cycle to repay
- [ ] Admin dashboard for viewing vendor cycles
- [ ] Migration script for existing purchases

---

## 🧪 Testing Scenarios

### Test 1: Simple Partial Repayment
1. Create cycle with ₹20,000
2. Repay ₹5,000 on Day 25
3. Verify: Outstanding = ₹15,000, Credit restored = ₹5,000

### Test 2: Multiple Cycles
1. Create Cycle #1: ₹20,000
2. Create Cycle #2: ₹30,000
3. Repay ₹10,000 to Cycle #1
4. Verify: Cycle #2 unaffected

### Test 3: Overpayment Prevention
1. Cycle outstanding: ₹5,000
2. Attempt repayment: ₹7,000
3. Verify: Error thrown

### Test 4: Full Cycle Closure
1. Create cycle: ₹10,000
2. Repay ₹10,000
3. Verify: cycleStatus = 'closed', availableCredit restored

---

**Documentation Version**: 2.0.0  
**System Type**: Independent Credit Cycles  
**Last Updated**: 2026-01-23
