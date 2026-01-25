import { useRef, useState, useEffect } from 'react'
import { ProductCard } from '../../../../User/components/ProductCard'
import { CategoryCard } from '../../../../User/components/CategoryCard'
import { ChevronRightIcon, MapPinIcon, TruckIcon, SearchIcon, FilterIcon, CartIcon } from '../../../../User/components/icons'
import { cn } from '../../../../../lib/cn'
import { useVendorApi } from '../../../hooks/useVendorApi'
import * as userApi from '../../../../User/services/userApi'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'
import '../../../../User/home-redesign.css'

const formatCategoryName = (name) => {
    if (!name) return name
    const fertilizerMatch = name.match(/(\w+)(Fertilizer)/i)
    if (fertilizerMatch && fertilizerMatch[1] && fertilizerMatch[2]) {
        return `${fertilizerMatch[1]} ${fertilizerMatch[2]}`
    }
    return name
}

export function VendorHomeView({ onProductClick, onCategoryClick, onAddToCart, onSearchClick, onFilterClick, onToggleFavourite, favourites = [], onCartClick, cartCount = 0 }) {
    const categoriesRef = useRef(null)
    const [categories, setCategories] = useState([])
    const [products, setProducts] = useState([])
    const [popularProducts, setPopularProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const { getProducts } = useVendorApi()
    const [carousels, setCarousels] = useState([])
    const [recentlyViewed, setRecentlyViewed] = useState([])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                // Fetch products (admin catalog)
                const result = await getProducts({ limit: 20 })
                if (result.data?.products) {
                    const allProducts = result.data.products
                    setProducts(allProducts)
                    // Use variants or default vendor price for initial items
                    setPopularProducts(allProducts.slice(0, 4))
                }

                // Fetch real categories from API
                const categoriesResult = await userApi.getCategories()
                if (categoriesResult.success && categoriesResult.data?.categories) {
                    setCategories(categoriesResult.data.categories)
                } else {
                    // Fallback to extraction from products
                    const cats = Array.from(new Set(result.data?.products?.map(p => p.category) || []))
                    setCategories(cats.map(c => ({ id: c, name: c.charAt(0).toUpperCase() + c.slice(1) })))
                }

                // Fetch offers (carousels)
                const offersResult = await userApi.getOffers()
                if (offersResult.success && offersResult.data) {
                    const activeCarousels = (offersResult.data.carousels || [])
                        .filter(c => c.isActive !== false)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                    setCarousels(activeCarousels)
                }

                // Fetch Recently Viewed products from localStorage
                try {
                    const viewedIds = JSON.parse(localStorage.getItem('vendor_recently_viewed') || '[]')
                    if (viewedIds.length > 0) {
                        const viewedResult = await getProducts({ ids: viewedIds.join(','), limit: 10 })
                        if (viewedResult.data?.products) {
                            // Maintain the order from viewedIds
                            const sortedViewed = viewedIds
                                .map(id => viewedResult.data.products.find(p => (p._id || p.id) === id))
                                .filter(Boolean)
                            setRecentlyViewed(sortedViewed)
                        }
                    }
                } catch (e) {
                    console.error('Error loading recently viewed:', e)
                }

            } catch (error) {
                console.error('Error loading vendor catalog:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const banners = carousels.length > 0
        ? carousels.map(carousel => ({
            id: carousel.id || carousel._id,
            title: carousel.title || '',
            subtitle: carousel.description || '',
            image: carousel.image || '',
            productIds: carousel.productIds || [],
        }))
        : []

    const formatProductForCard = (product) => {
        // Robust price calculation for vendor
        let displayPrice = 0
        if (product.attributeStocks && product.attributeStocks.length > 0) {
            const prices = product.attributeStocks
                .map(a => a.vendorPrice || a.priceToVendor || 0)
                .filter(p => p > 0)
            if (prices.length > 0) {
                displayPrice = Math.min(...prices)
            }
        }

        if (displayPrice === 0) {
            displayPrice = product.priceToVendor || product.vendorPrice || product.price || product.priceToUser || 0
        }

        return {
            id: product._id || product.id,
            name: product.name,
            price: displayPrice,
            image: product.images?.[0]?.url || product.primaryImage || 'https://via.placeholder.com/300',
            category: product.category,
            stock: product.displayStock || product.stock,
            description: product.description,
            shortDescription: product.shortDescription || product.description,
            isWishlisted: favourites.includes(product._id || product.id),
            showNewBadge: true,
            showRatingBadge: false,
        }
    }

    return (
        <div className="user-home-view vendor-home-view">
            {/* Main Banner */}
            {banners.length > 0 && (
                <section id="home-banner" className="home-banner-section">
                    <div className="home-banner">
                        <div
                            className="home-banner__slide home-banner__slide--active"
                            style={{ backgroundImage: `url(${banners[0]?.image})` }}
                            onClick={() => {
                                if (banners[0]?.productIds && banners[0].productIds.length > 0) {
                                    onProductClick(`carousel:${banners[0].id}`)
                                }
                            }}
                        />
                    </div>
                </section>
            )}

            {/* Try New Section (Best Sellers for Vendor) */}
            <section id="home-try-new" className="home-try-new-section">
                <div className="home-try-new-header">
                    <h3 className="home-try-new-title"><span><Trans>Best Sellers</Trans></span></h3>
                    <p className="home-try-new-subtitle"><Trans>Stock up on these top moving items for your counter!</Trans></p>
                </div>
                <div className="home-try-new-grid">
                    {loading ? (
                        [1, 2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
                    ) : popularProducts.length === 0 ? (
                        <div className="flex items-center justify-center p-8 col-span-full">
                            <p className="text-sm text-gray-500"><Trans>No products available</Trans></p>
                        </div>
                    ) : (
                        popularProducts.slice(0, 2).map((product) => (
                            <ProductCard
                                key={product._id || product.id}
                                product={formatProductForCard(product)}
                                onNavigate={onProductClick}
                                onAddToCart={onAddToCart}
                                onWishlist={onToggleFavourite}
                                className="product-card-wrapper"
                            />
                        ))
                    )}
                </div>
            </section>

            {/* Available for Stock Section */}
            <section id="home-available-products" className="home-available-products-section">
                <div className="home-section-header">
                    <h3 className="home-section-title"><Trans>Available for Stock</Trans></h3>
                </div>
                <div className="home-products-grid">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)
                    ) : popularProducts.length === 0 ? (
                        <div className="flex items-center justify-center p-8 col-span-full">
                            <p className="text-sm text-gray-500"><Trans>No products available</Trans></p>
                        </div>
                    ) : (
                        popularProducts.slice(0, 4).map((product) => (
                            <ProductCard
                                key={product._id || product.id}
                                product={{ ...formatProductForCard(product), showNewBadge: false }}
                                onNavigate={onProductClick}
                                onAddToCart={onAddToCart}
                                onWishlist={onToggleFavourite}
                                className="product-card-wrapper"
                            />
                        ))
                    )}
                </div>
            </section>

            {/* Repayment Bonus/Payment Banner */}
            <section id="home-payment-banner" className="home-payment-banner">
                <div className="home-payment-banner__content">
                    <span className="home-payment-banner__icon">₹</span>
                    <span className="home-payment-banner__text">
                        <Trans>Early Payment Bonus: 10% Off</Trans>
                    </span>
                </div>
                <button className="home-payment-banner__button" onClick={() => onCategoryClick?.('wallet')}>
                    <Trans>Pay now</Trans>
                </button>
            </section>

            {/* Top Premium Products Section */}
            <section id="home-premium-products" className="home-premium-products-section">
                <div className="home-premium-header">
                    <h3 className="home-premium-title"><Trans>Counter Specials</Trans></h3>
                    <h2 className="home-premium-subtitle"><Trans>टॉप प्रीमियम प्रोडक्ट्स</Trans></h2>
                </div>
                <div className="home-premium-grid">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white/10 rounded-2xl animate-pulse" />)
                    ) : products.length === 0 ? (
                        <div className="flex items-center justify-center p-8 col-span-full">
                            <p className="text-sm text-white"><Trans>No products available</Trans></p>
                        </div>
                    ) : (
                        products.slice(0, 4).map((product) => (
                            <div
                                key={product._id || product.id}
                                className="home-premium-card"
                                onClick={() => onProductClick(product._id || product.id)}
                            >
                                <div className="home-premium-card__image">
                                    <img
                                        src={product.images?.[0]?.url || product.primaryImage || 'https://via.placeholder.com/300'}
                                        alt={product.name}
                                        className="home-premium-card__img"
                                    />
                                </div>
                                <p className="home-premium-card__name"><TransText>{product.name}</TransText></p>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Recently Viewed Section */}
            <section id="home-recently-viewed" className="home-recently-viewed-section mt-6">
                <div className="home-section-header">
                    <h3 className="home-section-title"><Trans>Recently Viewed</Trans></h3>
                </div>
                <div className="home-recently-viewed-rail">
                    {recentlyViewed.length > 0 ? (
                        recentlyViewed.slice(0, 10).map((product) => (
                            <div
                                key={product._id || product.id}
                                className="home-recently-card"
                                onClick={() => onProductClick(product._id || product.id)}
                            >
                                <div className="home-recently-card__image">
                                    <img
                                        src={product.images?.[0]?.url || product.primaryImage || 'https://via.placeholder.com/300'}
                                        alt={product.name}
                                        className="home-recently-card__img"
                                    />
                                </div>
                                <div className="home-recently-card__content">
                                    <h4 className="home-recently-card__name"><TransText>{product.name}</TransText></h4>
                                    <p className="home-recently-card__price">
                                        ₹{formatProductForCard(product).price.toLocaleString('en-IN')}
                                    </p>
                                    <span className="home-recently-card__benefit"><Trans>Stock it now</Trans></span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 p-4"><Trans>No recently viewed products</Trans></p>
                    )}
                </div>
                <button className="home-recently-view-all" onClick={() => onProductClick('all')}>
                    <Trans>VIEW ALL</Trans> →
                </button>
            </section>

            {/* Shop By Category Section */}
            <section id="home-shop-category" className="home-shop-category-section mb-20">
                <div className="home-section-header">
                    <h3 className="home-section-title"><Trans>Shop By Category</Trans></h3>
                </div>
                <div className="home-shop-category-grid">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-full animate-pulse" />)
                    ) : categories.length === 0 ? (
                        <div className="flex items-center justify-center p-8 col-span-full">
                            <p className="text-sm text-gray-500"><Trans>No categories available</Trans></p>
                        </div>
                    ) : (
                        categories.slice(0, 6).map((category) => (
                            <div
                                key={category.id || category._id}
                                className="home-shop-category-card"
                                onClick={() => onCategoryClick?.(category.id || category._id)}
                            >
                                <div className="home-shop-category-card__image">
                                    {category.image || category.icon ? (
                                        <img
                                            src={category.image || category.icon}
                                            alt={category.name}
                                            className="home-shop-category-card__img"
                                        />
                                    ) : (
                                        <span className="home-shop-category-card__emoji">{category.emoji || '📦'}</span>
                                    )}
                                </div>
                                <p className="home-shop-category-card__title">
                                    <TransText>{formatCategoryName(category.name)}</TransText>
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}
