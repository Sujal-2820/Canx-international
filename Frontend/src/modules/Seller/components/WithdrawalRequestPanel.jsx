import { useState } from 'react'
import { sellerSnapshot } from '../services/sellerData'
import { cn } from '../../../lib/cn'
import { WalletIcon, CloseIcon } from './icons'

export function WithdrawalRequestPanel({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const wallet = sellerSnapshot.wallet
  const availableBalance = parseFloat(wallet.balance.replace(/[₹,\s]/g, '')) || 0
  const minWithdrawal = 5000

  const validateForm = () => {
    const newErrors = {}

    if (!amount || parseFloat(amount) < minWithdrawal) {
      newErrors.amount = `Minimum withdrawal amount is ₹${minWithdrawal.toLocaleString('en-IN')}`
    } else if (parseFloat(amount) > availableBalance) {
      newErrors.amount = 'Amount exceeds available balance'
    }

    if (!accountNumber || accountNumber.length < 9) {
      newErrors.accountNumber = 'Valid account number is required'
    }

    if (!ifscCode || ifscCode.length !== 11) {
      newErrors.ifscCode = 'Valid IFSC code is required (11 characters)'
    }

    if (!accountName || accountName.length < 3) {
      newErrors.accountName = 'Account holder name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      onSuccess?.({
        amount: parseFloat(amount),
        accountNumber,
        ifscCode,
        accountName,
      })
      onClose()
    }, 1500)
  }

  const handleAmountChange = (value) => {
    const numValue = value.replace(/[^0-9.]/g, '')
    setAmount(numValue)
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: null }))
    }
  }

  if (!isOpen) return null

  return (
    <div className={cn('seller-panel', isOpen && 'is-open')}>
      <div className={cn('seller-panel__overlay', isOpen && 'is-open')} onClick={onClose} />
      <div className={cn('seller-panel__content', isOpen && 'is-open')}>
        <div className="seller-panel__header">
          <div className="seller-panel__header-content">
            <div className="seller-panel__icon">
              <WalletIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="seller-panel__title">Request Withdrawal</h3>
              <p className="seller-panel__subtitle">Transfer funds to your bank account</p>
            </div>
          </div>
          <button type="button" className="seller-panel__close" onClick={onClose} aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="seller-panel__body">
          <div className="seller-panel__balance-info">
            <div className="seller-panel__balance-item">
              <span className="seller-panel__balance-label">Available Balance</span>
              <span className="seller-panel__balance-value">{wallet.balance}</span>
            </div>
            <div className="seller-panel__balance-item">
              <span className="seller-panel__balance-label">Minimum Withdrawal</span>
              <span className="seller-panel__balance-value">₹{minWithdrawal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="seller-panel__field">
            <label className="seller-panel__label">
              Withdrawal Amount <span className="seller-panel__required">*</span>
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount"
              className={cn('seller-panel__input', errors.amount && 'is-error')}
            />
            {errors.amount && <span className="seller-panel__error">{errors.amount}</span>}
            {amount && !errors.amount && (
              <span className="seller-panel__hint">
                You will receive ₹{parseFloat(amount || 0).toLocaleString('en-IN')} in your bank account
              </span>
            )}
          </div>

          <div className="seller-panel__field">
            <label className="seller-panel__label">
              Account Holder Name <span className="seller-panel__required">*</span>
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value)
                if (errors.accountName) {
                  setErrors((prev) => ({ ...prev, accountName: null }))
                }
              }}
              placeholder="Enter account holder name"
              className={cn('seller-panel__input', errors.accountName && 'is-error')}
            />
            {errors.accountName && <span className="seller-panel__error">{errors.accountName}</span>}
          </div>

          <div className="seller-panel__field">
            <label className="seller-panel__label">
              Account Number <span className="seller-panel__required">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ''))
                if (errors.accountNumber) {
                  setErrors((prev) => ({ ...prev, accountNumber: null }))
                }
              }}
              placeholder="Enter account number"
              maxLength={18}
              className={cn('seller-panel__input', errors.accountNumber && 'is-error')}
            />
            {errors.accountNumber && <span className="seller-panel__error">{errors.accountNumber}</span>}
          </div>

          <div className="seller-panel__field">
            <label className="seller-panel__label">
              IFSC Code <span className="seller-panel__required">*</span>
            </label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => {
                setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                if (errors.ifscCode) {
                  setErrors((prev) => ({ ...prev, ifscCode: null }))
                }
              }}
              placeholder="Enter IFSC code"
              maxLength={11}
              className={cn('seller-panel__input', errors.ifscCode && 'is-error')}
            />
            {errors.ifscCode && <span className="seller-panel__error">{errors.ifscCode}</span>}
          </div>

          <div className="seller-panel__info-box">
            <p className="seller-panel__info-text">
              <strong>Note:</strong> Withdrawal requests are processed within 24-48 hours. You will receive a
              confirmation once the transfer is initiated.
            </p>
          </div>

          <div className="seller-panel__actions">
            <button type="button" onClick={onClose} className="seller-panel__button seller-panel__button--secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="seller-panel__button seller-panel__button--primary"
            >
              {isSubmitting ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

