# Credit Cycle System - Quick Start Guide

## 🚀 For Developers

### TL;DR
Each credit purchase = Independent cycle. Partial repayments OK. Credit restored incrementally.

---

## 📝 Core Concept (5-Second Version)

```
OLD: Total credit used = ₹45,000 → Pay ₹10,000 → Credit used = ₹35,000
NEW: Cycle1(₹20k) + Cycle2(₹25k) → Pay ₹10k to Cycle1 → Cycle1(₹10k) + Cycle2(₹25k)
```

**Rule**: Each purchase is a separate loan. Repayments go to specific loans.

---

## 💻 How to Use

### 1. Create Credit Purchase (Automatic)
```javascript
// When admin approves CreditPurchase
creditPurchase.status = 'approved';
await creditPurchase.save();

// Auto-initialized by pre-save hook:
// ✅ cycleStatus = 'active'
// ✅ principalAmount = totalAmount
// ✅ outstandingAmount = totalAmount
// ✅ cycleStartDate = now
```

### 2. Process Partial Repayment
```javascript
const CreditCycleService = require('./services/creditCycleService');

// Vendor repays ₹5,000 to specific cycle
const result = await CreditCycleService.processPartialRepayment(
  cycleId,           // Which cycle
  5000,              // How much to repay
  new Date(),        // When
  {                  // Payment details
    paymentMethod: 'razorpay',
    razorpayPaymentId: 'pay_xxx',
    status: 'completed'
  }
);

console.log(result.cycle.outstandingAmount);  // Reduced by ₹5,000
console.log(result.vendor.availableCredit);   // Increased by ₹5,000
console.log(result.repayment.discountEarned); // ₹250 (if early)
```

### 3. Get Active Cycles
```javascript
const cycles = await CreditCycleService.getActiveCyclesForVendor(vendorId);

// Returns:
cycles.forEach(cycle => {
  console.log(`${cycle.creditPurchaseId}: ₹${cycle.outstandingAmount} outstanding`);
});
```

### 4. Get Vendor Summary
```javascript
const summary = await CreditCycleService.getVendorCreditSummary(vendorId);

// Access:
summary.vendor.availableCredit;    // Total available
summary.cycles.active;              // Array of active cycles
summary.cycles.totalOutstanding;    // Sum of all outstanding
```

---

## 🔍 Key Fields Cheat Sheet

### CreditPurchase (Cycle)
```javascript
{
  // Status
  cycleStatus: 'active' | 'partially_paid' | 'fully_paid' | 'closed',
  
  // Amounts
  principalAmount: 20000,      // Original
  outstandingAmount: 15000,    // Current
  totalRepaid: 5000,           // Paid so far
  
  // Dates
  cycleStartDate: Date,        // When cycle started
  lastRepaymentDate: Date,     // Last payment
  cycleClosedDate: Date,       // If closed
  
  // Tracking
  repayments: [ObjectId],      // All repayments
  totalDiscountEarned: 250,
  totalInterestPaid: 0
}
```

---

## ⚠️ Important Rules

### DO ✅
```javascript
// Use CreditCycleService for repayments
await CreditCycleService.processPartialRepayment(cycleId, amount);

// Query active cycles only
{ cycleStatus: { $in: ['active', 'partially_paid'] } }

// Check outstanding before payment
if (amount > cycle.getRemainingOutstanding()) {
  // Reject overpayment
}
```

### DON'T ❌
```javascript
// Don't modify cycle fields directly
cycle.outstandingAmount -= amount;  // ❌ Use service method

// Don't create CreditRepayment without service
await CreditRepayment.create({...});  // ❌ Bypasses cycle logic

// Don't query by totalAmount
{ totalAmount: { $gt: 0 } }  // ❌ Use outstandingAmount instead
```

---

## 🔄 Workflow Diagrams

### New Purchase Flow
```
Admin approves purchase
    ↓
Pre-save hook runs
    ↓
Cycle initialized
    ├─ cycleStatus = 'active'
    ├─ principalAmount = totalAmount
    ├─ outstandingAmount = totalAmount
    └─ cycleStartDate = now
    ↓
Vendor.creditUsed += amount
```

### Partial Repayment Flow
```
Vendor initiates repayment
    ↓
Validate: amount ≤ outstandingAmount
    ↓
Calculate discount/interest (based on cycleStartDate)
    ↓
Create CreditRepayment record
    ↓
Update Cycle:
    ├─ outstandingAmount -= amount
    ├─ totalRepaid += amount
    ├─ cycleStatus updated
    └─ repayments.push(repaymentId)
    ↓
Update Vendor:
    ├─ creditUsed -= amount
    └─ creditHistory updated
    ↓
If outstanding = 0 → closeCycle()
```

---

## 🧪 Quick Test

```javascript
// Test in Node REPL or test file
const CreditCycleService = require('./services/creditCycleService');
const CreditPurchase = require('./models/CreditPurchase');

// 1. Find a cycle
const cycle = await CreditPurchase.findOne({ cycleStatus: 'active' });
console.log('Outstanding:', cycle.outstandingAmount);

// 2. Make partial repayment
const result = await CreditCycleService.processPartialRepayment(
  cycle._id,
  1000,  // ₹1,000
  new Date()
);

// 3. Verify
console.log('New outstanding:', result.cycle.outstandingAmount);
console.log('Credit restored:', result.vendor.availableCredit);
console.log('Discount earned:', result.repayment.discountEarned);
```

---

## 📱 Frontend Usage

### Get Cycles for UI
```javascript
// In vendor dashboard
const response = await vendorApi.getActiveCycles();

// Display each cycle
cycles.map(cycle => (
  <CycleCard
    key={cycle.id}
    cycleId={cycle.creditPurchaseId}
    outstanding={cycle.outstandingAmount}
    daysElapsed={cycle.daysElapsed}
    onRepay={() => handleRepayment(cycle.id)}
  />
))
```

### Repayment UI
```javascript
// User selects cycle and amount
const [selectedCycle, setSelectedCycle] = useState(null);
const [amount, setAmount] = useState(0);

const handleRepay = async () => {
  // Validate
  if (amount > selectedCycle.outstandingAmount) {
    alert(`Max: ₹${selectedCycle.outstandingAmount}`);
    return;
  }
  
  // Process
  await vendorApi.repayCycle(selectedCycle.id, amount);
};
```

---

## 📚 Where to Look

### Understand Concept
- `CREDIT_CYCLE_SYSTEM.md` - Full technical docs

### Deploy System
- `CREDIT_CYCLE_IMPLEMENTATION.md` - Implementation guide
- `scripts/migrateToCreditCycles.js` - Migration script

### Use in Code
- `services/creditCycleService.js` - All cycle operations
- `models/CreditPurchase.js` - Cycle model with hooks

### Modify Behavior
- Discount/Interest: `services/repaymentCalculationService.js`
- Notifications: `services/creditNotificationService.js`

---

## 🆘 Troubleshooting

**Cycle not auto-initializing?**  
→ Check if `status === 'approved'` trigger happened

**Overpayment error?**  
→ Good! System working correctly. Max = outstandingAmount

**Credit not restoring?**  
→ Ensure using `CreditCycleService.processPartialRepayment()`

**Notification missing cycleId?**  
→ Check if notification created after system update

---

## 🎯 Remember

1. **One purchase = One cycle**
2. **OutstandingAmount is truth** (not totalAmount)
3. **Use service methods** (not direct DB updates)
4. **Overpayment blocked** (by design)
5. **Cycles are independent** (operate in parallel)

---

**Quick Start Version**: 1.0  
**For**: Developers integrating credit cycle system  
**Last Updated**: 2026-01-23
