import { useMemo } from 'react'
import { sellerSnapshot } from '../../services/sellerData'
import { cn } from '../../../../lib/cn'
import { TrendingUpIcon, TargetIcon, UsersIcon, WalletIcon, CloseIcon } from '../../components/icons'

export function PerformanceView({ onBack }) {
  const overview = sellerSnapshot.overview
  const profile = sellerSnapshot.profile

  // Calculate performance metrics
  const performanceData = useMemo(() => {
    const totalSales = parseFloat(overview.totalSales.replace(/[₹,\sL]/g, '')) || 0
    const monthlyTarget = parseFloat(overview.monthlyTarget.replace(/[₹,\sL]/g, '')) || 0
    const thisMonthSales = parseFloat(overview.thisMonthSales.replace(/[₹,\sL]/g, '')) || 0

    return {
      totalSales,
      monthlyTarget,
      thisMonthSales,
      targetProgress: overview.targetProgress,
      totalReferrals: overview.totalReferrals,
      thisMonthReferrals: overview.thisMonthReferrals,
      avgCommissionPerSale: totalSales > 0 ? (totalSales * 0.05).toFixed(2) : 0,
      conversionRate: overview.totalReferrals > 0 ? ((overview.totalReferrals / 300) * 100).toFixed(1) : 0,
    }
  }, [overview])

  const formatCurrency = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    }
    return `₹${value.toLocaleString('en-IN')}`
  }

  return (
    <div className="seller-performance space-y-6">
      {/* Hero Section */}
      <section id="seller-performance-hero" className="seller-performance-hero">
        <div className="seller-performance-hero__card">
          <div className="seller-performance-hero__header">
            <div>
              <h2 className="seller-performance-hero__title">Performance Analytics</h2>
              <p className="seller-performance-hero__subtitle">Detailed insights into your sales performance</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="seller-performance-hero__back"
                  aria-label="Back to overview"
                >
                  <CloseIcon className="h-5 w-5 text-white rotate-45" />
                </button>
              )}
              <div className="seller-performance-hero__badge">
                <TrendingUpIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section id="seller-performance-metrics" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Key Metrics</h3>
          </div>
        </div>
        <div className="seller-performance-grid">
          <div className="seller-performance-card">
            <div className="seller-performance-card__icon seller-performance-card__icon--sales">
              <TrendingUpIcon className="h-5 w-5" />
            </div>
            <div className="seller-performance-card__content">
              <p className="seller-performance-card__label">Total Sales</p>
              <h4 className="seller-performance-card__value">{overview.totalSales}</h4>
              <span className="seller-performance-card__trend">+12% vs last month</span>
            </div>
          </div>

          <div className="seller-performance-card">
            <div className="seller-performance-card__icon seller-performance-card__icon--target">
              <TargetIcon className="h-5 w-5" />
            </div>
            <div className="seller-performance-card__content">
              <p className="seller-performance-card__label">Target Progress</p>
              <h4 className="seller-performance-card__value">{overview.targetProgress}%</h4>
              <span className="seller-performance-card__trend">{overview.status}</span>
            </div>
          </div>

          <div className="seller-performance-card">
            <div className="seller-performance-card__icon seller-performance-card__icon--referrals">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div className="seller-performance-card__content">
              <p className="seller-performance-card__label">Total Referrals</p>
              <h4 className="seller-performance-card__value">{overview.totalReferrals}</h4>
              <span className="seller-performance-card__trend">+{overview.thisMonthReferrals} this month</span>
            </div>
          </div>

          <div className="seller-performance-card">
            <div className="seller-performance-card__icon seller-performance-card__icon--commission">
              <WalletIcon className="h-5 w-5" />
            </div>
            <div className="seller-performance-card__content">
              <p className="seller-performance-card__label">Avg Commission</p>
              <h4 className="seller-performance-card__value">₹{performanceData.avgCommissionPerSale}</h4>
              <span className="seller-performance-card__trend">Per sale</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sales Breakdown */}
      <section id="seller-performance-breakdown" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Sales Breakdown</h3>
            <p className="seller-section__subtitle">This month's performance</p>
          </div>
        </div>
        <div className="seller-performance-breakdown">
          <div className="seller-breakdown-item">
            <div className="seller-breakdown-item__info">
              <span className="seller-breakdown-item__label">Monthly Target</span>
              <span className="seller-breakdown-item__value">{overview.monthlyTarget}</span>
            </div>
            <div className="seller-breakdown-item__bar">
              <div className="seller-breakdown-item__bar-fill" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="seller-breakdown-item">
            <div className="seller-breakdown-item__info">
              <span className="seller-breakdown-item__label">Achieved</span>
              <span className="seller-breakdown-item__value seller-breakdown-item__value--achieved">
                {overview.thisMonthSales}
              </span>
            </div>
            <div className="seller-breakdown-item__bar">
              <div
                className="seller-breakdown-item__bar-fill seller-breakdown-item__bar-fill--achieved"
                style={{ width: `${overview.targetProgress}%` }}
              />
            </div>
          </div>
          <div className="seller-breakdown-item">
            <div className="seller-breakdown-item__info">
              <span className="seller-breakdown-item__label">Remaining</span>
              <span className="seller-breakdown-item__value seller-breakdown-item__value--remaining">
                {formatCurrency(performanceData.monthlyTarget - performanceData.thisMonthSales)}
              </span>
            </div>
            <div className="seller-breakdown-item__bar">
              <div
                className="seller-breakdown-item__bar-fill seller-breakdown-item__bar-fill--remaining"
                style={{ width: `${100 - overview.targetProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section id="seller-performance-stats" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Statistics</h3>
          </div>
        </div>
        <div className="seller-performance-stats">
          <div className="seller-stat-item">
            <span className="seller-stat-item__label">Conversion Rate</span>
            <span className="seller-stat-item__value">{performanceData.conversionRate}%</span>
          </div>
          <div className="seller-stat-item">
            <span className="seller-stat-item__label">Active Users</span>
            <span className="seller-stat-item__value">
              {sellerSnapshot.referrals.filter((r) => r.status === 'Active').length}
            </span>
          </div>
          <div className="seller-stat-item">
            <span className="seller-stat-item__label">Avg Purchase Value</span>
            <span className="seller-stat-item__value">₹2,400</span>
          </div>
          <div className="seller-stat-item">
            <span className="seller-stat-item__label">Commission Rate</span>
            <span className="seller-stat-item__value">{profile.commissionRate}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

