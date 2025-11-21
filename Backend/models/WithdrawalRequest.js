const mongoose = require('mongoose');

/**
 * Withdrawal Request Schema
 * 
 * Sellers can request withdrawals from their wallet balance
 * Admin approves/rejects these requests
 * When approved, seller wallet balance is decreased
 */
const withdrawalRequestSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: [true, 'Seller ID is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Withdrawal amount is required'],
    min: [100, 'Minimum withdrawal amount is ₹100'],
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
  // Payment details (for future payment integration)
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cash'],
    default: 'bank_transfer',
  },
  paymentDetails: {
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    bankName: String,
    accountHolderName: String,
  },
  // Notes
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
withdrawalRequestSchema.index({ sellerId: 1, status: 1 }); // Seller's withdrawals by status
withdrawalRequestSchema.index({ status: 1, createdAt: -1 }); // Pending withdrawals for admin

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = WithdrawalRequest;

