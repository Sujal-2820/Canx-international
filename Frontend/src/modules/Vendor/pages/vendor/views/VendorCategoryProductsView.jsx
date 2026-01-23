import { useMemo, useState, useEffect } from 'react'
import { ProductCard } from '../../../../User/components/ProductCard'
import { ChevronLeftIcon, FilterIcon } from '../../../../Vendor/components/icons'
import { cn } from '../../../../../lib/cn'
import * as userApi from '../../../../User/services/userApi'
import { TransText } from '../../../../../components/TransText'
import { Trans } from '../../../../../components/Trans'

export function VendorCategoryProductsView({ categoryId, onProductClick, onAddToCart, onBack, onToggleFavourite, favourites = [] }) {
    const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all')
    const [showFilters, setShowFilters] = useState(false)
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const result = await userApi.getCategories()
                if (result.success && result.data?.categories) {
                    setCategories(result.data.categories)
                }
            } catch (error) {
                console.error('Error loading categories:', error)
            }
        }
        loadCategories()
    }, [])

    // Sync selectedCategory with categoryId prop
    useEffect(() => {
        if (categoryId) {
            setSelectedCategory(categoryId)
        }
    }, [categoryId])

    // Fetch products (as vendor)
    useEffect(() => {
        const loadProducts = async () => {
            if (selectedCategory !== 'all' && categories.length === 0) {
                return
            }

            setLoading(true)
            try {
                const params = { limit: 100 }
                if (selectedCategory !== 'all') {
                    const categoryObj = categories.find(c => (c._id || c.id) === selectedCategory)
                    if (categoryObj) {
                        params.category = categoryObj.name
                    } else {
                        params.category = selectedCategory
                    }
                }

                // Use generic product fetch for catalog
                const result = await userApi.getProducts(params)
                if (result.success && result.data?.products) {
                    setProducts(result.data.products)
                }
            } catch (error) {
                console.error('Error loading products:', error)
            } finally {
                setLoading(false)
            }
        }

        loadProducts()
    }, [selectedCategory, categories])

    const category = useMemo(() => {
        if (selectedCategory === 'all') return null
        return categories.find((cat) => (cat._id || cat.id) === selectedCategory)
    }, [selectedCategory, categories])

    const allCategories = [
        { id: 'all', name: 'All' },
        ...categories,
    ]

    const formatProductForCard = (product) => ({
        id: product._id || product.id,
        name: product.name,
        price: (product.attributeStocks && product.attributeStocks.length > 0)
            ? Math.min(...product.attributeStocks.map(a => a.vendorPrice))
            : (product.priceToVendor || product.price || 0),
        image: product.images?.[0]?.url || product.primaryImage || 'https://via.placeholder.com/300',
        category: product.category,
        stock: product.displayStock || product.stock,
        description: product.description,
        shortDescription: product.shortDescription || product.description,
        isWishlisted: favourites.includes(product._id || product.id),
        showNewBadge: false,
        showRatingBadge: true,
        rating: product.rating ?? product.averageRating,
        reviewCount: product.reviewCount ?? (product.reviews?.length || 0),
    })

    return (
        <div className="user-category-products-view space-y-4">
            {/* Header */}
            <div className="user-category-products-view__header">
                <button
                    type="button"
                    className="user-category-products-view__back"
                    onClick={onBack}
                    aria-label="Go back"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="user-category-products-view__header-content">
                    <div className="user-category-products-view__header-text">
                        <h2 className="user-category-products-view__title">
                            {category ? <TransText>{category.name}</TransText> : <Trans>All Products</Trans>}
                        </h2>
                        <p className="user-category-products-view__subtitle">
                            {products.length} <Trans>{products.length === 1 ? 'product' : 'products'}</Trans> <Trans>available</Trans>
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Filter Menu */}
            <div className="user-category-products-view__categories">
                <div className="user-category-products-view__categories-rail">
                    {allCategories.map((cat, index) => (
                        <button
                            key={cat._id || cat.id || `category-${index}`}
                            type="button"
                            className={cn(
                                'user-category-products-view__category-tab',
                                selectedCategory === (cat._id || cat.id) && 'user-category-products-view__category-tab--active'
                            )}
                            onClick={() => setSelectedCategory(cat._id || cat.id)}
                        >
                            {cat.name === 'All' ? <Trans>All</Trans> : <TransText>{cat.name}</TransText>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Products List */}
            <div className="home-products-grid px-3 pb-20">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)
                ) : products.length === 0 ? (
                    <div className="flex items-center justify-center p-8 col-span-full">
                        <p className="text-sm text-gray-500"><Trans>No products found in this category</Trans></p>
                    </div>
                ) : (
                    products.map((product) => (
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
        </div>
    )
}
