/**
 * Credit Notification Service
 * 
 * Handles automated notifications for:
 * - Credit repayment reminders
 * - Overdue alerts
 * - Credit limit rewards
 * - Performance-based notifications
 */

const VendorNotification = require('../models/VendorNotification');
const Vendor = require('../models/Vendor');
const CreditPurchase = require('../models/CreditPurchase');
const RepaymentCalculationService = require('./repaymentCalculationService');

class CreditNotificationService {
    /**
     * Send repayment reminder notifications to vendors
     * Called by a scheduled job (cron)
     * 
     * Reminder Strategy:
     * - Day 60: First gentle reminder (still in discount zone)
     * - Day 85: Second reminder (approaching neutral zone)
     * - Day 100: Third reminder (about to enter interest zone)
     * - Day 104: Urgent reminder (last day before interest)
     * - Day 105+: Overdue alert (interest has started)
     */
    static async sendScheduledRepaymentReminders() {
        try {
            console.log('[CreditNotificationService] Starting scheduled repayment reminder check...');

            // Find all active credit cycles (not closed)
            const activeCycles = await CreditPurchase.find({
                status: 'approved',
                cycleStatus: { $in: ['active', 'partially_paid'] }, // Only active cycles
                outstandingAmount: { $gt: 0 } // Must have outstanding balance
            }).populate('vendorId');

            if (!activeCycles || activeCycles.length === 0) {
                console.log('[CreditNotificationService] No active cycles found');
                return { success: true, remindersCreated: 0 };
            }

            let remindersCreated = 0;
            const today = new Date();

            for (const cycle of activeCycles) {
                if (!cycle.vendorId) continue;

                const vendor = cycle.vendorId;
                const cycleStartDate = new Date(cycle.cycleStartDate);
                const daysElapsed = Math.floor((today - cycleStartDate) / (1000 * 60 * 60 * 24));

                // Calculate current repayment details for THIS cycle
                const calculation = await RepaymentCalculationService.calculateRepaymentAmount(cycle, today);

                // Determine if reminder should be sent based on days elapsed
                const reminderConfig = this._getReminderConfig(daysElapsed, calculation);

                if (!reminderConfig) continue; // No reminder needed yet

                // Check if we already sent this type of reminder today
                const existingReminder = await VendorNotification.findOne({
                    vendorId: vendor._id,
                    type: reminderConfig.type,
                    relatedEntityId: cycle._id,
                    createdAt: {
                        $gte: new Date(today.setHours(0, 0, 0, 0))
                    }
                });

                if (existingReminder) {
                    console.log(`[CreditNotificationService] Reminder already sent today for vendor ${vendor.vendorId}`);
                    continue; // Already sent today
                }

                // Create notification
                await VendorNotification.createNotification({
                    vendorId: vendor._id,
                    type: reminderConfig.type,
                    title: reminderConfig.title,
                    message: reminderConfig.getMessage(calculation, cycle),
                    relatedEntityType: 'credit_purchase',
                    relatedEntityId: cycle._id,
                    priority: reminderConfig.priority,
                    metadata: {
                        cycleId: cycle.creditPurchaseId,
                        daysElapsed,
                        principalAmount: cycle.principalAmount,
                        outstandingAmount: cycle.outstandingAmount,
                        totalRepaid: cycle.totalRepaid,
                        currentPayable: calculation.finalPayable,
                        savings: calculation.savingsFromEarlyPayment,
                        penalty: calculation.penaltyFromLatePayment,
                        tierApplied: calculation.tierApplied,
                        discountRate: calculation.discountRate,
                        interestRate: calculation.interestRate,
                    }
                });

                remindersCreated++;
                console.log(`[CreditNotificationService] Created ${reminderConfig.type} for vendor ${vendor.vendorId}, days elapsed: ${daysElapsed}`);
            }

            console.log(`[CreditNotificationService] Completed. Created ${remindersCreated} reminders`);
            return { success: true, remindersCreated };

        } catch (error) {
            console.error('[CreditNotificationService] Error sending reminders:', error);
            throw error;
        }
    }

    /**
     * Get reminder configuration based on days elapsed
     * @private
     */
    static _getReminderConfig(daysElapsed, calculation) {
        // Day 60: First gentle reminder (still in 3% discount zone)
        if (daysElapsed === 60) {
            return {
                type: 'repayment_due_reminder',
                title: 'Credit Repayment - Still Time to Save! 💰',
                priority: 'normal',
                getMessage: (calc, cycle) => {
                    return `You have a pending credit payment of ₹${cycle.outstandingAmount.toLocaleString('en-IN')} (Cycle: ${cycle.creditPurchaseId}). ` +
                        `Pay now and enjoy a ${calc.discountRate}% discount (₹${calc.savingsFromEarlyPayment.toLocaleString('en-IN')} potential savings). ` +
                        `You have ${104 - daysElapsed} days left before interest charges apply.`;
                }
            };
        }

        // Day 85: Second reminder (approaching neutral zone)
        if (daysElapsed === 85) {
            return {
                type: 'repayment_due_reminder',
                title: 'Credit Reminder - Discount Ending Soon ⏰',
                priority: 'high',
                getMessage: (calc, cycle) => {
                    return `Your credit payment of ₹${cycle.outstandingAmount.toLocaleString('en-IN')} (Cycle: ${cycle.creditPurchaseId}) is approaching the neutral zone. ` +
                        `Current discount: ${calc.discountRate}% (save ₹${calc.savingsFromEarlyPayment.toLocaleString('en-IN')}). ` +
                        `Pay within ${104 - daysElapsed} days to avoid interest charges.`;
                }
            };
        }

        // Day 100: Third reminder (about to enter interest zone)
        if (daysElapsed === 100) {
            return {
                type: 'repayment_due_reminder',
                title: 'Urgent: Credit Payment Deadline Approaching ⚠️',
                priority: 'urgent',
                getMessage: (calc, cycle) => {
                    return `IMPORTANT: Your credit payment of ₹${cycle.outstandingAmount.toLocaleString('en-IN')} (Cycle: ${cycle.creditPurchaseId}) is due in 4 days. ` +
                        `Pay before Day 104 to avoid interest charges. ` +
                        `Interest rate after Day 104: 5-10%. Act now to keep your credit interest-free!`;
                }
            };
        }

        // Day 104: Last day reminder
        if (daysElapsed === 104) {
            return {
                type: 'repayment_due_reminder',
                title: '🚨 LAST DAY - Interest Starts Tomorrow!',
                priority: 'urgent',
                getMessage: (calc, cycle) => {
                    return `FINAL REMINDER: This is the last day to repay ₹${cycle.outstandingAmount.toLocaleString('en-IN')} (Cycle: ${cycle.creditPurchaseId}) without interest charges. ` +
                        `Starting tomorrow (Day 105), a 5% interest will be applied. ` +
                        `Repay now to maintain your interest-free credit status!`;
                }
            };
        }

        // Day 105-120: Overdue alerts (5% interest zone)
        if (daysElapsed >= 105 && daysElapsed <= 120 && daysElapsed % 5 === 0) {
            return {
                type: 'repayment_overdue_alert',
                title: '⚠️ Overdue Payment - Interest Applied',
                priority: 'urgent',
                getMessage: (calc, cycle) => {
                    return `Your credit payment is now ${daysElapsed - 104} days overdue (Cycle: ${cycle.creditPurchaseId}). ` +
                        `Outstanding: ₹${cycle.outstandingAmount.toLocaleString('en-IN')}. ` +
                        `Amount payable: ₹${calc.finalPayable.toLocaleString('en-IN')} ` +
                        `(Base: ₹${cycle.outstandingAmount.toLocaleString('en-IN')} + Interest: ₹${calc.penaltyFromLatePayment.toLocaleString('en-IN')} at ${calc.interestRate}%). ` +
                        `Pay soon to prevent further interest accumulation.`;
                }
            };
        }

        // Day 121+: Severe overdue (10% interest zone)
        if (daysElapsed > 120 && daysElapsed % 10 === 0) {
            return {
                type: 'repayment_overdue_alert',
                title: '🚨 CRITICAL: Severe Payment Delay',
                priority: 'urgent',
                getMessage: (calc, cycle) => {
                    return `CRITICAL: Your credit payment is ${daysElapsed - 104} days overdue (Cycle: ${cycle.creditPurchaseId}). ` +
                        `Outstanding: ₹${cycle.outstandingAmount.toLocaleString('en-IN')}. ` +
                        `Total payable: ₹${calc.finalPayable.toLocaleString('en-IN')} ` +
                        `(Interest: ₹${calc.penaltyFromLatePayment.toLocaleString('en-IN')} at ${calc.interestRate}%). ` +
                        `Immediate payment required to avoid credit suspension. Contact admin if you need assistance.`;
                }
            };
        }

        return null; // No reminder needed
    }

    /**
     * Send credit limit increase notification to vendor
     * Called when admin rewards vendor with additional credit
     */
    static async notifyCreditLimitIncrease(vendorId, oldLimit, newLimit, reason) {
        try {
            const increase = newLimit - oldLimit;

            await VendorNotification.createNotification({
                vendorId,
                type: 'admin_announcement',
                title: '🎉 Credit Limit Increased!',
                message: `Congratulations! Your excellent payment performance has earned you a credit limit increase of ₹${increase.toLocaleString('en-IN')}. ` +
                    `Your new credit limit is ₹${newLimit.toLocaleString('en-IN')}. ` +
                    `Reason: ${reason}. Keep up the great work!`,
                priority: 'high',
                metadata: {
                    oldLimit,
                    newLimit,
                    increase,
                    reason,
                    rewardType: 'credit_limit_increase'
                }
            });

            console.log(`[CreditNotificationService] Credit limit increase notification sent to vendor ${vendorId}`);
            return { success: true };

        } catch (error) {
            console.error('[CreditNotificationService] Error sending credit limit notification:', error);
            throw error;
        }
    }

    /**
     * Send high utilization warning
     * Alert vendor when they've used >80% of credit limit
     */
    static async sendHighUtilizationWarning(vendorId) {
        try {
            const vendor = await Vendor.findById(vendorId);
            if (!vendor) return;

            const utilizationRate = (vendor.creditUsed / vendor.creditLimit) * 100;

            if (utilizationRate < 80) return; // No warning needed

            // Check if warning sent in last 7 days
            const recentWarning = await VendorNotification.findOne({
                vendorId,
                type: 'system_alert',
                'metadata.alertType': 'high_credit_utilization',
                createdAt: {
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            });

            if (recentWarning) return; // Already warned recently

            await VendorNotification.createNotification({
                vendorId,
                type: 'system_alert',
                title: '⚠️ Credit Limit Alert',
                message: `You've used ${utilizationRate.toFixed(1)}% of your credit limit. ` +
                    `Used: ₹${vendor.creditUsed.toLocaleString('en-IN')} / ` +
                    `Limit: ₹${vendor.creditLimit.toLocaleString('en-IN')}. ` +
                    `Consider making a repayment to free up credit for new purchases.`,
                priority: 'high',
                metadata: {
                    alertType: 'high_credit_utilization',
                    creditUsed: vendor.creditUsed,
                    creditLimit: vendor.creditLimit,
                    utilizationRate: utilizationRate
                }
            });

            console.log(`[CreditNotificationService] High utilization warning sent to vendor ${vendor.vendorId}`);

        } catch (error) {
            console.error('[CreditNotificationService] Error sending utilization warning:', error);
        }
    }

    /**
     * Analyze vendor performance and recommend credit limit adjustment
     * Returns recommendation for admin review
     */
    static async analyzeVendorPerformance(vendorId) {
        try {
            const vendor = await Vendor.findById(vendorId);
            if (!vendor) throw new Error('Vendor not found');

            const { creditHistory, creditLimit, creditUsed, performanceTier } = vendor;

            // Initialize analysis results
            const analysis = {
                vendorId: vendor._id,
                vendorName: vendor.name,
                currentLimit: creditLimit,
                currentUsed: creditUsed,
                availableCredit: creditLimit - creditUsed,
                creditScore: creditHistory?.creditScore || 100,
                performanceTier,
                recommendation: 'maintain', // 'increase', 'maintain', 'decrease'
                suggestedNewLimit: creditLimit,
                reasoning: [],
                riskLevel: 'low' // 'low', 'medium', 'high'
            };

            // Rule 1: Credit score-based evaluation
            if (creditHistory?.creditScore) {
                if (creditHistory.creditScore >= 90) {
                    analysis.recommendation = 'increase';
                    analysis.reasoning.push('Excellent credit score (90+)');
                } else if (creditHistory.creditScore < 60) {
                    analysis.recommendation = 'decrease';
                    analysis.reasoning.push('Poor credit score (\u003c60)');
                    analysis.riskLevel = 'high';
                }
            }

            // Rule 2: On-time repayment rate
            if (creditHistory?.totalRepaymentCount >= 5) {
                const onTimeRate = (creditHistory.onTimeRepaymentCount / creditHistory.totalRepaymentCount) * 100;

                if (onTimeRate >= 90) {
                    if (analysis.recommendation !== 'decrease') {
                        analysis.recommendation = 'increase';
                    }
                    analysis.reasoning.push(`Excellent on-time payment rate (${onTimeRate.toFixed(1)}%)`);
                } else if (onTimeRate < 60) {
                    analysis.recommendation = 'decrease';
                    analysis.reasoning.push(`Poor on-time payment rate (${onTimeRate.toFixed(1)}%)`);
                    analysis.riskLevel = 'high';
                }
            }

            // Rule 3: Average repayment days
            if (creditHistory?.avgRepaymentDays) {
                if (creditHistory.avgRepaymentDays <= 30) {
                    analysis.reasoning.push('Consistently pays within 30 days (high discount tier)');
                    if (analysis.recommendation !== 'decrease') {
                        analysis.recommendation = 'increase';
                    }
                } else if (creditHistory.avgRepaymentDays > 100) {
                    analysis.reasoning.push('Average repayment time \u003e100 days (frequently in interest zone)');
                    analysis.riskLevel = 'medium';
                }
            }

            // Rule 4: Discount vs Interest ratio
            if (creditHistory?.totalDiscountsEarned > creditHistory?.totalInterestPaid) {
                analysis.reasoning.push('Earns more discounts than pays interest (financially disciplined)');
            } else if (creditHistory?.totalInterestPaid > creditHistory?.totalDiscountsEarned * 2) {
                analysis.reasoning.push('Pays significantly more interest than earns discounts');
                analysis.riskLevel = analysis.riskLevel === 'high' ? 'high' : 'medium';
            }

            // Rule 5: Purchase frequency (active vendor)
            if (creditHistory?.totalRepaymentCount >= 10) {
                analysis.reasoning.push(`Active vendor with ${creditHistory.totalRepaymentCount} completed repayments`);
                if (analysis.recommendation === 'increase') {
                    // Bonus: Very active + good performance = larger increase
                    analysis.suggestedNewLimit = creditLimit + 50000;
                }
            }

            // Calculate suggested limit adjustment
            if (analysis.recommendation === 'increase') {
                if (analysis.creditScore >= 95 && creditHistory?.totalRepaymentCount >= 10) {
                    // Top-tier: +₹50,000
                    analysis.suggestedNewLimit = creditLimit + 50000;
                    analysis.reasoning.push('Top-tier performance: +₹50,000 increase recommended');
                } else if (analysis.creditScore >= 85) {
                    // High performer: +₹25,000
                    analysis.suggestedNewLimit = creditLimit + 25000;
                    analysis.reasoning.push('High performer: +₹25,000 increase recommended');
                } else {
                    // Good performer: +₹10,000
                    analysis.suggestedNewLimit = creditLimit + 10000;
                    analysis.reasoning.push('Good performer: +₹10,000 increase recommended');
                }
            } else if (analysis.recommendation === 'decrease' && analysis.riskLevel === 'high') {
                // Risky vendor: reduce by 20%
                analysis.suggestedNewLimit = Math.max(50000, Math.floor(creditLimit * 0.8));
                analysis.reasoning.push(`High risk: 20% reduction to ₹${analysis.suggestedNewLimit.toLocaleString('en-IN')}`);
            }

            return analysis;

        } catch (error) {
            console.error('[CreditNotificationService] Error analyzing vendor performance:', error);
            throw error;
        }
    }
}

module.exports = CreditNotificationService;
