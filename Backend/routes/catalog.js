const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

/**
 * Public Catalog Routes
 * 
 * These routes provide public access to product catalog data.
 * Created after User module removal to support Vendor module catalog access.
 * 
 * These routes reuse the admin controller functions but don't require authentication.
 */

/**
 * @route   GET /api/catalog/products
 * @desc    Get all active products (public)
 * @access  Public
 */
router.get('/products', async (req, res, next) => {
    try {
        // Temporarily attach a mock admin context for the controller
        // The controller will fetch products available to public
        req.admin = { role: 'public' };

        // Forward to admin controller but filter for active products only
        const Product = require('../models/Product');
        const { limit = 50, offset = 0, category, search, sort = 'createdAt' } = req.query;

        // Build query
        const query = { isActive: true };
        if (category && category !== 'all') {
            query.category = category;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort
        let sortObj = {};
        if (sort === 'popular') {
            sortObj = { salesCount: -1 };
        } else if (sort === 'priceAsc') {
            sortObj = { price: 1 };
        } else if (sort === 'priceDesc') {
            sortObj = { price: -1 };
        } else {
            sortObj = { createdAt: -1 };
        }

        const products = await Product.find(query)
            .sort(sortObj)
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                products,
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/catalog/products/:productId
 * @desc    Get product details (public)
 * @access  Public
 */
router.get('/products/:productId', async (req, res, next) => {
    try {
        const Product = require('../models/Product');
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { product }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/catalog/offers
 * @desc    Get active offers/banners (public)
 * @access  Public
 */
router.get('/offers', async (req, res, next) => {
    try {
        const Offer = require('../models/Offer');

        const offers = await Offer.find({ isActive: true }).sort({ order: 1 });

        // Group by type
        const carousels = offers.filter(o => o.type === 'carousel' || o.type === 'banner');
        const specialOffers = offers.filter(o => o.type === 'special');

        res.status(200).json({
            success: true,
            data: {
                carousels,
                specialOffers,
                offers
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
