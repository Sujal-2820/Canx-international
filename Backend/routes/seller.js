const express = require('express');
const router = express.Router();

// Import controllers and middleware
const sellerController = require('../controllers/sellerController');
const { authorizeSeller } = require('../middleware/auth');

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * @route   POST /api/sellers/auth/register
 * @desc    Seller (IRA Partner) registration
 * @access  Public
 */
router.post('/auth/register', sellerController.register);

/**
 * @route   POST /api/sellers/auth/request-otp
 * @desc    Request OTP for seller login/registration
 * @access  Public
 */
router.post('/auth/request-otp', sellerController.requestOTP);

/**
 * @route   POST /api/sellers/auth/verify-otp
 * @desc    Verify OTP and complete login/registration
 * @access  Public
 */
router.post('/auth/verify-otp', sellerController.verifyOTP);

/**
 * @route   POST /api/sellers/auth/logout
 * @desc    Seller logout
 * @access  Private (Seller)
 */
router.post('/auth/logout', authorizeSeller, sellerController.logout);

/**
 * @route   GET /api/sellers/auth/profile
 * @desc    Get seller profile
 * @access  Private (Seller)
 */
router.get('/auth/profile', authorizeSeller, sellerController.getProfile);

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

/**
 * @route   GET /api/sellers/dashboard
 * @desc    Get dashboard overview data
 * @access  Private (Seller)
 */
router.get('/dashboard', authorizeSeller, sellerController.getDashboard);

/**
 * @route   GET /api/sellers/dashboard/overview
 * @desc    Get overview data (referrals, sales, target progress)
 * @access  Private (Seller)
 */
router.get('/dashboard/overview', authorizeSeller, sellerController.getOverview);

/**
 * @route   GET /api/sellers/dashboard/wallet
 * @desc    Get wallet data (balance, transactions)
 * @access  Private (Seller)
 */
router.get('/dashboard/wallet', authorizeSeller, sellerController.getWallet);

/**
 * @route   GET /api/sellers/dashboard/referrals
 * @desc    Get referrals data (users, purchases, commissions) - Dashboard version
 * @access  Private (Seller)
 */
router.get('/dashboard/referrals', authorizeSeller, sellerController.getReferrals);

/**
 * @route   GET /api/sellers/dashboard/performance
 * @desc    Get performance data (target progress, analytics)
 * @access  Private (Seller)
 */
router.get('/dashboard/performance', authorizeSeller, sellerController.getPerformance);

// ============================================================================
// WALLET & COMMISSION ROUTES
// ============================================================================

/**
 * @route   GET /api/sellers/wallet
 * @desc    Get wallet balance and transaction history
 * @access  Private (Seller)
 */
router.get('/wallet', authorizeSeller, sellerController.getWalletDetails);

/**
 * @route   GET /api/sellers/wallet/transactions
 * @desc    Get wallet transactions
 * @access  Private (Seller)
 */
router.get('/wallet/transactions', authorizeSeller, sellerController.getWalletTransactions);

/**
 * @route   POST /api/sellers/wallet/withdraw
 * @desc    Request wallet withdrawal
 * @access  Private (Seller)
 */
router.post('/wallet/withdraw', authorizeSeller, sellerController.requestWithdrawal);

/**
 * @route   GET /api/sellers/wallet/withdrawals
 * @desc    Get withdrawal requests
 * @access  Private (Seller)
 */
router.get('/wallet/withdrawals', authorizeSeller, sellerController.getWithdrawals);

// ============================================================================
// REFERRALS & COMMISSIONS ROUTES
// ============================================================================

/**
 * IMPORTANT: Specific routes with sub-paths must come BEFORE generic :referralId routes
 */

/**
 * @route   GET /api/sellers/referrals/stats
 * @desc    Get referral statistics
 * @access  Private (Seller)
 */
router.get('/referrals/stats', authorizeSeller, sellerController.getReferralStats);

/**
 * @route   GET /api/sellers/referrals
 * @desc    Get all referrals (users linked to seller ID)
 * @access  Private (Seller)
 */
router.get('/referrals', authorizeSeller, sellerController.getReferrals);

/**
 * @route   GET /api/sellers/referrals/:referralId
 * @desc    Get referral details (specific user)
 * @access  Private (Seller)
 */
router.get('/referrals/:referralId', authorizeSeller, sellerController.getReferralDetails);

// ============================================================================
// TARGET & PERFORMANCE ROUTES
// ============================================================================

/**
 * @route   GET /api/sellers/target
 * @desc    Get monthly target and progress
 * @access  Private (Seller)
 */
router.get('/target', authorizeSeller, sellerController.getTarget);

/**
 * @route   GET /api/sellers/performance
 * @desc    Get performance analytics
 * @access  Private (Seller)
 */
router.get('/performance', authorizeSeller, sellerController.getPerformanceAnalytics);

module.exports = router;

