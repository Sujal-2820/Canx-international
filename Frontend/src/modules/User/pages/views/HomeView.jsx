import { useRef, useState, useEffect } from 'react'
import { userSnapshot } from '../../services/userData'
import { ProductCard } from '../../components/ProductCard'
import { CategoryCard } from '../../components/CategoryCard'
import { ChevronRightIcon, MapPinIcon, TruckIcon, SearchIcon, FilterIcon } from '../../components/icons'
import { cn } from '../../../../lib/cn'

export function HomeView({ onProductClick, onCategoryClick, onAddToCart, onSearchClick, onFilterClick, onToggleFavourite, favourites = [] }) {
  const [bannerIndex, setBannerIndex] = useState(0)
  const categoriesRef = useRef(null)
  const bannerRef = useRef(null)
  const [selectedCategory, setSelectedCategory] = useState(userSnapshot.categories[0]?.id || null)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const autoSlideTimeoutRef = useRef(null)
  const touchStartXRef = useRef(null)
  const touchEndXRef = useRef(null)

  const popularProducts = userSnapshot.popularProducts
    .map((id) => userSnapshot.products.find((p) => p.id === id))
    .filter(Boolean)

  const goToNextSlide = () => {
    setBannerIndex((prev) => (prev + 1) % userSnapshot.banners.length)
  }

  const goToPreviousSlide = () => {
    setBannerIndex((prev) => (prev - 1 + userSnapshot.banners.length) % userSnapshot.banners.length)
  }

  const goToSlide = (index) => {
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
    if (isUserInteracting) return

    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % userSnapshot.banners.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isUserInteracting])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSlideTimeoutRef.current) {
        clearTimeout(autoSlideTimeoutRef.current)
      }
    }
  }, [])

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

      {/* Hero Banner Section */}
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
          {userSnapshot.banners.map((banner, index) => (
            <div
              key={banner.id}
              className={cn(
                'home-hero-banner__slide',
                index === bannerIndex ? 'home-hero-banner__slide--active' : 'home-hero-banner__slide--hidden'
              )}
              style={{ backgroundImage: `url(${banner.image})` }}
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
          {userSnapshot.banners.map((_, index) => (
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
          {userSnapshot.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={handleCategoryClick}
              isSelected={selectedCategory === category.id}
              className="home-category-card"
            />
          ))}
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
          {popularProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{ ...product, isWishlisted: favourites.includes(product.id) }}
              onNavigate={onProductClick}
              onAddToCart={onAddToCart}
              onWishlist={onToggleFavourite}
              className="home-product-card"
            />
          ))}
        </div>
      </section>

      {/* Special Deals Section */}
      <section id="home-deals" className="home-deals-section">
        <div className="home-section-header">
          <div className="home-section-header__content">
            <h3 className="home-section-header__title">Special Offers</h3>
            <p className="home-section-header__subtitle">Limited time deals</p>
          </div>
        </div>
        <div className="home-deals-grid">
          {userSnapshot.deals.map((deal) => (
            <div
              key={deal.id}
              className="home-deal-card"
            >
              <div className="home-deal-card__badge">Special Offer</div>
              <div className="home-deal-card__content">
                <h4 className="home-deal-card__title">{deal.title}</h4>
                <p className="home-deal-card__subtitle">{deal.subtitle}</p>
              </div>
              {deal.category && (
                <button
                  type="button"
                  className="home-deal-card__cta"
                  onClick={() => onCategoryClick(deal.category)}
                >
                  Shop Now
                  <ChevronRightIcon className="home-deal-card__cta-icon" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

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
