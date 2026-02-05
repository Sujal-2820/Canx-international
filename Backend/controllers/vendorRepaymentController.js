/**
 * Vendor Repayment Controller
 * 
 * Handles vendor operations for credit repayments with new discount/interest system
 * This is a NEW controller for the vendor credit system rework
 * 
 * SAFETY: Does NOT modify existing vendor controller
 */

const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const CreditPurchase = require('../models/CreditPurchase');
const CreditRepayment = require('../models/CreditRepayment');
const RepaymentDiscount = require('../models/RepaymentDiscount');
const RepaymentInterest = require('../models/RepaymentInterest');
const RepaymentCalculationService = require('../services/repaymentCalculationService');
const { generateUniqueId } = require('../utils/generateUniqueId');

// ============================================================================
// REP AYMENT CALCULATION & PROJECTION
// ============================================================================

/**
 * @desc    Calculate repayment amount for a credit purchase
 * @route   POST /api/vendors/credit/repayment/calculate
 * @access  Private (Vendor)
 */
exports.calculateRepayment = async (req, res, next) => {
    try {
        const { purchaseId, repaymentDate } = req.body;

        if (!purchaseId) {
            return res.status(400).json({
                success: false,
                message: 'Purchase ID is required',
            });
        }

        // Find the credit purchase
        const purchase = await CreditPurchase.findById(purchaseId);

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Credit purchase not found',
            });
        }

        // Verify ownership
        if (purchase.vendorId.toString() !== req.vendor._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - not your purchase',
            });
        }

        // Check if already repaid
        if (purchase.status === 'repaid') {
            return res.status(400).json({
                success: false,
                message: 'This purchase has already been repaid',
            });
        }

        // SECURITY: Always use current server date, ignore client-provided date
        // This prevents vendors from manipulating the date to get better discounts
        const currentDate = new Date();
        const repaymentDateToUse = currentDate;

        // If a date was provided by client, validate it's today (with tolerance for timezone)
        if (repaymentDate) {
            const providedDate = new Date(repaymentDate);
            const daysDifference = Math.abs(
                (providedDate.setHours(0, 0, 0, 0) - currentDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
            );

            if (daysDifference > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Repayments can only be processed for the current date',
                    providedDate: providedDate.toISOString().split('T')[0],
                    serverDate: new Date().toISOString().split('T')[0]
                });
            }
        }

        // CRITICAL: Day 0 Restriction - Credit cycle starts from Day 1
        // Day 0 = Purchase date (order placement day)
        // Day 1 = Next day after purchase (credit cycle begins)
        // Vendors cannot repay on Day 0
        const purchaseDate = new Date(purchase.createdAt);
        const purchaseDateOnly = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        const daysSincePurchase = Math.floor((currentDateOnly - purchaseDateOnly) / (1000 * 60 * 60 * 24));

        if (daysSincePurchase === 0) {
            return res.status(400).json({
                success: false,
                message: 'Repayment cannot be processed on the same day as purchase (Day 0). Credit cycle starts from Day 1.',
                isDay0: true,
                purchaseDate: purchaseDate.toISOString(),
                earliestRepaymentDate: new Date(purchaseDateOnly.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                guidance: 'You can start repaying from tomorrow onwards. Your credit cycle begins the day after your purchase.'
            });
        }

        // Calculate repayment amount using current server date
        const calculation = await RepaymentCalculationService.calculateRepaymentAmount(
            purchase,
            repaymentDateToUse
        );

        res.status(200).json({
            success: true,
            data: calculation,
            purchase: {
                id: purchase._id,
                purchaseAmount: purchase.totalAmount,
                purchaseDate: purchase.createdAt,
                status: purchase.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get repayment projection schedule
 * @route   GET /api/vendors/credit/repayment/:purchaseId/projection
 * @access  Private (Vendor)
 */
exports.getRepaymentProjection = async (req, res, next) => {
    try {
        const { purchaseId } = req.params;

        // Find the credit purchase
        const purchase = await CreditPurchase.findById(purchaseId);

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Credit purchase not found',
            });
        }

        // Verify ownership
        if (purchase.vendorId.toString() !== req.vendor._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - not your purchase',
            });
        }

        // Check if already repaid
        if (purchase.status === 'repaid') {
            return res.status(400).json({
                success: false,
                message: 'This purchase has already been repaid',
                repaidAt: purchase.deliveredAt,
            });
        }

        // Get projection schedule
        const projection = await RepaymentCalculationService.projectRepaymentSchedule(purchase);

        res.status(200).json({
            success: true,
            data: projection,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// REPAYMENT SUBMISSION
// ============================================================================

/**
 * @desc    Submit credit repayment
 * @route   POST /api/vendors/credit/repayment/:purchaseId/submit
 * @access  Private (Vendor)
 */
exports.submitRepayment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { purchaseId } = req.params;
        const { repaymentAmount, paymentMode, transactionId, notes } = req.body;

        // Find the credit purchase
        const purchase = await CreditPurchase.findById(purchaseId).session(session);

        if (!purchase) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Credit purchase not found',
            });
        }

        // Verify ownership
        if (purchase.vendorId.toString() !== req.vendor._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - not your purchase',
            });
        }

        // Check if already repaid
        if (purchase.status === 'repaid') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'This purchase has already been repaid',
            });
        }

        // SECURITY: Always use current server date for repayment
        // This prevents vendors from manipulating the date via console/API tools
        const currentDate = new Date();

        // CRITICAL: Day 0 Restriction - Credit cycle starts from Day 1
        // Prevent repayment on the same day as purchase
        const purchaseDate = new Date(purchase.createdAt);
        const purchaseDateOnly = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        const daysSincePurchase = Math.floor((currentDateOnly - purchaseDateOnly) / (1000 * 60 * 60 * 24));

        if (daysSincePurchase === 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Repayment cannot be processed on Day 0 (purchase date). Please wait until tomorrow.',
                isDay0: true,
                purchaseDate: purchaseDate.toISOString(),
                earliestRepaymentDate: new Date(purchaseDateOnly.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                guidance: 'Your credit cycle starts from Day 1, which is tomorrow. You can repay starting from the next day after your purchase.'
            });
        }

        // Calculate expected repayment amount using current server date
        const calculation = await RepaymentCalculationService.calculateRepaymentAmount(
            purchase,
            currentDate
        );

        // Verify repayment amount matches calculation
        if (repaymentAmount && Math.abs(repaymentAmount - calculation.finalPayable) > 1) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Repayment amount does not match calculated amount',
                expected: calculation.finalPayable,
                provided: repaymentAmount,
                difference: Math.abs(repaymentAmount - calculation.finalPayable),
            });
        }

        // Get vendor
        const vendor = await Vendor.findById(req.vendor._id).session(session);

        if (!vendor) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Vendor not found',
            });
        }

        // Generate repayment ID
        const repaymentId = await generateUniqueId('REP');

        // Create repayment record
        const repayment = await CreditRepayment.create([{
            repaymentId,
            vendorId: vendor._id,
            purchaseOrderId: purchase._id,

            // Timeline - use current server date
            purchaseDate: purchase.createdAt,
            dueDate: new Date(purchase.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days from purchase
            repaymentDate: currentDate, // Use server date, not client-provided date
            daysElapsed: calculation.daysElapsed,

            // Amounts
            amount: calculation.baseAmount,
            originalAmount: calculation.baseAmount,
            adjustedAmount: calculation.finalPayable,
            totalAmount: calculation.finalPayable,

            // Discount/Interest applied
            discountApplied: calculation.tierType === 'discount' ? {
                tierName: calculation.tierApplied,
                tierId: calculation.tierId,
                discountRate: calculation.discountRate,
                discountAmount: calculation.discountAmount,
            } : undefined,

            interestApplied: calculation.tierType === 'interest' ? {
                tierName: calculation.tierApplied,
                tierId: calculation.tierId,
                interestRate: calculation.interestRate,
                interestAmount: calculation.interestAmount,
            } : undefined,

            // Financial breakdown
            financialBreakdown: calculation.financialBreakdown,

            // Metadata
            calculationMethod: 'tiered_discount_interest',
            calculatedAt: new Date(),
            calculationNotes: calculation.summary.message,

            // Deprecated field (for backward compatibility)
            penaltyAmount: calculation.penaltyFromLatePayment,

            // Credit tracking
            creditUsedBefore: vendor.creditUsed,
            creditUsedAfter: Math.max(0, vendor.creditUsed - calculation.baseAmount),

            // Payment details
            paymentMode: paymentMode || 'online',
            transactionId,
            notes,

            status: 'completed',
        }], { session });

        // Update vendor credit used
        vendor.creditUsed = Math.max(0, vendor.creditUsed - calculation.baseAmount);

        // Update vendor credit history
        const updatedHistory = RepaymentCalculationService.updateVendorCreditHistory(vendor, calculation);
        vendor.creditHistory = updatedHistory;

        await vendor.save({ session });

        // Update purchase status
        purchase.status = 'repaid';
        purchase.deliveredAt = new Date(); // Using deliveredAt to store repayment date
        await purchase.save({ session });

        // SEND VENDOR NOTIFICATION: Repayment Success
        try {
            const VendorNotification = require('../models/VendorNotification');
            await VendorNotification.createNotification({
                vendorId: vendor._id,
                type: 'repayment_success',
                title: 'Repayment Successful',
                message: `Your repayment of ₹${calculation.finalPayable} for purchase #${purchase.creditPurchaseId || purchase._id} was successful. Your credit limit has been restored.`,
                relatedEntityType: 'repayment',
                relatedEntityId: repayment[0]._id,
                priority: 'normal',
                metadata: { amount: calculation.finalPayable, purchaseId: purchase.creditPurchaseId }
            });
        } catch (notifError) {
            console.error('Failed to send repayment success notification:', notifError);
        }

        // Commit transaction
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Repayment submitted successfully',
            data: {
                repayment: repayment[0],
                calculation,
                vendor: {
                    creditLimit: vendor.creditLimit,
                    creditUsed: vendor.creditUsed,
                    creditAvailable: vendor.creditLimit - vendor.creditUsed,
                    creditScore: vendor.creditHistory.creditScore,
                    performanceTier: vendor.performanceTier,
                },
            },
        });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// ============================================================================
// REPAYMENT HISTORY
// ============================================================================

/**
 * @desc    Get vendor's repayment history
 * @route   GET /api/vendors/credit/repayments
 * @access  Private (Vendor)
 */
exports.getRepaymentHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { vendorId: req.vendor._id };

        if (status) {
            query.status = status;
        }

        const repayments = await CreditRepayment.find(query)
            .populate('purchaseOrderId', 'items totalAmount createdAt')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await CreditRepayment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                repayments,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: Number(limit),
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single repayment details
 * @route   GET /api/vendors/credit/repayments/:id
 * @access  Private (Vendor)
 */
exports.getRepaymentDetails = async (req, res, next) => {
    try {
        const repayment = await CreditRepayment.findById(req.params.id)
            .populate('purchaseOrderId', 'items totalAmount createdAt status')
            .populate('vendorId', 'shopName email phone');

        if (!repayment) {
            return res.status(404).json({
                success: false,
                message: 'Repayment not found',
            });
        }

        // Verify ownership
        if (repayment.vendorId._id.toString() !== req.vendor._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        res.status(200).json({
            success: true,
            data: repayment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get vendor credit summary
 * @route   GET /api/vendors/credit/summary
 * @access  Private (Vendor)
 */
exports.getCreditSummary = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.vendor._id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found',
            });
        }

        // Get outstanding purchases
        const outstandingPurchases = await CreditPurchase.find({
            vendorId: vendor._id,
            status: { $in: ['approved', 'sent'] },
        });

        // Get repayment count
        const repaymentCount = await CreditRepayment.countDocuments({
            vendorId: vendor._id,
            status: 'completed',
        });

        res.status(200).json({
            success: true,
            data: {
                creditLimit: vendor.creditLimit || 100000,
                creditUsed: vendor.creditUsed || 0,
                creditAvailable: (vendor.creditLimit || 100000) - (vendor.creditUsed || 0),
                creditScore: vendor.creditHistory?.creditScore || 100,
                // Map performance tier from lowercase to Title Case for frontend component mapping
                performanceTier: vendor.performanceTier ? (vendor.performanceTier.charAt(0).toUpperCase() + vendor.performanceTier.slice(1)) : 'Not Rated',
                stats: {
                    totalDiscountsEarned: vendor.creditHistory?.totalDiscountsEarned || 0,
                    totalInterestPaid: vendor.creditHistory?.totalInterestPaid || 0,
                    avgRepaymentDays: vendor.creditHistory?.avgRepaymentDays || 0,
                    onTimeRate: vendor.creditHistory?.totalRepaymentCount > 0
                        ? Math.round((vendor.creditHistory.onTimeRepaymentCount / vendor.creditHistory.totalRepaymentCount) * 100)
                        : 0
                },
                outstandingPurchases: outstandingPurchases.length,
                totalRepayments: repaymentCount,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current repayment rules (tiers)
 * @route   GET /api/vendors/credit/repayment/rules
 * @access  Private (Vendor)
 */
exports.getRepaymentRules = async (req, res, next) => {
    try {
        const discountTiers = await RepaymentDiscount.find({ isActive: true }).sort({ periodStart: 1 });
        const interestTiers = await RepaymentInterest.find({ isActive: true }).sort({ periodStart: 1 });

        res.status(200).json({
            success: true,
            data: {
                discountTiers: discountTiers.map(t => ({
                    id: t._id,
                    name: t.tierName,
                    start: t.periodStart,
                    end: t.periodEnd,
                    rate: t.discountRate,
                    description: t.description
                })),
                interestTiers: interestTiers.map(t => ({
                    id: t._id,
                    name: t.tierName,
                    start: t.periodStart,
                    end: t.isOpenEnded ? 365 : t.periodEnd, // Max range for slider
                    rate: t.interestRate,
                    description: t.description,
                    isOpenEnded: t.isOpenEnded
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
