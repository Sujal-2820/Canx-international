# Admin Quick Reference: Vendor Credit Management

## 🎯 Common Admin Tasks

### 1. Reward a High-Performing Vendor

**When to use**: Vendor has excellent payment history and deserves credit increase

**API Call**:
```bash
PUT /api/admin/credit/vendors/:vendorId/limit
Authorization: Bearer {your_admin_token}

Body:
{
  "newLimit": 150000,
  "reason": "Excellent payment performance - 100% on-time repayments for 6 months"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Credit limit increased successfully",
  "data": {
    "vendor": { "id": "...", "vendorId": "VND-123", "name": "ABC Traders" },
    "oldLimit": 100000,
    "newLimit": 150000,
    "adjustment": 50000,
    "availableCredit": 150000
  }
}
```

**Result**: Vendor automatically receives in-app notification about the increase! 🎉

---

### 2. Analyze Vendor Performance

**When to use**: Before making credit limit decisions

**API Call**:
```bash
GET /api/admin/credit/vendors/:vendorId/analysis
Authorization: Bearer {your_admin_token}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "vendorName": "ABC Traders",
    "currentLimit": 100000,
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

**What to do**:
- ✅ **"increase" + low risk**: Go ahead and increase limit!
- ⚠️ **"maintain" + medium risk**: Monitor closely
- 🚨 **"decrease" + high risk**: Consider reducing limit or discussing with vendor

---

### 3. Get All Vendors Sorted by Performance

**When to use**: Review all vendors at once, identify top performers

**API Call**:
```bash
GET /api/admin/credit/vendors/performance?sortBy=creditScore&order=desc
Authorization: Bearer {your_admin_token}
```

**Query Parameters**:
- `sortBy`: `creditScore` | `utilizationRate` | `totalRepayments` | `avgRepaymentDays`
- `order`: `asc` | `desc`
- `tier`: `bronze` | `silver` | `gold` | `platinum` | `not_rated` | `all`
- `minScore`: `0-100`
- `maxScore`: `0-100`

**Example - Find Top Performers**:
```bash
GET /api/admin/credit/vendors/performance?sortBy=creditScore&order=desc&minScore=90
```

**Example - Find Risky Vendors**:
```bash
GET /api/admin/credit/vendors/performance?sortBy=creditScore&order=asc&maxScore=60
```

**Response**:
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "vendorId": "VND-101",
      "name": "ABC Traders",
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
      "totalInterestPaid": 0
    }
  ]
}
```

---

### 4. Bulk Analyze All Vendors

**When to use**: Monthly/quarterly review, identify vendors needing attention

**API Call**:
```bash
POST /api/admin/credit/vendors/bulk-analyze
Authorization: Bearer {your_admin_token}
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "totalAnalyzed": 42,
    "recommendIncrease": 15,
    "recommendMaintain": 20,
    "recommendDecrease": 7
  },
  "data": {
    "increase": [
      /* 15 vendors recommended for increase */
    ],
    "maintain": [
      /* 20 vendors to maintain current limit */
    ],
    "decrease": [
      /* 7 vendors needing limit decrease */
    ]
  }
}
```

**Action Plan**:
1. Review "increase" list → Reward top performers
2. Review "decrease" list → Contact vendors or reduce limits
3. Monitor "maintain" list → No action needed

---

### 5. Update Vendor Performance Tier

**When to use**: Manually override auto-calculated tier

**API Call**:
```bash
PUT /api/admin/credit/vendors/:vendorId/tier
Authorization: Bearer {your_admin_token}

Body:
{
  "tier": "platinum",
  "reason": "Exceptional long-term performance"
}
```

**Valid Tiers**: `bronze` | `silver` | `gold` | `platinum` | `not_rated`

---

## 📊 Understanding Metrics

### Credit Score (0-100)
- **90-100**: Excellent - Safe to increase limit
- **75-89**: Good - Maintain current limit
- **60-74**: Fair - Monitor closely
- **0-59**: Poor - Consider reducing limit

**Calculation**:
- 40 points: On-time repayment rate
- 30 points: Average repayment speed
- 20 points: Discount vs. Interest ratio
- 10 points: Recent performance consistency

### On-Time Rate
- **≥90%**: Excellent reliability
- **80-89%**: Good reliability
- **60-79%**: Fair - Some delays
- **\u003c60%**: Poor - Frequent delays

### Average Repayment Days
- **≤30**: Lightning fast (high discount tier)
- **31-60**: Good (moderate discount tier)
- **61-90**: Acceptable (low discount tier)
- **91-104**: Slow (neutral zone)
- **\u003e104**: Overdue (interest zone)

### Utilization Rate
- **0-50%**: Healthy
- **51-79%**: Moderate
- **80-100%**: High (vendor will receive warning)

---

## 🎯 Decision Matrix

### When to Increase Credit Limit

✅ Credit Score ≥ 90  
✅ On-Time Rate ≥ 90%  
✅ Avg Repayment ≤ 45 days  
✅ Discounts Earned \u003e Interest Paid  
✅ 5+ successful repayments  

**Suggested Increase**:
- **Top-tier** (Score 95+, 10+ repayments): +₹50,000
- **High performer** (Score 85-94): +₹25,000
- **Good performer** (Score 75-84): +₹10,000

### When to Decrease Credit Limit

🚨 Credit Score \u003c 60  
🚨 On-Time Rate \u003c 60%  
🚨 Avg Repayment \u003e 100 days  
🚨 Interest Paid \u003e 2× Discounts Earned  
🚨 Multiple overdue payments  

**Suggested Decrease**: -20% of current limit

### When to Maintain

⚖️ Credit Score 60-89  
⚖️ On-Time Rate 60-89%  
⚖️ Mixed performance  

---

## 🔔 Notification System (Automated)

### What Vendors Receive (Automatically)

**Day 60**: "💰 Still Time to Save!" (Normal priority)  
**Day 85**: "⏰ Discount Ending Soon" (High priority)  
**Day 100**: "⚠️ Deadline Approaching" (Urgent)  
**Day 104**: "🚨 LAST DAY - Interest Starts Tomorrow!" (Urgent)  
**Day 105+**: "⚠️ Overdue - Interest Applied" (Every 5 days, Urgent)  
**Day 121+**: "🚨 CRITICAL - Severe Delay" (Every 10 days, Urgent)  

**Credit Limit Increase**: Automatic notification when admin increases limit  
**High Utilization**: Warning when usage ≥ 80% (once per week)  

### Admin Actions
- Scheduler runs daily at 10:00 AM IST
- No manual intervention needed
- All notifications auto-expire after 24 hours

---

## 🛠️ Troubleshooting

### Vendor Not Receiving Notifications?
1. Check if vendor is `active` and `approved`
2. Verify they have pending credit purchases
3. Check VendorNotification collection in database
4. Ensure cron scheduler is running (check server logs)

### Credit Score Seems Wrong?
- Score updates after each repayment completion
- Requires minimum 3 repayments for accurate calculation
- New vendors start with score 100

### Bulk Analyze Returns Empty?
- Requires vendors with ≥3 completed repayments
- Check if any vendors meet criteria

---

## 📞 Quick Support Commands

### Check Scheduler Status
```bash
# Check server logs for:
✅ Credit notification scheduler initialized
```

### Manual Trigger (Development/Testing)
```javascript
// In Node.js console
const CreditNotificationService = require('./services/creditNotificationService');
await CreditNotificationService.sendScheduledRepaymentReminders();
```

### View Recent Notifications
```javascript
// MongoDB query
db.vendornotifications.find({ type: 'repayment_due_reminder' }).sort({ createdAt: -1 }).limit(10)
```

---

## 🎓 Best Practices

1. **Review Performance Monthly**: Use bulk analyze endpoint
2. **Reward Top Performers**: Increase limits for 90+ score vendors
3. **Address Poor Performance**: Contact vendors with \u003c60 score before reducing
4. **Document Decisions**: Always provide clear "reason" in API calls
5. **Monitor Trends**: Track credit score changes over time
6. **Be Fair**: Use data-driven decisions, not arbitrary judgments

---

**Need Help?**  
Refer to: `VENDOR_CREDIT_NOTIFICATION_SYSTEM.md` (Full Documentation)  
Or: `IMPLEMENTATION_SUMMARY.md` (Complete Implementation Details)
