/**
 * Credit Notification Scheduler
 * 
 * Scheduled jobs for automated credit repayment reminders
 * Uses node-cron for scheduling
 */

const cron = require('node-cron');
const CreditNotificationService = require('../services/creditNotificationService');

class CreditNotificationScheduler {
    /**
     * Initialize all scheduled jobs
     */
    static initializeScheduledJobs() {
        console.log('[CreditNotificationScheduler] Initializing credit notification jobs...');

        // Job 1: Send repayment reminders daily at 10:00 AM IST
        cron.schedule('0 10 * * *', async () => {
            console.log('[CRON] Running daily repayment reminder job...');
            try {
                const result = await CreditNotificationService.sendScheduledRepaymentReminders();
                console.log(`[CRON] Repayment reminders completed. Created: ${result.remindersCreated}`);
            } catch (error) {
                console.error('[CRON] Error in repayment reminder job:', error);
            }
        }, {
            timezone: 'Asia/Kolkata'
        });

        // Job 2: Check high utilization vendors daily at 6:00 PM IST
        cron.schedule('0 18 * * *', async () => {
            console.log('[CRON] Running high utilization check job...');
            try {
                const Vendor = require('../models/Vendor');
                const vendors = await Vendor.find({
                    isActive: true,
                    status: 'approved',
                    creditUsed: { $gt: 0 }
                });

                for (const vendor of vendors) {
                    const utilization = (vendor.creditUsed / vendor.creditLimit) * 100;
                    if (utilization >= 80) {
                        await CreditNotificationService.sendHighUtilizationWarning(vendor._id);
                    }
                }

                console.log('[CRON] High utilization check completed');
            } catch (error) {
                console.error('[CRON] Error in high utilization check:', error);
            }
        }, {
            timezone: 'Asia/Kolkata'
        });

        // Job 3: Clean up expired notifications daily at 2:00 AM IST
        cron.schedule('0 2 * * *', async () => {
            console.log('[CRON] Running notification cleanup job...');
            try {
                const VendorNotification = require('../models/VendorNotification');
                const result = await VendorNotification.cleanupExpired();
                console.log(`[CRON] Notification cleanup completed. Deleted: ${result.deletedCount}`);
            } catch (error) {
                console.error('[CRON] Error in notification cleanup:', error);
            }
        }, {
            timezone: 'Asia/Kolkata'
        });

        console.log('[CreditNotificationScheduler] All credit notification jobs initialized successfully');
        console.log('  - Repayment reminders: Daily at 10:00 AM IST');
        console.log('  - High utilization check: Daily at 6:00 PM IST');
        console.log('  - Notification cleanup: Daily at 2:00 AM IST');
    }

    /**
     * Stop all scheduled jobs (for graceful shutdown)
     */
    static stopAllJobs() {
        cron.getTasks().forEach(task => task.stop());
        console.log('[CreditNotificationScheduler] All scheduled jobs stopped');
    }
}

module.exports = CreditNotificationScheduler;
