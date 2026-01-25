import { useEffect, useState } from 'react'
import { cn } from '../../../lib/cn'
import { CloseIcon, MenuIcon, SearchIcon, BellIcon, HeartIcon, CartIcon } from './icons'

import { MapPinIcon } from './icons'
import { LanguageToggle } from '../../../components/LanguageToggle'
import { Trans } from '../../../components/Trans'
import { useTranslation } from '../../../context/TranslationContext'
import { TransText } from '../../../components/TransText'

export function MobileShell({ title, subtitle, children, navigation, menuContent, onSearchClick, onNotificationClick, notificationCount = 0, favouritesCount = 0, cartCount = 0, isNotificationAnimating = false, isHome = false, onNavigate }) {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const [hideSecondRow, setHideSecondRow] = useState(false)
  const { language } = useTranslation() // Force re-render on language change

  useEffect(() => {
    let ticking = false
    let lastScrollY = window.scrollY
    let lastDecisiveScrollY = window.scrollY
    let scrollDirection = 0
    const scrollThreshold = 30
    const hideThreshold = 80
    const showThreshold = 30
    const stateChangeMinDistance = 40

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const scrollDelta = currentScrollY - lastScrollY
          const distanceFromLastChange = Math.abs(currentScrollY - lastDecisiveScrollY)

          if (Math.abs(scrollDelta) > scrollThreshold) {
            scrollDirection = scrollDelta > 0 ? 1 : -1
          }

          if (scrollDirection === 1) {
            if (currentScrollY > 30) {
              setCompact(true)
            }
            if (currentScrollY > hideThreshold && distanceFromLastChange > stateChangeMinDistance) {
              setHideSecondRow(true)
              lastDecisiveScrollY = currentScrollY
            }
          } else if (scrollDirection === -1) {
            if (currentScrollY < showThreshold || distanceFromLastChange > stateChangeMinDistance) {
              setCompact(false)
              setHideSecondRow(false)
              lastDecisiveScrollY = currentScrollY
            }
          }

          lastScrollY = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="vendor-shell">
      <header className={cn('vendor-shell-header', compact && 'is-compact')}>
        <div className="vendor-shell-header__glow" />
        <div className="vendor-shell-header__controls">
          <div className="vendor-shell-header__brand">
            <img src="/assets/Satpura-1.webp" alt="Satpura Bio" className="h-11 w-auto transition-transform duration-200" />
          </div>
          <div className="vendor-shell-header__actions-redesigned">
            <button
              type="button"
              onClick={onNotificationClick}
              className="vendor-icon-button-redesigned"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6" />
              {notificationCount > 0 && (
                <span className="vendor-badge-redesigned">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('favourites')}
              className="vendor-icon-button-redesigned"
              aria-label="Favourites"
            >
              <HeartIcon className="h-6 w-6" />
              {favouritesCount > 0 && (
                <span className="vendor-badge-redesigned">
                  {favouritesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('catalog-cart')}
              className="vendor-icon-button-redesigned"
              aria-label="Cart"
            >
              <CartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="vendor-badge-redesigned">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className={cn('vendor-shell-header__info', compact && 'is-compact', hideSecondRow && 'is-hidden')}>
          {title ? <span className="vendor-brand-title"><TransText>{title}</TransText></span> : null}
          <div className="vendor-shell-header__hint">
            <MapPinIcon className="mr-2 inline h-3.5 w-3.5" />
            <TransText>{subtitle}</TransText>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar - Separated from Header - Only shown on Home Screen */}
      {isHome && (
        <div className={cn('home-search-section', compact && 'is-compact')}>
          <div className="home-search-bar">
            <div className="home-search-input-wrapper">
              <input
                type="text"
                placeholder="Search Product..."
                className="home-search-input"
                onClick={onSearchClick}
                readOnly
              />
            </div>
            <button className="home-search-button" onClick={onSearchClick} aria-label="Search">
              <SearchIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      <main className={cn('vendor-shell-content', !isHome && 'vendor-shell-content--subpage', compact && 'is-compact')}>
        <div className="space-y-6">{children}</div>
      </main>

      <nav className="vendor-shell-bottom-nav">
        <div className="vendor-shell-bottom-nav__inner">{navigation}</div>
      </nav>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={cn(
          'fixed bottom-0 right-0 top-0 z-50 flex w-[78%] max-w-xs flex-col bg-white shadow-[-12px_0_36px_-26px_rgba(15,23,42,0.45)] transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-6">
          <p className="text-sm font-semibold text-surface-foreground"><Trans>Quick Actions</Trans></p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-muted/60 text-muted-foreground"
            aria-label="Close menu"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-10">
          <div className="mb-4">
            <LanguageToggle variant="default" onLanguageChange={() => setOpen(false)} />
          </div>
          {typeof menuContent === 'function'
            ? menuContent({
              close: () => setOpen(false),
              onNavigate: () => setOpen(false),
            })
            : menuContent}
        </div>
      </aside>
    </div>
  )
}

