import { useState, useMemo } from 'react'
import { sellerSnapshot } from '../../services/sellerData'
import { cn } from '../../../../lib/cn'
import { WalletIcon, TrendingUpIcon, TrendingDownIcon } from '../../components/icons'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'commission', label: 'Commission' },
  { id: 'withdrawal', label: 'Withdrawal' },
]

export function WalletView({ openPanel }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionDetail, setShowTransactionDetail] = useState(false)
  const wallet = sellerSnapshot.wallet

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') {
      return wallet.transactions
    }
    return wallet.transactions.filter((txn) => txn.type === activeFilter)
  }, [wallet.transactions, activeFilter])

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Just now'
      if (minutes < 60) return `${minutes}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getTransactionIcon = (type) => {
    return type === 'commission' ? (
      <TrendingUpIcon className="h-5 w-5" />
    ) : (
      <TrendingDownIcon className="h-5 w-5" />
    )
  }

  return (
    <div className="seller-wallet space-y-6">
      {/* Wallet Hero Card */}
      <section id="seller-wallet-hero" className="seller-wallet-hero">
        <div className="seller-wallet-hero__card">
          <div className="seller-wallet-hero__header">
            <div>
              <h2 className="seller-wallet-hero__title">Wallet</h2>
              <p className="seller-wallet-hero__subtitle">Your earnings & balance</p>
            </div>
            <div className="seller-wallet-hero__badge">
              <WalletIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="seller-wallet-hero__balance">
            <div>
              <p className="seller-wallet-hero__label">Available Balance</p>
              <p className="seller-wallet-hero__value">{wallet.balance}</p>
            </div>
            <button
              type="button"
              onClick={() => openPanel('request-withdrawal')}
              className="seller-wallet-hero__cta"
            >
              Withdraw
            </button>
          </div>
          <div className="seller-wallet-hero__stats">
            <div className="seller-wallet-stat">
              <p className="seller-wallet-stat__label">Pending</p>
              <span className="seller-wallet-stat__value">{wallet.pending}</span>
            </div>
            <div className="seller-wallet-stat">
              <p className="seller-wallet-stat__label">Total Earned</p>
              <span className="seller-wallet-stat__value">{wallet.totalEarned}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section id="seller-wallet-filters" className="seller-section">
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

      {/* Transactions List */}
      <section id="seller-wallet-transactions" className="seller-section">
        <div className="seller-section__header">
          <div>
            <h3 className="seller-section__title">Transaction History</h3>
            <p className="seller-section__subtitle">{filteredTransactions.length} transactions</p>
          </div>
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="seller-wallet-empty">
            <WalletIcon className="seller-wallet-empty__icon" />
            <p className="seller-wallet-empty__text">No transactions found</p>
            <p className="seller-wallet-empty__subtext">
              {activeFilter === 'all'
                ? 'Your transaction history will appear here'
                : `No ${activeFilter} transactions yet`}
            </p>
          </div>
        ) : (
          <div className="seller-wallet-transactions">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="seller-transaction-card"
                onClick={() => {
                  setSelectedTransaction(transaction)
                  setShowTransactionDetail(true)
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="seller-transaction-card__icon">
                  <div
                    className={cn(
                      'seller-transaction-icon',
                      transaction.type === 'commission' ? 'is-credit' : 'is-debit',
                    )}
                  >
                    {getTransactionIcon(transaction.type)}
                  </div>
                </div>
                <div className="seller-transaction-card__info">
                  <div className="seller-transaction-card__row">
                    <h4 className="seller-transaction-card__description">{transaction.description}</h4>
                    <span
                      className={cn(
                        'seller-transaction-card__amount',
                        transaction.amount.startsWith('+') ? 'is-credit' : 'is-debit',
                      )}
                    >
                      {transaction.amount}
                    </span>
                  </div>
                  <div className="seller-transaction-card__meta">
                    <span
                      className={cn(
                        'seller-transaction-card__type',
                        transaction.type === 'commission' ? 'is-commission' : 'is-withdrawal',
                      )}
                    >
                      {transaction.type === 'commission' ? 'Commission' : 'Withdrawal'}
                    </span>
                    <span className="seller-transaction-card__date">{formatDate(transaction.date)}</span>
                    <span
                      className={cn(
                        'seller-transaction-card__status',
                        transaction.status === 'Completed' ? 'is-completed' : 'is-pending',
                      )}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transaction Detail Sheet */}
      {selectedTransaction && showTransactionDetail && (
        <div className={cn('seller-activity-sheet', showTransactionDetail && 'is-open')}>
          <div
            className={cn('seller-activity-sheet__overlay', showTransactionDetail && 'is-open')}
            onClick={() => {
              setShowTransactionDetail(false)
              setTimeout(() => setSelectedTransaction(null), 260)
            }}
          />
          <div className={cn('seller-activity-sheet__panel', showTransactionDetail && 'is-open')}>
            <div className="seller-activity-sheet__header">
              <h4>Transaction Details</h4>
              <button
                type="button"
                onClick={() => {
                  setShowTransactionDetail(false)
                  setTimeout(() => setSelectedTransaction(null), 260)
                }}
              >
                Close
              </button>
            </div>
            <div className="seller-activity-sheet__body">
              <div className="seller-transaction-detail">
                <div className="seller-transaction-detail__header">
                  <div
                    className={cn(
                      'seller-transaction-icon',
                      selectedTransaction.type === 'commission' ? 'is-credit' : 'is-debit',
                    )}
                  >
                    {getTransactionIcon(selectedTransaction.type)}
                  </div>
                  <div className="seller-transaction-detail__info">
                    <h3 className="seller-transaction-detail__description">
                      {selectedTransaction.description}
                    </h3>
                    <span
                      className={cn(
                        'seller-transaction-detail__amount',
                        selectedTransaction.amount.startsWith('+') ? 'is-credit' : 'is-debit',
                      )}
                    >
                      {selectedTransaction.amount}
                    </span>
                  </div>
                </div>
                <div className="seller-transaction-detail__meta">
                  <div className="seller-transaction-detail__meta-item">
                    <span className="seller-transaction-detail__meta-label">Type</span>
                    <span
                      className={cn(
                        'seller-transaction-card__type',
                        selectedTransaction.type === 'commission' ? 'is-commission' : 'is-withdrawal',
                      )}
                    >
                      {selectedTransaction.type === 'commission' ? 'Commission' : 'Withdrawal'}
                    </span>
                  </div>
                  <div className="seller-transaction-detail__meta-item">
                    <span className="seller-transaction-detail__meta-label">Status</span>
                    <span
                      className={cn(
                        'seller-transaction-card__status',
                        selectedTransaction.status === 'Completed' ? 'is-completed' : 'is-pending',
                      )}
                    >
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <div className="seller-transaction-detail__meta-item">
                    <span className="seller-transaction-detail__meta-label">Date</span>
                    <span className="seller-transaction-detail__meta-value">
                      {formatDate(selectedTransaction.date)}
                    </span>
                  </div>
                  <div className="seller-transaction-detail__meta-item">
                    <span className="seller-transaction-detail__meta-label">Transaction ID</span>
                    <span className="seller-transaction-detail__meta-value">{selectedTransaction.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <section id="seller-wallet-actions" className="seller-section">
        <div className="seller-wallet-actions">
          <button
            type="button"
            onClick={() => openPanel('request-withdrawal')}
            className="seller-wallet-action seller-wallet-action--primary"
          >
            <WalletIcon className="h-5 w-5" />
            Request Withdrawal
          </button>
          <button
            type="button"
            onClick={() => openPanel('view-performance')}
            className="seller-wallet-action seller-wallet-action--secondary"
          >
            <TrendingUpIcon className="h-5 w-5" />
            View Earnings
          </button>
        </div>
      </section>
    </div>
  )
}

