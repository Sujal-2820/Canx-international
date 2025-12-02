import { useRef, useState, useEffect } from 'react'
import { ProductCard } from '../../components/ProductCard'
import { CategoryCard } from '../../components/CategoryCard'
import { ChevronRightIcon, MapPinIcon, TruckIcon, SearchIcon, FilterIcon } from '../../components/icons'
import { cn } from '../../../../lib/cn'
import { useUserApi } from '../../hooks/useUserApi'
import * as userApi from '../../services/userApi'

export function HomeView({ onProductClick, onCategoryClick, onAddToCart, onSearchClick, onFilterClick, onToggleFavourite, favourites = [] }) {
  const [bannerIndex, setBannerIndex] = useState(0)
  const categoriesRef = useRef(null)
  const bannerRef = useRef(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const autoSlideTimeoutRef = useRef(null)
  const touchStartXRef = useRef(null)
  const touchEndXRef = useRef(null)
  
  // Real data from API
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [popularProducts, setPopularProducts] = useState([])
  const [carousels, setCarousels] = useState([])
  const [specialOffers, setSpecialOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const { fetchCategories, fetchProducts } = useUserApi()

  // Fetch categories and products on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Fetch categories
        const categoriesResult = await fetchCategories()
        if (categoriesResult.data?.categories) {
          const cats = categoriesResult.data.categories
          setCategories(cats)
          if (cats.length > 0) {
            setSelectedCategory(cats[0].id)
          }
        }

        // Fetch popular products - limit to 4 for home screen
        const popularResult = await userApi.getPopularProducts({ limit: 4 })
        if (popularResult.success && popularResult.data?.products) {
          setPopularProducts(popularResult.data.products)
        }

        // Fetch all products (or products by selected category)
        const productsResult = await fetchProducts({ limit: 20 })
        if (productsResult.data?.products) {
          setProducts(productsResult.data.products)
        }

        // Fetch offers (carousels and special offers)
        const offersResult = await userApi.getOffers()
        if (offersResult.success && offersResult.data) {
          // Filter active carousels and sort by order
          const activeCarousels = (offersResult.data.carousels || [])
            .filter(c => c.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
          setCarousels(activeCarousels)
          setSpecialOffers(offersResult.data.specialOffers || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Fetch products when category changes
  useEffect(() => {
    if (selectedCategory) {
      const loadProducts = async () => {
        try {
          const result = await fetchProducts({ category: selectedCategory, limit: 20 })
          if (result.data?.products) {
            setProducts(result.data.products)
          }
        } catch (error) {
          console.error('Error loading products:', error)
        }
      }
      loadProducts()
    }
  }, [selectedCategory, fetchProducts])

  // Use dynamic carousels from API, fallback to empty array
  // Carousels are already filtered and sorted by order in the fetch
  const banners = carousels.length > 0 
    ? carousels.map(carousel => ({
        id: carousel.id || carousel._id,
        title: carousel.title || '',
        subtitle: carousel.description || '',
        image: carousel.image || '',
        productIds: carousel.productIds || [],
      }))
    : []

  const goToNextSlide = () => {
    if (banners.length === 0) return
    setBannerIndex((prev) => (prev + 1) % banners.length)
  }

  const goToPreviousSlide = () => {
    if (banners.length === 0) return
    setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToSlide = (index) => {
    if (banners.length === 0 || index < 0 || index >= banners.length) return
    setBannerIndex(index)
    setIsUserInteracting(true)
    resetAutoSlide()
  }

  const resetAutoSlide = () => {
    if (autoSlideTimeoutRef.current) {
      clearTimeout(autoSlideTimeoutRef.current)
    }
    autoSlideTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false)
    }, 3000)
  }

  // Auto-slide when user is not interacting
  useEffect(() => {
    if (isUserInteracting || banners.length === 0) return

    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isUserInteracting, banners.length])

  // Cleanup on unmount and reset banner index when banners change
  useEffect(() => {
    if (banners.length > 0 && bannerIndex >= banners.length) {
      setBannerIndex(0)
    }
    return () => {
      if (autoSlideTimeoutRef.current) {
        clearTimeout(autoSlideTimeoutRef.current)
      }
    }
  }, [banners.length, bannerIndex])

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX
    setIsUserInteracting(true)
  }

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return

    const distance = touchStartXRef.current - touchEndXRef.current
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swiped left - go to next
        goToNextSlide()
      } else {
        // Swiped right - go to previous
        goToPreviousSlide()
      }
    }

    resetAutoSlide()
    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  // Mouse handlers for desktop drag
  const handleMouseDown = (e) => {
    touchStartXRef.current = e.clientX
    setIsUserInteracting(true)
  }

  const handleMouseMove = (e) => {
    if (touchStartXRef.current !== null) {
      touchEndXRef.current = e.clientX
    }
  }

  const handleMouseUp = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) {
      touchStartXRef.current = null
      touchEndXRef.current = null
      return
    }

    const distance = touchStartXRef.current - touchEndXRef.current
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNextSlide()
      } else {
        goToPreviousSlide()
      }
    }

    resetAutoSlide()
    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
    onCategoryClick?.(categoryId)
  }

  // Prevent scrolling past the end
  useEffect(() => {
    const container = categoriesRef.current
    if (!container) return

    const handleScroll = () => {
      const maxScroll = container.scrollWidth - container.clientWidth
      if (container.scrollLeft > maxScroll) {
        container.scrollLeft = maxScroll
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="user-home-view space-y-6">
      {/* Search Bar Section */}
      <section id="home-search" className="home-search-section">
        <div className="home-search-bar">
          <div className="home-search-bar__input-wrapper">
            <SearchIcon className="home-search-bar__icon" />
            <input
              type="text"
              placeholder="Search Products, Seeds, Fertilizers, etc"
              className="home-search-bar__input"
              onClick={onSearchClick}
              readOnly
            />
          </div>
          <button
            type="button"
            className="home-search-bar__filter"
            onClick={onFilterClick}
            aria-label="Filter"
          >
            <FilterIcon className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Hero Banner Section - Only show if carousels exist */}
      {banners.length > 0 && (
        <section id="home-hero" className="home-hero-section">
          <div
            ref={bannerRef}
            className="home-hero-banner"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={cn(
                  'home-hero-banner__slide',
                  index === bannerIndex ? 'home-hero-banner__slide--active' : 'home-hero-banner__slide--hidden'
                )}
                style={{ backgroundImage: `url(${banner.image})` }}
                onClick={() => {
                  // Navigate to carousel products view
                  if (banner.productIds && banner.productIds.length > 0) {
                    onProductClick(`carousel:${banner.id}`)
                  }
                }}
              >
                <div className="home-hero-banner__overlay" />
                <div className="home-hero-banner__content">
                  <h2 className="home-hero-banner__title">{banner.title}</h2>
                  <p className="home-hero-banner__subtitle">{banner.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="home-hero-banner__indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  'home-hero-banner__indicator',
                  index === bannerIndex && 'home-hero-banner__indicator--active'
                )}
                onClick={() => goToSlide(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section id="home-categories" className="home-categories-section">
        <div className="home-section-header">
          <div className="home-section-header__content">
            <h3 className="home-section-header__title">Categories</h3>
          </div>
          <button
            type="button"
            className="home-section-header__cta"
            onClick={() => onCategoryClick('all')}
          >
            See all
          </button>
        </div>
        <div ref={categoriesRef} className="home-categories-rail">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-gray-500">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-gray-500">No categories available</p>
            </div>
          ) : (
            categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={{
                  id: category.id,
                  name: category.name,
                  emoji: category.icon,
                  count: category.count,
                  description: category.description,
                }}
                onClick={handleCategoryClick}
                isSelected={selectedCategory === category.id}
                className="home-category-card"
              />
            ))
          )}
        </div>
      </section>

      {/* Popular Products Section */}
      <section id="home-popular-products" className="home-products-section">
        <div className="home-section-header">
          <div className="home-section-header__content">
            <h3 className="home-section-header__title">Popular Products</h3>
            <p className="home-section-header__subtitle">Best sellers this week</p>
          </div>
          <button
            type="button"
            className="home-section-header__cta"
            onClick={() => onProductClick('all')}
          >
            View All
            <ChevronRightIcon className="home-section-header__cta-icon" />
          </button>
        </div>
        <div className="home-products-grid">
          {loading ? (
            <div className="flex items-center justify-center p-8 col-span-full">
              <p className="text-sm text-gray-500">Loading products...</p>
            </div>
          ) : popularProducts.length === 0 ? (
            <div className="flex items-center justify-center p-8 col-span-full">
              <p className="text-sm text-gray-500">No popular products available</p>
            </div>
          ) : (
            popularProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={{
                  id: product._id || product.id,
                  name: product.name,
                  price: product.priceToUser || product.price || 0,
                  image: product.images?.[0]?.url || product.primaryImage || 'https://via.placeholder.com/300',
                  category: product.category,
                  stock: product.stock,
                  description: product.description,
                  isWishlisted: favourites.includes(product._id || product.id),
                }}
                onNavigate={onProductClick}
                onAddToCart={onAddToCart}
                onWishlist={onToggleFavourite}
                className="home-product-card"
              />
            ))
          )}
        </div>
      </section>

      {/* Special Deals Section - Only show if special offers exist */}
      {specialOffers.length > 0 && (
        <section id="home-deals" className="home-deals-section">
          <div className="home-section-header">
            <div className="home-section-header__content">
              <h3 className="home-section-header__title">Special Offers</h3>
              <p className="home-section-header__subtitle">Limited time deals</p>
            </div>
          </div>
          <div className="home-deals-grid">
            {specialOffers.map((offer) => (
              <div key={offer.id} className="home-deal-card">
                <div className="home-deal-card__badge">{offer.specialTag}</div>
                <div className="home-deal-card__content">
                  <h4 className="home-deal-card__title">{offer.title}</h4>
                  {offer.description && (
                    <p className="home-deal-card__description">{offer.description}</p>
                  )}
                  <div className="home-deal-card__price">
                    <span className="home-deal-card__price-current">{offer.specialValue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats Section */}
      <section id="home-stats" className="home-stats-section">
        <div className="home-stats-grid">
          <div className="home-stat-card">
            <div className="home-stat-card__icon home-stat-card__icon--delivery">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div className="home-stat-card__content">
              <p className="home-stat-card__label">Fast Delivery</p>
              <span className="home-stat-card__value">3-4 Hours</span>
            </div>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-card__icon home-stat-card__icon--payment">
              <MapPinIcon className="h-5 w-5" />
            </div>
            <div className="home-stat-card__content">
              <p className="home-stat-card__label">Easy Payment</p>
              <span className="home-stat-card__value">30% Advance</span>
            </div>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-card__icon home-stat-card__icon--quality">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div className="home-stat-card__content">
              <p className="home-stat-card__label">Quality Assured</p>
              <span className="home-stat-card__value">100% Genuine</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
