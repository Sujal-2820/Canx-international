import { useState, useMemo } from 'react'
import { sellerSnapshot } from '../../services/sellerData'
import { cn } from '../../../../lib/cn'
import { UsersIcon, WalletIcon, TrendingUpIcon } from '../../components/icons'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'registered', label: 'New' },
]

export function ReferralsView({ onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const referrals = sellerSnapshot.referrals

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = referrals.length
    const active = referrals.filter((r) => r.status === 'Active').length
    const totalCommission = referrals.reduce((sum, r) => {
      const amount = parseFloat(r.commissionEarned.replace(/[₹,\s]/g, '')) || 0
      return sum + amount
    }, 0)
    const totalSales = referrals.reduce((sum, r) => {
      const amount = parseFloat(r.totalAmount.replace(/[₹,\sL]/g, '')) || 0
      return sum + amount
    }, 0)

    return {
      total,
      active,
      totalCommission: `₹${(totalCommission / 1000).toFixed(1)}K`,
      totalSales: `₹${(totalSales / 1000).toFixed(1)}K`,
    }
  }, [referrals])

  // Filter referrals
  const filteredReferrals = useMemo(() => {
    let filtered = referrals

    // Status filter
    if (activeFilter === 'active') {
      filtered = filtered.filter((r) => r.status === 'Active')
    } else if (activeFilter === 'registered') {
      filtered = filtered.filter((r) => r.status === 'Registered')
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.userId.toLowerCase().includes(query) ||
          r.totalAmount.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [referrals, activeFilter, searchQuery])

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="seller-referrals space-y-6">
      {/* Header Stats */}
      <section id="seller-referrals-hero" className="seller-referrals-hero">
        <div className="seller-referrals-hero__card">
          <div className="seller-referrals-hero__header">
            <div>
              <h2 className="seller-referrals-hero__title">Your Referrals</h2>
              <p className="seller-referrals-hero__subtitle">Track your referral network</p>
            </div>
            <div className="seller-referrals-hero__badge">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="seller-referrals-hero__stats">
            <div className="seller-referrals-stat">
              <p className="seller-referrals-stat__label">Total Referrals</p>
              <span className="seller-referrals-stat__value">{stats.total}</span>
            </div>
            <div className="seller-referrals-stat">
              <p className="seller-referrals-stat__label">Active Users</p>
              <span className="seller-referrals-stat__value">{stats.active}</span>
            </div>
            <div className="seller-referrals-stat">
              <p className="seller-referrals-stat__label">Total Commission</p>
              <span className="seller-referrals-stat__value">{stats.totalCommission}</span>
            </div>
            <div className="seller-referrals-stat">
              <p className="seller-referrals-stat__label">Total Sales</p>
              <span className="seller-referrals-stat__value">{stats.totalSales}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section id="seller-referrals-filters" className="seller-section">
        <div className="seller-filter-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={cn('seller-filter-tab', activeFilter === tab.id && 'is-active')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <section id="seller-referrals-search" className="seller-section">
        <div className="seller-search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, user ID, or amount..."
            className="seller-search-bar__input"
            aria-label="Search referrals"
          />
        </div>
      </section>

      {/* Referrals List */}
      <section id="seller-referrals-list" className="seller-section">
        {filteredReferrals.length === 0 ? (
          <div className="seller-referrals-empty">
            <UsersIcon className="seller-referrals-empty__icon" />
            <p className="seller-referrals-empty__text">No referrals found</p>
            <p className="seller-referrals-empty__subtext">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start referring users to see them here'}
            </p>
          </div>
        ) : (
          <div className="seller-referrals-list">
            {filteredReferrals.map((referral) => (
              <div
                key={referral.id}
                className={cn('seller-referral-card', expandedId === referral.id && 'is-expanded')}
              >
                <div
                  className="seller-referral-card__header"
                  onClick={() => setExpandedId(expandedId === referral.id ? null : referral.id)}
                >
                  <div className="seller-referral-card__avatar">{referral.avatar}</div>
                  <div className="seller-referral-card__info">
                    <div className="seller-referral-card__row">
                      <h3 className="seller-referral-card__name">{referral.name}</h3>
                      <span
                        className={cn(
                          'seller-referral-card__status',
                          referral.status === 'Active' ? 'is-active' : 'is-registered',
                        )}
                      >
                        {referral.status}
                      </span>
                    </div>
                    <div className="seller-referral-card__meta">
                      <span className="seller-referral-card__id">{referral.userId}</span>
                      <span className="seller-referral-card__date">
                        Joined {formatDate(referral.registeredDate)}
                      </span>
                    </div>
                  </div>
                  <div className="seller-referral-card__toggle">
                    <TrendingUpIcon
                      className={cn('h-4 w-4', expandedId === referral.id && 'rotate-180')}
                    />
                  </div>
                </div>

                {expandedId === referral.id && (
                  <div className="seller-referral-card__details">
                    <div className="seller-referral-card__stats-grid">
                      <div className="seller-referral-stat">
                        <p className="seller-referral-stat__label">Total Purchases</p>
                        <span className="seller-referral-stat__value">{referral.totalPurchases}</span>
                      </div>
                      <div className="seller-referral-stat">
                        <p className="seller-referral-stat__label">Total Amount</p>
                        <span className="seller-referral-stat__value">{referral.totalAmount}</span>
                      </div>
                      <div className="seller-referral-stat">
                        <p className="seller-referral-stat__label">Commission Earned</p>
                        <span className="seller-referral-stat__value seller-referral-stat__value--commission">
                          {referral.commissionEarned}
                        </span>
                      </div>
                      <div className="seller-referral-stat">
                        <p className="seller-referral-stat__label">Last Purchase</p>
                        <span className="seller-referral-stat__value">{referral.lastPurchase}</span>
                      </div>
                    </div>
                    <div className="seller-referral-card__actions">
                      <button
                        type="button"
                        className="seller-referral-card__action"
                        onClick={() => onNavigate('wallet')}
                      >
                        <WalletIcon className="h-4 w-4" />
                        View Transactions
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Stats (always visible) */}
                <div className="seller-referral-card__quick-stats">
                  <div className="seller-referral-quick-stat">
                    <span className="seller-referral-quick-stat__label">Purchases</span>
                    <span className="seller-referral-quick-stat__value">{referral.totalPurchases}</span>
                  </div>
                  <div className="seller-referral-quick-stat">
                    <span className="seller-referral-quick-stat__label">Total</span>
                    <span className="seller-referral-quick-stat__value">{referral.totalAmount}</span>
                  </div>
                  <div className="seller-referral-quick-stat seller-referral-quick-stat--commission">
                    <span className="seller-referral-quick-stat__label">Commission</span>
                    <span className="seller-referral-quick-stat__value">{referral.commissionEarned}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

