/**
 * Credit Cycle Management Service
 * 
 * Handles independent credit cycles per purchase with partial repayment support
 * 
 * CORE RULE: Each credit usage creates an independent cycle.
 * Repayments affect only that specific cycle, not the entire outstanding credit.
 */

const CreditPurchase = require('../models/CreditPurchase');
const CreditRepayment = require('../models/CreditRepayment');
const Vendor = require('../models/Vendor');
const RepaymentCalculationService = require('./repaymentCalculationService');

class CreditCycleService {
    /**
     * Process Partial Repayment for a Specific Credit Cycle
     * 
     * @param {ObjectId} purchaseId - The credit purchase (cycle) being repaid
     * @param {Number} repaymentAmount - Amount vendor wants to repay
     * @param {Date} repaymentDate - When repayment is being made
     * @param {Object} paymentDetails - Payment method, razorpay IDs, etc.
     * @returns {Object} - Updated cycle info and repayment record
     */
    static async processPartialRepayment(purchaseId, repaymentAmount, repaymentDate = new Date(), paymentDetails = {}) {
        try {
            // Step 1: Find the credit cycle
            const cycle = await CreditPurchase.findById(purchaseId).populate('vendorId');

            if (!cycle) {
                throw new Error('Credit cycle not found');
            }

            if (cycle.status !== 'approved') {
                throw new Error('Credit cycle not approved yet');
            }

            if (!cycle.canAcceptRepayment()) {
                throw new Error('Credit cycle cannot accept repayments (already closed)');
            }

            const vendor = cycle.vendorId;
            const outstandingBeforeRepayment = cycle.outstandingAmount;

            // Step 2: Validate repayment amount
            if (repaymentAmount <= 0) {
                throw new Error('Repayment amount must be greater than 0');
            }

            if (repaymentAmount > outstandingBeforeRepayment) {
                throw new Error(`Repayment amount (₹${repaymentAmount}) exceeds outstanding (₹${outstandingBeforeRepayment}). To prevent overpayment, maximum allowed is ₹${outstandingBeforeRepayment}`);
            }

            // Step 3: Calculate discount/interest for THIS repayment
            // Calculation is based on the CYCLE START DATE, not repayment date
            const daysElapsed = Math.floor(
                (new Date(repaymentDate) - new Date(cycle.cycleStartDate)) / (1000 * 60 * 60 * 24)
            );

            // Calculate what would be owed on the FULL principal at this time
            const fullCalculation = await RepaymentCalculationService.calculateRepaymentAmount(cycle, repaymentDate);

            // Pro-rata: Apply the same discount/interest rate to this partial amount
            const discountRate = fullCalculation.discountRate || 0;
            const interestRate = fullCalculation.interestRate || 0;

            let discountAmount = 0;
            let interestAmount = 0;
            let adjustedRepaymentAmount = repaymentAmount;

            if (discountRate > 0) {
                // Early payment: Apply discount
                discountAmount = (repaymentAmount * discountRate) / 100;
                adjustedRepaymentAmount = repaymentAmount - discountAmount;
            } else if (interestRate > 0) {
                // Late payment: Apply interest
                interestAmount = (repaymentAmount * interestRate) / 100;
                adjustedRepaymentAmount = repaymentAmount + interestAmount;
            }

            // Step 4: Create Repayment Record
            const repayment = await CreditRepayment.create({
                vendorId: vendor._id,
                purchaseOrderId: cycle._id,
                amount: repaymentAmount, // Principal being repaid
                totalAmount: adjustedRepaymentAmount, // What vendor actually pays (after discount/interest)
                purchaseDate: cycle.cycleStartDate,
                repaymentDate: repaymentDate,
                daysElapsed: daysElapsed,

                // Discount tracking
                discountApplied: discountRate > 0 ? {
                    tierName: fullCalculation.discountTier,
                    tierId: fullCalculation.tierId,
                    discountRate: discountRate,
                    discountAmount: discountAmount
                } : undefined,

                // Interest tracking
                interestApplied: interestRate > 0 ? {
                    tierName: fullCalculation.interestTier,
                    tierId: fullCalculation.tierId,
                    interestRate: interestRate,
                    interestAmount: interestAmount
                } : undefined,

                // Financial breakdown
                originalAmount: repaymentAmount,
                adjustedAmount: adjustedRepaymentAmount,
                financialBreakdown: {
                    baseAmount: repaymentAmount,
                    discountDeduction: discountAmount,
                    interestAddition: interestAmount,
                    finalPayable: adjustedRepaymentAmount,
                    savingsFromEarlyPayment: discountAmount,
                    penaltyFromLatePayment: interestAmount
                },

                // Credit tracking
                creditUsedBefore: vendor.creditUsed,
                creditUsedAfter: vendor.creditUsed - repaymentAmount, // Restore credit by principal amount

                // Payment details
                status: paymentDetails.status || 'completed',
                paymentMethod: paymentDetails.paymentMethod || 'razorpay',
                razorpayOrderId: paymentDetails.razorpayOrderId,
                razorpayPaymentId: paymentDetails.razorpayPaymentId,
                razorpaySignature: paymentDetails.razorpaySignature,

                calculationMethod: 'tiered_discount_interest',
                calculatedAt: new Date()
            });

            // Step 5: Update Credit Cycle
            cycle.outstandingAmount -= repaymentAmount; // Reduce by principal
            cycle.totalRepaid += repaymentAmount; // Increase by principal
            cycle.lastRepaymentDate = repaymentDate;
            cycle.repayments.push(repayment._id);

            // Track cumulative discount/interest for this cycle
            cycle.totalDiscountEarned += discountAmount;
            cycle.totalInterestPaid += interestAmount;

            // Auto-close cycle if fully repaid
            if (cycle.outstandingAmount === 0) {
                cycle.closeCycle();
            }

            await cycle.save();

            // Step 6: Update Vendor Credit
            // Restore credit by the PRINCIPAL amount re paid
            vendor.creditUsed -= repaymentAmount;

            // Update vendor credit history (existing logic)
            const historyUpdate = RepaymentCalculationService.updateVendorCreditHistory(vendor, {
                baseAmount: repaymentAmount,
                finalPayable: adjustedRepaymentAmount,
                savingsFromEarlyPayment: discountAmount,
                penaltyFromLatePayment: interestAmount,
                daysElapsed: daysElapsed,
                repaymentDate: repaymentDate
            });

            vendor.creditHistory = historyUpdate;
            await vendor.save();

            console.log(`[CreditCycleService] Partial repayment processed:
  Cycle: ${cycle.creditPurchaseId}
  Repayment Principal: ₹${repaymentAmount}
  Adjusted Amount Paid: ₹${adjustedRepaymentAmount}
  Discount: ₹${discountAmount} (${discountRate}%)
  Interest: ₹${interestAmount} (${interestRate}%)
  Outstanding Remaining: ₹${cycle.outstandingAmount}
  Vendor Credit Restored: ₹${repaymentAmount}
  Vendor Available Credit: ₹${vendor.creditLimit - vendor.creditUsed}`);

            return {
                success: true,
                repayment: {
                    id: repayment._id,
                    repaymentId: repayment.repaymentId,
                    principalRepaid: repaymentAmount,
                    actualAmountPaid: adjustedRepaymentAmount,
                    discountEarned: discountAmount,
                    discountRate: discountRate,
                    interestPaid: interestAmount,
                    interestRate: interestRate,
                    daysElapsed: daysElapsed
                },
                cycle: {
                    id: cycle._id,
                    creditPurchaseId: cycle.creditPurchaseId,
                    principalAmount: cycle.principalAmount,
                    outstandingAmount: cycle.outstandingAmount,
                    totalRepaid: cycle.totalRepaid,
                    cycleStatus: cycle.cycleStatus,
                    repaymentStatus: cycle.repaymentStatus,
                    isClosed: cycle.cycleStatus === 'closed'
                },
                vendor: {
                    creditLimit: vendor.creditLimit,
                    creditUsed: vendor.creditUsed,
                    availableCredit: vendor.creditLimit - vendor.creditUsed,
                    creditScore: vendor.creditHistory?.creditScore || 100
                }
            };

        } catch (error) {
            console.error('[CreditCycleService] Error processing partial repayment:', error);
            throw error;
        }
    }

    /**
     * Get All Active Cycles for a Vendor
     * 
     * @param {Object Id} vendorId
     * @returns {Array} - List of active/partially paid cycles
     */
    static async getActiveCyclesForVendor(vendorId) {
        try {
            const cycles = await CreditPurchase.find({
                vendorId: vendorId,
                cycleStatus: { $in: ['active', 'partially_paid'] },
                status: 'approved'
            }).sort({ cycleStartDate: 1 }); // Oldest first

            return cycles.map(cycle => ({
                id: cycle._id,
                creditPurchaseId: cycle.creditPurchaseId,
                principalAmount: cycle.principalAmount,
                outstandingAmount: cycle.outstandingAmount,
                totalRepaid: cycle.totalRepaid,
                cycleStartDate: cycle.cycleStartDate,
                daysElapsed: cycle.daysElapsed,
                cycleStatus: cycle.cycleStatus,
                repaymentStatus: cycle.repaymentStatus,
                totalDiscountEarned: cycle.totalDiscountEarned,
                totalInterestPaid: cycle.totalInterestPaid,
                items: cycle.items
            }));

        } catch (error) {
            console.error('[CreditCycleService] Error fetching active cycles:', error);
            throw error;
        }
    }

    /**
     * Get Cycle Details with Repayment History
     * 
     * @param {ObjectId} cycleId
     * @returns {Object} - Full cycle details
     */
    static async getCycleDetails(cycleId) {
        try {
            const cycle = await CreditPurchase.findById(cycleId)
                .populate('vendorId', 'vendorId name phone creditLimit creditUsed')
                .populate('repayments');

            if (!cycle) {
                throw new Error('Cycle not found');
            }

            return {
                id: cycle._id,
                creditPurchaseId: cycle.creditPurchaseId,
                vendor: cycle.vendorId,
                principalAmount: cycle.principalAmount,
                outstandingAmount: cycle.outstandingAmount,
                totalRepaid: cycle.totalRepaid,
                cycleStartDate: cycle.cycleStartDate,
                daysElapsed: cycle.daysElapsed,
                cycleStatus: cycle.cycleStatus,
                repaymentStatus: cycle.repaymentStatus,
                totalDiscountEarned: cycle.totalDiscountEarned,
                totalInterestPaid: cycle.totalInterestPaid,
                cycleClosedDate: cycle.cycleClosedDate,
                items: cycle.items,
                repayments: cycle.repayments || []
            };

        } catch (error) {
            console.error('[CreditCycleService] Error fetching cycle details:', error);
            throw error;
        }
    }

    /**
     * Validate if vendor can make a new credit purchase
     * 
     * @param {ObjectId} vendorId
     * @param {Number} purchaseAmount
     * @returns {Object} - Validation result
     */
    static async validateNewPurchase(vendorId, purchaseAmount) {
        try {
            const vendor = await Vendor.findById(vendorId);

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            const availableCredit = vendor.creditLimit - vendor.creditUsed;

            if (purchaseAmount > availableCredit) {
                return {
                    allowed: false,
                    reason: 'Insufficient credit',
                    details: {
                        creditLimit: vendor.creditLimit,
                        creditUsed: vendor.creditUsed,
                        availableCredit: availableCredit,
                        requestedAmount: purchaseAmount,
                        shortfall: purchaseAmount - availableCredit
                    }
                };
            }

            return {
                allowed: true,
                details: {
                    creditLimit: vendor.creditLimit,
                    creditUsed: vendor.creditUsed,
                    availableCredit: availableCredit,
                    requestedAmount: purchaseAmount,
                    remainingAfterPurchase: availableCredit - purchaseAmount
                }
            };

        } catch (error) {
            console.error('[CreditCycleService] Error validating new purchase:', error);
            throw error;
        }
    }

    /**
     * Get vendor's credit dashboard summary
     * 
     * @param {ObjectId} vendorId
     * @returns {Object} - Summary with all cycles
     */
    static async getVendorCreditSummary(vendorId) {
        try {
            const vendor = await Vendor.findById(vendorId);
            const activeCycles = await this.getActiveCyclesForVendor(vendorId);
            const closedCycles = await CreditPurchase.find({
                vendorId: vendorId,
                cycleStatus: 'closed'
            }).countDocuments();

            const totalOutstanding = activeCycles.reduce((sum, cycle) => sum + cycle.outstandingAmount, 0);

            return {
                vendor: {
                    id: vendor._id,
                    vendorId: vendor.vendorId,
                    name: vendor.name,
                    creditLimit: vendor.creditLimit,
                    creditUsed: vendor.creditUsed,
                    availableCredit: vendor.creditLimit - vendor.creditUsed,
                    creditScore: vendor.creditHistory?.creditScore || 100,
                    performanceTier: vendor.performanceTier || 'not_rated'
                },
                cycles: {
                    active: activeCycles,
                    activeCount: activeCycles.length,
                    closedCount: closedCycles,
                    totalOutstanding: totalOutstanding
                },
                creditHistory: vendor.creditHistory || {}
            };

        } catch (error) {
            console.error('[CreditCycleService] Error fetching vendor credit summary:', error);
            throw error;
        }
    }
}

module.exports = CreditCycleService;
