import { useState, useRef, useEffect } from 'react'
import { sellerSnapshot } from '../../services/sellerData'
import { useSellerState } from '../../context/SellerContext'
import { useSellerApi } from '../../hooks/useSellerApi'
import { cn } from '../../../../lib/cn'
import { UsersIcon, WalletIcon, ChartIcon, SparkIcon, ShareIcon, TargetIcon, TrendingUpIcon, GiftIcon } from '../../components/icons'

export function OverviewView({ onNavigate, openPanel }) {
  const { targetIncentives } = useSellerState()
  const { fetchTargetIncentives } = useSellerApi()
  const [showActivitySheet, setShowActivitySheet] = useState(false)
  const [renderActivitySheet, setRenderActivitySheet] = useState(false)
  const servicesRef = useRef(null)
  const [servicePage, setServicePage] = useState(0)

  const overview = sellerSnapshot.overview
  const profile = sellerSnapshot.profile

  const services = [
    { label: 'Share ID', note: 'Share your Seller ID', tone: 'success', icon: ShareIcon, action: 'share-seller-id' },
    { label: 'Referrals', note: 'View all referrals', tone: 'success', target: 'referrals', icon: UsersIcon, action: null },
    { label: 'Wallet', note: 'View balance', tone: 'success', target: 'wallet', icon: WalletIcon, action: null },
    { label: 'Performance', note: 'View analytics', tone: 'success', icon: ChartIcon, action: 'view-performance' },
  ]

  const quickActions = [
    {
      label: 'Share Seller ID',
      description: 'Copy your unique Seller ID',
      icon: ShareIcon,
      tone: 'green',
      action: 'share-seller-id',
    },
    {
      label: 'View Referrals',
      description: 'See all your referrals',
      target: 'referrals',
      icon: UsersIcon,
      tone: 'green',
      action: null,
    },
    {
      label: 'Request Withdrawal',
      description: 'Withdraw from wallet',
      target: 'wallet',
      icon: WalletIcon,
      tone: 'teal',
      action: 'request-withdrawal',
    },
  ]

  useEffect(() => {
    const container = servicesRef.current
    if (!container) return

    const handleScroll = () => {
      const max = container.scrollWidth - container.clientWidth
      if (max <= 0) {
        setServicePage(0)
        return
      }
      const progress = container.scrollLeft / max
      const index = Math.min(2, Math.max(0, Math.round(progress * 2)))
      setServicePage(index)
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [services.length])

  // Fetch target incentives on mount
  useEffect(() => {
    fetchTargetIncentives()
  }, [fetchTargetIncentives])

  return (
    <div className="seller-overview space-y-6">
      {/* Hero Card Section */}
      <section id="seller-overview-hero" className="seller-hero">
        <div className="seller-hero__card">
          <div className="seller-hero__meta">
            <span className="seller-chip seller-chip--success">
              Seller ID • {profile.sellerId}
            </span>
            <span className="seller-chip seller-chip--warn">Today {new Date().toLocaleDateString('en-GB')}</span>
          </div>
          <div className="seller-hero__core">
            <div className="seller-hero__identity">
              <span className="seller-hero__greeting">Your performance</span>
              <h2 className="seller-hero__welcome">{profile.name.split(' ')[0]}</h2>
            </div>
            <div className="seller-hero__badge">
              <SparkIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="seller-hero__balance">
            <div>
              <p className="seller-hero__label">Wallet Balance</p>
              <p className="seller-hero__value">{overview.walletBalance}</p>
            </div>
            <button type="button" onClick={() => onNavigate('wallet')} className="seller-hero__cta">
              View wallet
            </button>
          </div>
          <div className="seller-hero__stats">
            {[
              { label: 'Total Referrals', value: overview.totalReferrals.toString() },
              { label: 'Target Progress', value: `${overview.targetProgress}%` },
              { label: 'This Month Sales', value: overview.thisMonthSales },
              { label: 'Status', value: overview.status },
            ].map((item) => (
              <div key={item.label} className="seller-stat-card">
                <p>{item.label}</p>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shortcuts Section */}
      <section id="seller-overview-services" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Shortcuts</h3>
          </div>
        </div>
        <div ref={servicesRef} className="seller-services__rail">
          {services.map((service) => (
            <button
              key={service.label}
              type="button"
              onClick={() => {
                if (service.action) {
                  openPanel(service.action)
                } else if (service.target) {
                  onNavigate(service.target)
                }
              }}
              className="seller-service-card"
            >
              <span className={cn('seller-service-card__icon', service.tone === 'warn' ? 'is-warn' : 'is-success')}>
                <service.icon className="h-5 w-5" />
              </span>
              <span className="seller-service-card__label">{service.label}</span>
              <span className="seller-service-card__note">{service.note}</span>
            </button>
          ))}
        </div>
        <div className="seller-services__dots" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={cn('seller-services__dot', servicePage === dot && 'is-active')}
            />
          ))}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section id="seller-overview-activity" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Recent activity</h3>
          </div>
          <button
            type="button"
            className="seller-section__cta"
            onClick={() => {
              setRenderActivitySheet(true)
              requestAnimationFrame(() => setShowActivitySheet(true))
            }}
          >
            See all
          </button>
        </div>
        <div className="seller-activity__list">
          {sellerSnapshot.recentActivity.slice(0, 3).map((item) => (
            <div key={item.id} className="seller-activity__item">
              <div className="seller-activity__avatar">{item.avatar}</div>
              <div className="seller-activity__details">
                <div className="seller-activity__row">
                  <span className="seller-activity__name">{item.user}</span>
                  <span
                    className={cn(
                      'seller-activity__amount',
                      item.amount.startsWith('-') ? 'is-negative' : 'is-positive',
                    )}
                  >
                    {item.amount}
                  </span>
                </div>
                <div className="seller-activity__meta">
                  <span>{item.action}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity Sheet Modal */}
      {renderActivitySheet ? (
        <div className={cn('seller-activity-sheet', showActivitySheet && 'is-open')}>
          <div
            className={cn('seller-activity-sheet__overlay', showActivitySheet && 'is-open')}
            onClick={() => {
              setShowActivitySheet(false)
              setTimeout(() => setRenderActivitySheet(false), 260)
            }}
          />
          <div className={cn('seller-activity-sheet__panel', showActivitySheet && 'is-open')}>
            <div className="seller-activity-sheet__header">
              <h4>All activity</h4>
              <button
                type="button"
                onClick={() => {
                  setShowActivitySheet(false)
                  setTimeout(() => setRenderActivitySheet(false), 260)
                }}
              >
                Close
              </button>
            </div>
            <div className="seller-activity-sheet__body">
              {sellerSnapshot.recentActivity.map((item) => (
                <div key={item.id} className="seller-activity__item">
                  <div className="seller-activity__avatar">{item.avatar}</div>
                  <div className="seller-activity__details">
                    <div className="seller-activity__row">
                      <span className="seller-activity__name">{item.user}</span>
                      <span
                        className={cn(
                          'seller-activity__amount',
                          item.amount.startsWith('-') ? 'is-negative' : 'is-positive',
                        )}
                      >
                        {item.amount}
                      </span>
                    </div>
                    <div className="seller-activity__meta">
                      <span>{item.action}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Summary Section */}
      <section id="seller-overview-snapshot" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Quick summary</h3>
          </div>
        </div>
        <div className="seller-metric-grid">
          {sellerSnapshot.highlights.map((item) => (
            <div key={item.id} className="seller-metric-card">
              <div className="seller-metric-card__head">
                <p>{item.label}</p>
                <span>{item.trend}</span>
              </div>
              <h4>{item.value}</h4>
              <div className="seller-metric-card__bar">
                <span
                  style={{
                    width:
                      item.id === 'target'
                        ? `${overview.targetProgress}%`
                        : item.id === 'referrals'
                        ? '85%'
                        : item.id === 'sales'
                        ? '72%'
                        : '90%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Target Progress Section */}
      <section id="seller-target-progress" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Monthly Target</h3>
            <p className="seller-section__subtitle">Progress towards your goal</p>
          </div>
        </div>
        <div className="seller-target-card">
          <div className="seller-target-card__header">
            <div className="seller-target-card__info">
              <span className="seller-target-card__label">Target</span>
              <span className="seller-target-card__value">{overview.monthlyTarget}</span>
            </div>
            <div className="seller-target-card__info">
              <span className="seller-target-card__label">Achieved</span>
              <span className="seller-target-card__value">{overview.thisMonthSales}</span>
            </div>
          </div>
          <div className="seller-target-card__progress">
            <div className="seller-target-card__progress-bar">
              <span style={{ width: `${overview.targetProgress}%` }} />
            </div>
            <div className="seller-target-card__progress-text">
              <span>{overview.targetProgress}% Complete</span>
              <span>{overview.status}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Incentives Section */}
      {targetIncentives && targetIncentives.length > 0 && (
        <section id="seller-target-incentives" className="seller-section">
          <div className="seller-section__header">
            <div>
              <h3 className="seller-section__title">Target Incentives</h3>
              <p className="seller-section__subtitle">Rewards for achieving your targets</p>
            </div>
          </div>
          <div className="seller-incentives-list">
            {targetIncentives.map((incentive) => (
              <div key={incentive.id} className="seller-incentive-card">
                <div className="seller-incentive-card__icon">
                  <GiftIcon className="h-5 w-5" />
                </div>
                <div className="seller-incentive-card__content">
                  <h4 className="seller-incentive-card__title">{incentive.title}</h4>
                  <p className="seller-incentive-card__description">{incentive.description}</p>
                  <div className="seller-incentive-card__meta">
                    <span className="seller-incentive-card__amount">₹{incentive.amount?.toLocaleString('en-IN')}</span>
                    <span className="seller-incentive-card__date">
                      {incentive.achievedDate
                        ? `Achieved on ${new Date(incentive.achievedDate).toLocaleDateString('en-IN')}`
                        : 'Pending'}
                    </span>
                  </div>
                </div>
                {incentive.status === 'achieved' && (
                  <div className="seller-incentive-card__badge">
                    <SparkIcon className="h-4 w-4" />
                    Earned
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions Section */}
      <section id="seller-overview-quick-actions" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Quick actions</h3>
          </div>
        </div>
        <div className="seller-callout-grid">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                if (action.action) {
                  openPanel(action.action)
                } else if (action.target) {
                  onNavigate(action.target)
                }
              }}
              className={cn(
                'seller-callout',
                action.tone === 'orange'
                  ? 'is-warn'
                  : action.tone === 'teal'
                  ? 'is-teal'
                  : 'is-success',
              )}
            >
              <span className="seller-callout__icon">
                <action.icon className="h-5 w-5" />
              </span>
              <span className="seller-callout__label">{action.label}</span>
              <span className="seller-callout__note">{action.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

