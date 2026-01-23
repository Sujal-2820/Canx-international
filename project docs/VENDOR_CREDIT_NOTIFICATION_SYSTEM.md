# Vendor Credit Management & Notification System

## Overview
This document describes the comprehensive credit management and automated notification system for vendors in the FarmCommerce platform.

## System Components

### 1. Credit Limit Structure

#### Default Configuration
- **Initial Credit Limit**: ₹100,000 (₹1,00,000) for all new vendors
- **Credit Usage Tracking**: Real-time monitoring of utilized credit
- **Available Credit**: Automatically calculated as `creditLimit - creditUsed`

#### Performance-Based Adjustments
Admin can adjust credit limits based on vendor performance:
- **Top-tier performers** (Credit Score ≥ 95, 10+ repayments): +₹50,000
- **High performers** (Credit Score ≥ 85): +₹25,000
- **Good performers** (Credit Score ≥ 75): +₹10,000
- **Poor performers** (Credit Score \u003c 60): -20% reduction

### 2. Credit Performance Analytics

#### Tracked Metrics
- `totalCreditTaken`: Cumulative credit purchases
- `totalRepaid`: Total amount successfully repaid
- `totalDiscountsEarned`: Savings from early repayments
- `totalInterestPaid`: Interest on late repayments
- `avgRepaymentDays`: Average time to repay (moving average)
- `onTimeRepaymentCount`: Payments within 90 days
- `lateRepaymentCount`: Payments after 90 days
- `creditScore`: Calculated score (0-100)

#### Credit Score Calculation
```
Base Score: 100

Factor 1: On-time repayment rate (40 points)
  - Penalty: (1 - onTimeRate) × 40

Factor 2: Average repayment days (30 points)
  - Target: ≤ 45 days
  - Penalty: min(((avgDays - 45) / 45) × 30, 30)

Factor 3: Interest-to-discount ratio (20 points)
  - Ideal: More discounts than interest
  - Penalty: (interestPaid / (discounts + interest + 1)) × 20

Factor 4: Repayment consistency (10 points)
  - Penalty if recent performance declining: -10

Final Score: max(0, min(100, roundedScore))
```

### 3. Automated Notification System

#### Notification Schedule

##### Repayment Reminders (Daily at 10:00 AM IST)
1. **Day 60**: First gentle reminder
   - Still in 3% discount zone
   - "Still Time to Save! 💰"
   - Priority: Normal

2. **Day 85**: Second reminder
   - Approaching neutral zone
   - "Discount Ending Soon ⏰"
   - Priority: High

3. **Day 100**: Third reminder
   - About to enter interest zone
   - "Credit Payment Deadline Approaching ⚠️"
   - Priority: Urgent

4. **Day 104**: Last day reminder
   - Final day before interest
   - "🚨 LAST DAY - Interest Starts Tomorrow!"
   - Priority: Urgent

5. **Day 105-120**: Overdue alerts (every 5 days)
   - 5% interest zone
   - "Overdue Payment - Interest Applied ⚠️"
   - Priority: Urgent

6. **Day 121+**: Severe overdue (every 10 days)
   - 10% interest zone
   - "🚨 CRITICAL: Severe Payment Delay"
   - Priority: Urgent

##### High Utilization Warnings (Daily at 6:00 PM IST)
- Triggered when credit usage ≥ 80%
- Sent once every 7 days to avoid spam
- Encourages timely repayment

##### Cleanup Jobs (Daily at 2:00 AM IST)
- Auto-delete notifications older than 24 hours
- Maintains database performance

### 4. Performance Analysis Algorithm

#### Automatic Recommendations
The system analyzes vendor performance and generates recommendations:

```javascript
Recommendation Types:
- 'increase': Vendor deserves higher credit limit
- 'maintain': Current limit is appropriate
- 'decrease': Vendor showing risk indicators

Risk Levels:
- 'low': Excellent performance
- 'medium': Some concerns
- 'high': Action required
```

#### Analysis Rules
1. **Credit Score Rule**
   - Score ≥ 90: Recommend increase
   - Score \u003c 60: Recommend decrease + high risk

2. **On-Time Payment Rule**
   - Rate ≥ 90%: Recommend increase
   - Rate \u003c 60%: Recommend decrease + high risk

3. **Repayment Speed Rule**
   - Avg ≤ 30 days: Bonus (high discount tier usage)
   - Avg \u003e 100 days: Medium risk flag

4. **Financial Discipline Rule**
   - Discounts \u003e Interest: Positive indicator
   - Interest \u003e 2× Discounts: Medium/high risk

5. **Activity Rule**
   - 10+ repayments: Active vendor bonus
   - Combined with excellent performance: Larger increase

### 5. Admin Capabilities

#### API Endpoints

##### 1. Adjust Credit Limit
```http
PUT /api/admin/credit/vendors/:vendorId/limit
Authorization: Bearer {admin_token}

Request Body:
{
  "newLimit": 150000,
  "reason": "Excellent payment performance for 6 months"
}

Response:
{
  "success": true,
  "message": "Credit limit increased successfully",
  "data": {
    "vendor": { "id", "vendorId", "name" },
    "oldLimit": 100000,
    "newLimit": 150000,
    "adjustment": 50000,
    "reason": "...",
    "availableCredit": 150000
  }
}
```

##### 2. Get Performance Analysis
```http
GET /api/admin/credit/vendors/:vendorId/analysis
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "vendorId": "...",
    "vendorName": "...",
    "currentLimit": 100000,
    "currentUsed": 45000,
    "availableCredit": 55000,
    "creditScore": 92,
    "performanceTier": "gold",
    "recommendation": "increase",
    "suggestedNewLimit": 125000,
    "reasoning": [
      "Excellent credit score (90+)",
      "Excellent on-time payment rate (95.2%)",
      "High performer: +₹25,000 increase recommended"
    ],
    "riskLevel": "low"
  }
}
```

##### 3. Get All Vendors with Metrics
```http
GET /api/admin/credit/vendors/performance?sortBy=creditScore&order=desc
Authorization: Bearer {admin_token}

Query Parameters:
- sortBy: creditScore | utilizationRate | totalRepayments | avgRepaymentDays
- order: asc | desc
- tier: bronze | silver | gold | platinum | not_rated | all
- minScore: 0-100
- maxScore: 0-100

Response:
{
  "success": true,
  "count": 42,
  "data": [
    {
      "id": "...",
      "vendorId": "VND-101",
      "name": "...",
      "creditLimit": 150000,
      "creditUsed": 45000,
      "availableCredit": 105000,
      "utilizationRate": "30.00",
      "creditScore": 95,
      "performanceTier": "platinum",
      "totalRepayments": 12,
      "avgRepaymentDays": 25,
      "onTimeRate": "100.0",
      "totalDiscountsEarned": 25000,
      "totalInterestPaid": 0,
      "lastRepaymentDate": "2026-01-20T10:30:00Z"
    }
  ]
}
```

##### 4. Bulk Analyze Vendors
```http
POST /api/admin/credit/vendors/bulk-analyze
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "summary": {
    "totalAnalyzed": 42,
    "recommendIncrease": 15,
    "recommendMaintain": 20,
    "recommendDecrease": 7
  },
  "data": {
    "increase": [ /* vendors recommended for increase */ ],
    "maintain": [ /* vendors to maintain */ ],
    "decrease": [ /* vendors needing decrease */ ]
  }
}
```

##### 5. Update Performance Tier
```http
PUT /api/admin/credit/vendors/:vendorId/tier
Authorization: Bearer {admin_token}

Request Body:
{
  "tier": "platinum",
  "reason": "Exceptional performance for 12 months"
}

Valid tiers: bronze | silver | gold | platinum | not_rated
```

### 6. Notification Types & Metadata

#### Notification Model
```javascript
{
  vendorId: ObjectId,
  type: String, // See types below
  title: String,
  message: String,
  relatedEntityType: 'credit_purchase' | 'order' | 'none',
  relatedEntityId: ObjectId,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  read: Boolean,
  readAt: Date,
  metadata: Map,
  expiresAt: Date, // Auto-delete after 24 hours
  createdAt: Date,
  updatedAt: Date
}
```

#### Notification Types
- `repayment_due_reminder`: Scheduled payment reminders
- `repayment_overdue_alert`: Late payment alerts
- `repayment_success`: Successful repayment confirmation
- `credit_purchase_approved`: Credit purchase approved
- `credit_purchase_rejected`: Credit purchase rejected
- `admin_announcement`: Credit limit increases & tier upgrades
- `system_alert`: High utilization warnings

### 7. Integration Points

#### Vendor Context Updates
Vendors receive real-time notifications via:
1. In-app notification panel (VendorDashboard)
2. Real-time WebSocket updates
3. `VendorNotification` model with 24-hour auto-delete

#### Frontend Integration
```javascript
// In VendorContext or useVendorApi
const { notifications } = useVendorState();

// Filter credit-related notifications
const creditNotifications = notifications.filter(n => 
  n.type.includes('repayment') || 
  n.type.includes('credit')
);

// Check for urgent reminders
const urgentReminders = creditNotifications.filter(n => 
  n.priority === 'urgent' && !n.read
);
```

### 8. Business Rules Summary

#### ✅ Implemented Features
1. ✅ Default ₹100,000 credit for new vendors
2. ✅ Automated daily reminders (6 reminder stages)
3. ✅ Performance-based credit score (0-100)
4. ✅ Admin tools for credit limit adjustments
5. ✅ AI-driven performance analysis
6. ✅ High utilization warnings (≥80%)
7. ✅ Tiered vendor classification
8. ✅ Comprehensive metrics tracking
9. ✅ Auto-cleanup of old notifications

#### 🔧 Configuration
- Reminder times: 10:00 AM IST (customizable in cron)
- Utilization threshold: 80% (configurable in service)
- Notification expiry: 24 hours
- Credit score update: After each repayment
- Performance tier: Manual/auto via admin API

### 9. Testing Recommendations

#### Manual Testing
1. Create test vendor with approved status
2. Make credit purchase
3. Manually adjust system date to test reminders
4. Verify notifications appear in VendorNotification collection
5. Test admin APIs with Postman/Insomnia

#### Automated Testing
```javascript
// Test notification service
const result = await CreditNotificationService.sendScheduledRepaymentReminders();
console.log(`Created ${result.remindersCreated} reminders`);

// Test performance analysis
const analysis = await CreditNotificationService.analyzeVendorPerformance(vendorId);
console.log(analysis);
```

### 10. Deployment Checklist

- [x] Database migration: Update existing vendors with default ₹100,000 limit
- [x] Cron scheduler integration in server startup
- [x] Admin routes protected with authentication
- [x] Notification model with TTL index
- [x] Graceful shutdown for scheduler jobs
- [ ] Environment variables (if needed for customization)
- [ ] Monitoring/logging for scheduler jobs
- [ ] Admin dashboard UI (future enhancement)

### 11. Future Enhancements

1. **SMS/Email Notifications**: Integrate Twilio/SendGrid for critical alerts
2. **Push Notifications**: FCM for mobile app alerts
3. **Customizable Reminder Schedule**: Per-vendor reminder preferences
4. **Auto-Credit Limit Adjustment**: AI auto-approve for top performers
5. **Repayment Prediction**: ML model to predict payment behavior
6. **Gamification**: Badges/rewards for excellent payment performance

---

## Technical Implementation Summary

### Files Added/Modified

#### New Files
1. `Backend/services/creditNotificationService.js` - Core notification logic
2. `Backend/schedulers/creditNotificationScheduler.js` - Cron job scheduler
3. `Backend/controllers/adminCreditManagementController.js` - Admin API
4. `Backend/routes/adminCreditManagement.js` - Admin routes

#### Modified Files
1. `Backend/models/Vendor.js` - Default credit limit: 0 → 100000
2. `Backend/index.js` - Integrated scheduler & admin routes

### Dependencies
- `node-cron`: Scheduler (already in package.json)
- Existing models: Vendor, VendorNotification, CreditPurchase, CreditRepayment
- Existing services: RepaymentCalculationService

---

**Documentation Version**: 1.0.0  
**Last Updated**: 2026-01-23  
**Author**: Antigravity AI Assistant
