/**
 * Admin Credit Management Controller
 * 
 * Admin-only endpoints for managing vendor credit limits and performance
 */

const Vendor = require('../models/Vendor');
const CreditNotificationService = require('../services/creditNotificationService');

/**
 * Adjust vendor credit limit
 * Admin can reward good performers with increased credit
 */
exports.adjustCreditLimit = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { newLimit, reason } = req.body;

        // Validation
        if (!newLimit || newLimit < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid new credit limit is required'
            });
        }

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Reason for adjustment is required (minimum 10 characters)'
            });
        }

        // Find vendor
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const oldLimit = vendor.creditLimit;
        const adjustment = newLimit - oldLimit;

        // Update credit limit
        vendor.creditLimit = newLimit;
        await vendor.save();

        // Send notification to vendor if it's an increase
        if (adjustment > 0) {
            await CreditNotificationService.notifyCreditLimitIncrease(
                vendor._id,
                oldLimit,
                newLimit,
                reason
            );
        }

        // Log the adjustment
        console.log(`[AdminCreditController] Credit limit adjusted for vendor ${vendor.vendorId}: ₹${oldLimit} → ₹${newLimit} (${adjustment >= 0 ? '+' : ''}₹${adjustment})`);

        res.status(200).json({
            success: true,
            message: `Credit limit ${adjustment >= 0 ? 'increased' : 'decreased'} successfully`,
            data: {
                vendor: {
                    id: vendor._id,
                    vendorId: vendor.vendorId,
                    name: vendor.name
                },
                oldLimit,
                newLimit,
                adjustment,
                reason,
                availableCredit: newLimit - vendor.creditUsed
            }
        });

    } catch (error) {
        console.error('[AdminCreditController] Error adjusting credit limit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to adjust credit limit',
            error: error.message
        });
    }
};

/**
 * Get vendor performance analysis
 * Analyzes vendor's credit history and provides recommendations
 */
exports.getVendorPerformanceAnalysis = async (req, res) => {
    try {
        const { vendorId } = req.params;

        const analysis = await CreditNotificationService.analyzeVendorPerformance(vendorId);

        res.status(200).json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('[AdminCreditController] Error analyzing vendor performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze vendor performance',
            error: error.message
        });
    }
};

/**
 * Get all vendors with performance metrics
 * Returns list of vendors sorted by credit score
 */
exports.getVendorsWithPerformanceMetrics = async (req, res) => {
    try {
        const { sortBy = 'creditScore', order = 'desc', tier, minScore, maxScore } = req.query;

        const query = {
            isActive: true,
            status: 'approved'
        };

        // Filter by performance tier
        if (tier && tier !== 'all') {
            query.performanceTier = tier;
        }

        // Filter by credit score range
        if (minScore) {
            query['creditHistory.creditScore'] = { $gte: parseInt(minScore) };
        }
        if (maxScore) {
            query['creditHistory.creditScore'] = {
                ...query['creditHistory.creditScore'],
                $lte: parseInt(maxScore)
            };
        }

        const vendors = await Vendor.find(query)
            .select('vendorId name phone creditLimit creditUsed creditHistory performanceTier');

        // Transform data
        const vendorsWithMetrics = vendors.map(v => ({
            id: v._id,
            vendorId: v.vendorId,
            name: v.name,
            phone: v.phone,
            creditLimit: v.creditLimit,
            creditUsed: v.creditUsed,
            availableCredit: v.creditLimit - v.creditUsed,
            utilizationRate: ((v.creditUsed / v.creditLimit) * 100).toFixed(2),
            creditScore: v.creditHistory?.creditScore || 100,
            performanceTier: v.performanceTier || 'not_rated',
            totalRepayments: v.creditHistory?.totalRepaymentCount || 0,
            avgRepaymentDays: v.creditHistory?.avgRepaymentDays || 0,
            onTimeRate: v.creditHistory?.totalRepaymentCount > 0
                ? ((v.creditHistory.onTimeRepaymentCount / v.creditHistory.totalRepaymentCount) * 100).toFixed(1)
                : 'N/A',
            totalDiscountsEarned: v.creditHistory?.totalDiscountsEarned || 0,
            totalInterestPaid: v.creditHistory?.totalInterestPaid || 0,
            lastRepaymentDate: v.creditHistory?.lastRepaymentDate || null
        }));

        // Sort
        vendorsWithMetrics.sort((a, b) => {
            const multiplier = order === 'desc' ? -1 : 1;

            if (sortBy === 'creditScore') {
                return (a.creditScore - b.creditScore) * multiplier;
            } else if (sortBy === 'utilizationRate') {
                return (parseFloat(a.utilizationRate) - parseFloat(b.utilizationRate)) * multiplier;
            } else if (sortBy === 'totalRepayments') {
                return (a.totalRepayments - b.totalRepayments) * multiplier;
            } else if (sortBy === 'avgRepaymentDays') {
                return (a.avgRepaymentDays - b.avgRepaymentDays) * multiplier;
            }
            return 0;
        });

        res.status(200).json({
            success: true,
            count: vendorsWithMetrics.length,
            data: vendorsWithMetrics
        });

    } catch (error) {
        console.error('[AdminCreditController] Error fetching vendors with metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor metrics',
            error: error.message
        });
    }
};

/**
 * Bulk analyze all vendors
 * Generate performance recommendations for all active vendors
 */
exports.bulkAnalyzeVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({
            isActive: true,
            status: 'approved',
            'creditHistory.totalRepaymentCount': { $gte: 3 } // At least 3 repayments
        });

        const analyses = [];

        for (const vendor of vendors) {
            try {
                const analysis = await CreditNotificationService.analyzeVendorPerformance(vendor._id);
                analyses.push(analysis);
            } catch (error) {
                console.error(`Error analyzing vendor ${vendor.vendorId}:`, error);
            }
        }

        // Categorize recommendations
        const recommendations = {
            increase: analyses.filter(a => a.recommendation === 'increase'),
            maintain: analyses.filter(a => a.recommendation === 'maintain'),
            decrease: analyses.filter(a => a.recommendation === 'decrease')
        };

        res.status(200).json({
            success: true,
            summary: {
                totalAnalyzed: analyses.length,
                recommendIncrease: recommendations.increase.length,
                recommendMaintain: recommendations.maintain.length,
                recommendDecrease: recommendations.decrease.length
            },
            data: {
                increase: recommendations.increase,
                maintain: recommendations.maintain,
                decrease: recommendations.decrease
            }
        });

    } catch (error) {
        console.error('[AdminCreditController] Error in bulk analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform bulk analysis',
            error: error.message
        });
    }
};

/**
 * Update vendor performance tier
 * Admin can manually override the performance tier
 */
exports.updatePerformanceTier = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { tier, reason } = req.body;

        const validTiers = ['bronze', 'silver', 'gold', 'platinum', 'not_rated'];
        if (!validTiers.includes(tier)) {
            return res.status(400).json({
                success: false,
                message: `Invalid tier. Must be one of: ${validTiers.join(', ')}`
            });
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const oldTier = vendor.performanceTier;
        vendor.performanceTier = tier;
        await vendor.save();

        console.log(`[AdminCreditController] Performance tier updated for vendor ${vendor.vendorId}: ${oldTier} → ${tier}`);

        res.status(200).json({
            success: true,
            message: 'Performance tier updated successfully',
            data: {
                vendorId: vendor.vendorId,
                name: vendor.name,
                oldTier,
                newTier: tier,
                reason
            }
        });

    } catch (error) {
        console.error('[AdminCreditController] Error updating performance tier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update performance tier',
            error: error.message
        });
    }
};
