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
const razorpayService = require('../services/razorpayService');
const VendorNotification = require('../models/VendorNotification');
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
// ONLINE REPAYMENT (RAZORPAY)
// ============================================================================

/**
 * @desc    Initiate online repayment (create Razorpay order)
 * @route   POST /api/vendors/credit/repayment/:purchaseId/initiate
 * @access  Private (Vendor)
 */
exports.initiateOnlineRepayment = async (req, res, next) => {
    try {
        const { purchaseId } = req.params;
        const amount = req.body.amount || req.query.amount; // Helper: Check body then query

        console.log(`[initiateOnlineRepayment] Request for Purchase ${purchaseId}`);
        console.log(`[initiateOnlineRepayment] Body:`, req.body);
        console.log(`[initiateOnlineRepayment] Query:`, req.query);
        console.log(`[initiateOnlineRepayment] Partial Amount Requested: ${amount}`);

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
        if (purchase.status === 'repaid' || (purchase.outstandingAmount <= 1 && purchase.status !== 'pending')) {
            return res.status(400).json({
                success: false,
                message: 'This purchase has already been fully repaid',
            });
        }

        // Check Day 0 Restriction
        const currentDate = new Date();
        const purchaseDate = new Date(purchase.createdAt);
        const purchaseDateOnly = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        const daysSincePurchase = Math.floor((currentDateOnly - purchaseDateOnly) / (1000 * 60 * 60 * 24));

        if (daysSincePurchase === 0) {
            return res.status(400).json({
                success: false,
                message: 'Repayment cannot be processed on Day 0.',
                isDay0: true,
                earliestRepaymentDate: new Date(purchaseDateOnly.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }

        // Fetch System Settings (Default 5%)
        const Settings = require('../models/Settings');
        const repaymentConfig = await Settings.getSetting('VENDOR_REPAYMENT_CONFIG', { minPartialPercentage: 5 });
        const minPercentage = repaymentConfig.minPartialPercentage || 5;

        // Calculate current full payable amount for reference
        const calculation = await RepaymentCalculationService.calculateRepaymentAmount(
            purchase,
            currentDate
        );

        let amountToPay = calculation.finalPayable;
        let isPartial = false;
        const minAllowedAmount = Math.ceil((calculation.finalPayable * minPercentage) / 100);

        console.log(`[initiateOnlineRepayment] Full Payable: ${amountToPay}`);

        // Custom Amount / Partial Payment Logic
        if (amount && Number(amount) > 0) {
            const requestedAmount = Number(amount);

            console.log(`[initiateOnlineRepayment] Processing Partial: Requested ${requestedAmount} vs Due ${amountToPay}`);

            // 1. Check Minimum Constraint (5%)
            if (requestedAmount < minAllowedAmount) {
                // REJECT if less than 5% (unless paying off small remaining balance completely)
                if (requestedAmount < amountToPay - 1) {
                    return res.status(400).json({
                        success: false,
                        message: `Partial payment must be at least ${minPercentage}% of the total payable amount (Minimum ₹${minAllowedAmount})`
                    });
                }
            }

            if (requestedAmount >= amountToPay - 1) {
                // Full Payment Snap
                console.log(`[initiateOnlineRepayment] Snap to Full.`);
                amountToPay = calculation.finalPayable;
                isPartial = false;
            } else {
                // Genuine Partial
                amountToPay = requestedAmount;
                isPartial = true;
                console.log(`[initiateOnlineRepayment] Partial Accepted. New Payable: ${amountToPay}`);
            }
        } else {
            console.log(`[initiateOnlineRepayment] No valid partial amount in request. Defaulting to Full.`);
        }

        // Generate a temporary repayment ID for tracking
        const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
        const tempId = `TEMP-REP-${dateStr}-${Date.now().toString().slice(-6)}`;

        // ========================================================================
        // CRITICAL LOGGING: Track exact amount being sent to Razorpay
        // ========================================================================
        console.log(`\n========== RAZORPAY ORDER CREATION ==========`);
        console.log(`[initiateOnlineRepayment] Purchase ID: ${purchase._id}`);
        console.log(`[initiateOnlineRepayment] Vendor ID: ${req.vendor._id}`);
        console.log(`[initiateOnlineRepayment] Full Due Amount: ₹${calculation.finalPayable}`);
        console.log(`[initiateOnlineRepayment] Amount to Send to Razorpay: ₹${amountToPay}`);
        console.log(`[initiateOnlineRepayment] Amount in Paise (Razorpay): ${Math.round(amountToPay * 100)}`);
        console.log(`[initiateOnlineRepayment] Is Partial Payment: ${isPartial}`);
        console.log(`[initiateOnlineRepayment] Receipt ID: ${tempId}`);
        console.log(`=============================================\n`);

        // Create Razorpay Order
        const razorpayOrder = await razorpayService.createOrder({
            amount: amountToPay,
            currency: 'INR',
            receipt: tempId,
            notes: {
                purchaseId: purchase._id.toString(),
                vendorId: req.vendor._id.toString(),
                type: 'credit_repayment_phase3',
                isPartial: isPartial ? 'true' : 'false',
                fullDueAtInitiation: calculation.finalPayable.toString()
            }
        });

        // Log what Razorpay actually returned
        console.log(`\n========== RAZORPAY ORDER CREATED ==========`);
        console.log(`[initiateOnlineRepayment] Razorpay Order ID: ${razorpayOrder.id}`);
        console.log(`[initiateOnlineRepayment] Razorpay Amount (paise): ${razorpayOrder.amount}`);
        console.log(`[initiateOnlineRepayment] Razorpay Amount (rupees): ₹${razorpayOrder.amount / 100}`);
        console.log(`[initiateOnlineRepayment] Expected Amount: ₹${amountToPay}`);
        console.log(`[initiateOnlineRepayment] Match: ${razorpayOrder.amount === Math.round(amountToPay * 100) ? '✓ YES' : '✗ NO - MISMATCH!'}`);
        console.log(`=============================================\n`);

        res.status(200).json({
            success: true,
            data: {
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount, // Amount in paise
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID
                },
                calculation: {
                    ...calculation,
                    finalPayable: amountToPay, // Override final info for frontend display
                    isPartial
                },
                tempId
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify online repayment and finalize
 * @route   POST /api/vendors/credit/repayment/:purchaseId/verify
 * @access  Private (Vendor)
 */
exports.verifyOnlineRepayment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { purchaseId } = req.params;
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Missing payment details' });
        }

        // Verify Signature
        const isValid = razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Find Purchase
        const purchase = await CreditPurchase.findById(purchaseId).session(session);
        if (!purchase) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Purchase not found' });
        }

        const currentDate = new Date();
        const calculation = await RepaymentCalculationService.calculateRepaymentAmount(purchase, currentDate);

        // Fetch payment details to confirm ACTUAL amount paid
        const paymentDetails = await razorpayService.fetchPayment(razorpayPaymentId);
        const amountPaid = paymentDetails.amount / 100; // Razorpay returns paise

        // Determine if Partial or Full
        // We use a small tolerance for float comparison
        const fullDueAmount = calculation.finalPayable;
        const isFullPayment = amountPaid >= (fullDueAmount - 1);

        // Update Vendor
        const vendor = await Vendor.findById(req.vendor._id).session(session);
        if (!vendor) throw new Error('Vendor not found');

        // Generate ID
        const repaymentId = await generateUniqueId(CreditRepayment, 'REP', 'repaymentId', 1001);

        // Calculate proportional impact
        // Ratio = Base Amount / Final Payable (e.g., 100/90 = 1.11 for a 10% discount)
        // This ensures that paying ₹X cash reduces the "Payable" by exactly ₹X.
        let settlementRatio = 1;
        if (calculation.finalPayable > 0) {
            settlementRatio = calculation.baseAmount / calculation.finalPayable;
        }

        // Calculate Principal Settled by this payment
        // (Cap at remaining outstanding)
        let principalSettled = amountPaid * settlementRatio;

        // Safety: don't settle more than outstanding
        if (principalSettled > purchase.outstandingAmount) {
            principalSettled = purchase.outstandingAmount;
        }

        // Update Repayment Record
        const repayment = await CreditRepayment.create([{
            repaymentId,
            vendorId: vendor._id,
            purchaseOrderId: purchase._id,
            purchaseDate: purchase.createdAt,
            dueDate: new Date(purchase.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)),
            repaymentDate: currentDate,
            daysElapsed: calculation.daysElapsed,

            amount: principalSettled, // Principal component settled
            originalAmount: calculation.baseAmount, // Snapshot of full base
            adjustedAmount: amountPaid, // Actual cash paid
            totalAmount: amountPaid,

            // Scale logs for partial
            financialBreakdown: {
                baseAmount: calculation.baseAmount,
                discountDeduction: calculation.discountAmount,
                interestAddition: calculation.interestAmount,
                finalPayable: amountPaid, // What they paid now
            },

            discountApplied: calculation.tierType === 'discount' ? {
                tierName: calculation.tierApplied,
                tierId: calculation.tierId,
                discountRate: calculation.discountRate,
                discountAmount: calculation.discountAmount * (amountPaid / fullDueAmount)
            } : undefined,
            interestApplied: calculation.tierType === 'interest' ? {
                tierName: calculation.tierApplied,
                tierId: calculation.tierId,
                interestRate: calculation.interestRate,
                interestAmount: calculation.interestAmount * (amountPaid / fullDueAmount)
            } : undefined,

            calculationMethod: 'tiered_discount_interest',
            calculatedAt: currentDate,

            creditUsedBefore: vendor.creditUsed,
            creditUsedAfter: Math.max(0, vendor.creditUsed - principalSettled),

            paymentMode: 'online',
            transactionId: razorpayPaymentId,
            gatewayResponse: paymentDetails,

            status: 'completed',
            paidAt: currentDate,
            notes: isFullPayment ? 'Full Repayment' : `Partial Repayment (Settled approx. ₹${Math.round(principalSettled)})`
        }], { session });

        // Update Vendor Credit
        vendor.creditUsed = Math.max(0, vendor.creditUsed - principalSettled);

        // Scale calculation for credit history to reflect actual partial payment
        // totalRepaid should receive 'amountPaid', totalCreditTaken should receive 'principalSettled'
        const scaledCalculationForHistory = {
            ...calculation,
            baseAmount: principalSettled,
            finalPayable: amountPaid,
            savingsFromEarlyPayment: (calculation.tierType === 'discount') ? (principalSettled - amountPaid) : 0,
            penaltyFromLatePayment: (calculation.tierType === 'interest') ? (amountPaid - principalSettled) : 0,
            repaymentDate: currentDate
        };

        vendor.creditHistory = RepaymentCalculationService.updateVendorCreditHistory(vendor, scaledCalculationForHistory);
        await vendor.save({ session });

        // Update Purchase
        purchase.totalRepaid = (purchase.totalRepaid || 0) + amountPaid;
        purchase.outstandingAmount = Math.max(0, purchase.outstandingAmount - principalSettled);

        if (purchase.outstandingAmount < 1) { // Tolerance for rounding
            purchase.status = 'repaid';
            purchase.deliveredAt = currentDate; // Set delivered/completed date
            purchase.outstandingAmount = 0;
            purchase.cycleStatus = 'fully_paid';
        } else {
            // For partial payments, keep status as 'approved'
            // The pre-save hook in CreditPurchase.js will automatically update cycleStatus to 'partially_paid'
            purchase.cycleStatus = 'partially_paid';
            purchase.repaymentStatus = 'in_progress';
        }

        await purchase.save({ session });

        // Send Notification
        await VendorNotification.createNotification({
            vendorId: vendor._id,
            type: isFullPayment ? 'repayment_success' : 'repayment_partial',
            title: isFullPayment ? 'Repayment Successful' : 'Partial Repayment Received',
            message: isFullPayment
                ? `Repayment of ₹${amountPaid.toLocaleString()} for Purchase #${purchase.creditPurchaseId || purchase._id} was successful.`
                : `Partial repayment of ₹${amountPaid.toLocaleString()} received for Purchase #${purchase.creditPurchaseId || purchase._id}.`,
            metadata: {
                repaymentId: repaymentId,
                purchaseId: purchase._id,
                amount: amountPaid
            }
        });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: {
                repayment: repayment[0],
                vendor: { creditUsed: vendor.creditUsed },
                purchaseStatus: purchase.status
            }
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
