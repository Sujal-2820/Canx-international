const mongoose = require('mongoose');

/**
 * Credit Purchase Request Schema
 * 
 * Vendors can request credit purchases (minimum ₹50,000)
 * Admin approves/rejects these requests
 * When approved, vendor credit is updated and inventory is added
 */
const creditPurchaseSchema = new mongoose.Schema({
  creditPurchaseId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
    // Format: CRP-101, CRP-102, etc.
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required'],
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
    },
    attributeCombination: {
      type: Map,
      of: String,
      default: undefined,
    },
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [50000, 'Minimum purchase amount is ₹50,000'], // MIN_VENDOR_PURCHASE
    max: [100000, 'Maximum purchase amount is ₹100,000'], // MAX_VENDOR_PURCHASE
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  // Admin actions
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  reviewedAt: Date,
  rejectionReason: {
    type: String,
    trim: true,
  },
  // Notes
  notes: {
    type: String,
    trim: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  bankDetails: {
    accountName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    ifsc: {
      type: String,
      trim: true,
      uppercase: true,
    },
    branch: {
      type: String,
      trim: true,
    },
  },
  confirmationText: {
    type: String,
    trim: true,
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'in_transit', 'delivered'],
    default: 'pending',
  },
  expectedDeliveryAt: Date,
  deliveredAt: Date,
  deliveryNotes: {
    type: String,
    trim: true,
  },
  hasOutstandingDues: {
    type: Boolean,
    default: false,
  },
  outstandingDuesAmount: {
    type: Number,
    default: 0,
  },

  // ============================================================================
  // CREDIT CYCLE FIELDS (Independent Cycle Per Purchase)
  // ============================================================================

  /**
   * Credit Cycle Status
   * Each approved credit purchase becomes an independent credit cycle
   */
  cycleStatus: {
    type: String,
    enum: ['inactive', 'active', 'partially_paid', 'fully_paid', 'closed'],
    default: 'inactive',
    // inactive: Not yet approved
    // active: Approved, no repayments made
    // partially_paid: Some repayment made, outstanding > 0
    // fully_paid: All repayments made, outstanding = 0
    // closed: Cycle completed and closed
  },

  /**
   * Principal Amount (Original credit taken)
   * This is the base amount for discount/interest calculations
   */
  principalAmount: {
    type: Number,
    // Same as totalAmount, but semantically represents the loan principal
  },

  /**
   * Outstanding Amount (Remaining to be repaid)
   * Decreases with each repayment
   */
  outstandingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Outstanding amount cannot be negative'],
  },

  /**
   * Total Repaid Amount (Sum of all repayments for this cycle)
   */
  totalRepaid: {
    type: Number,
    default: 0,
    min: [0, 'Total repaid cannot be negative'],
  },

  /**
   * Cycle Start Date (When cycle became active)
   * All discount/interest calculations are relative to this date
   */
  cycleStartDate: {
    type: Date,
    // Set when status changes to 'approved'
  },

  /**
   * Repayment History for this Cycle
   * Array of repayment references
   */
  repayments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditRepayment'
  }],

  /**
   * Last Repayment Date
 */
  lastRepaymentDate: {
    type: Date,
  },

  /**
   * Cycle Closed Date
   * Set when outstandingAmount reaches 0
   */
  cycleClosedDate: {
    type: Date,
  },

  /**
   * Total Discount Earned on this Cycle
   */
  totalDiscountEarned: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },

  /**
   * Total Interest Paid on this Cycle
   */
  totalInterestPaid: {
    type: Number,
    default: 0,
    min: [0, 'Interest cannot be negative'],
  },

  /**
   * Repayment Status Tracking
   * For admin/vendor dashboard display
   */
  repaymentStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },

}, {
  timestamps: true,
});

// Indexes
creditPurchaseSchema.index({ vendorId: 1, status: 1 }); // Vendor's purchases by status
creditPurchaseSchema.index({ status: 1, createdAt: -1 }); // Pending purchases for admin
creditPurchaseSchema.index({ vendorId: 1, cycleStatus: 1 }); // Active cycles per vendor
creditPurchaseSchema.index({ cycleStatus: 1, cycleStartDate: 1 }); // Cycle queries
// Note: creditPurchaseId already has an index from unique: true

// Virtual: Calculate total amount from items
creditPurchaseSchema.virtual('calculatedTotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
});

// Virtual: Calculate days elapsed since cycle start
creditPurchaseSchema.virtual('daysElapsed').get(function () {
  if (!this.cycleStartDate) return 0;
  const now = new Date();
  const start = new Date(this.cycleStartDate);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
});

// Pre-save: Validate total amount matches items
creditPurchaseSchema.pre('save', function (next) {
  const calculatedTotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
    return next(new Error('Total amount does not match sum of items'));
  }
  next();
});

// Pre-save: Initialize cycle fields when approved
creditPurchaseSchema.pre('save', function (next) {
  // Check if status is changing to 'approved'
  if (this.isModified('status') && this.status === 'approved' && !this.cycleStartDate) {
    // Initialize credit cycle
    this.cycleStatus = 'active';
    this.principalAmount = this.totalAmount;
    this.outstandingAmount = this.totalAmount;
    this.totalRepaid = 0;
    this.cycleStartDate = new Date();
    this.repaymentStatus = 'not_started';
    this.totalDiscountEarned = 0;
    this.totalInterestPaid = 0;

    console.log(`[CreditPurchase] Cycle initialized for purchase ${this.creditPurchaseId}: ₹${this.totalAmount}`);
  }

  // Auto-update repayment status based on totalRepaid
  if (this.isModified('totalRepaid')) {
    if (this.totalRepaid === 0) {
      this.repaymentStatus = 'not_started';
    } else if (this.totalRepaid < this.principalAmount) {
      this.repaymentStatus = 'in_progress';
    } else if (this.totalRepaid >= this.principalAmount) {
      this.repaymentStatus = 'completed';
    }
  }

  // Auto-update cycle status based on outstanding amount
  if (this.isModified('outstandingAmount')) {
    if (this.outstandingAmount === 0 && this.cycleStatus !== 'closed') {
      this.cycleStatus = 'fully_paid';
    } else if (this.outstandingAmount > 0 && this.outstandingAmount < this.principalAmount) {
      this.cycleStatus = 'partially_paid';
    }
  }

  next();
});

// Instance method: Check if cycle allows repayment
creditPurchaseSchema.methods.canAcceptRepayment = function () {
  return this.cycleStatus === 'active' ||
    this.cycleStatus === 'partially_paid';
};

// Instance method: Get remaining outstanding
creditPurchaseSchema.methods.getRemainingOutstanding = function () {
  return this.outstandingAmount || 0;
};

// Instance method: Close cycle
creditPurchaseSchema.methods.closeCycle = function () {
  if (this.outstandingAmount === 0) {
    this.cycleStatus = 'closed';
    this.cycleClosedDate = new Date();
    console.log(`[CreditPurchase] Cycle closed for purchase ${this.creditPurchaseId}`);
  }
};

const CreditPurchase = mongoose.model('CreditPurchase', creditPurchaseSchema);

module.exports = CreditPurchase;

