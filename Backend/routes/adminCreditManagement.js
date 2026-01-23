/**
 * Admin Credit Management Routes
 * 
 * Routes for admin to manage vendor credit limits and performance
 */

const express = require('express');
const router = express.Router();
const adminCreditController = require('../controllers/adminCreditManagementController');
const { authorizeAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authorizeAdmin);

/**
 * @route   PUT /api/admin/credit/vendors/:vendorId/limit
 * @desc    Adjust vendor credit limit
 * @access  Admin only
 */
router.put('/vendors/:vendorId/limit', adminCreditController.adjustCreditLimit);

/**
 * @route   GET /api/admin/credit/vendors/:vendorId/analysis
 * @desc    Get vendor performance analysis and recommendations
 * @access  Admin only
 */
router.get('/vendors/:vendorId/analysis', adminCreditController.getVendorPerformanceAnalysis);

/**
 * @route   GET /api/admin/credit/vendors/performance
 * @desc    Get all vendors with performance metrics
 * @access  Admin only
 * @query   sortBy, order, tier, minScore, maxScore
 */
router.get('/vendors/performance', adminCreditController.getVendorsWithPerformanceMetrics);

/**
 * @route   POST /api/admin/credit/vendors/bulk-analyze
 * @desc    Bulk analyze all vendors and generate recommendations
 * @access  Admin only
 */
router.post('/vendors/bulk-analyze', adminCreditController.bulkAnalyzeVendors);

/**
 * @route   PUT /api/admin/credit/vendors/:vendorId/tier
 * @desc    Update vendor performance tier
 * @access  Admin only
 */
router.put('/vendors/:vendorId/tier', adminCreditController.updatePerformanceTier);

module.exports = router;
