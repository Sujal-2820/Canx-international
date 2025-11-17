import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/cn'
import { BellIcon } from './icons'
import { CloseIcon } from './icons'

export function NotificationsDropdown({ isOpen, onClose, notifications = [] }) {
  const dropdownRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const formatTime = (dateString) => {
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
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  if (!mounted) return null

  return (
    <div
      ref={dropdownRef}
      className={cn('seller-notifications-dropdown', isOpen && 'seller-notifications-dropdown--open')}
    >
      <div className="seller-notifications-dropdown__header">
        <div className="seller-notifications-dropdown__header-content">
          <h3 className="seller-notifications-dropdown__title">Notifications</h3>
          {unreadCount > 0 && <span className="seller-notifications-dropdown__badge">{unreadCount}</span>}
        </div>
        <div className="seller-notifications-dropdown__header-actions">
          <button
            type="button"
            className="seller-notifications-dropdown__close"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="seller-notifications-dropdown__body">
        {notifications.length === 0 ? (
          <div className="seller-notifications-dropdown__empty">
            <BellIcon className="seller-notifications-dropdown__empty-icon" />
            <p className="seller-notifications-dropdown__empty-text">No notifications yet</p>
            <p className="seller-notifications-dropdown__empty-subtext">We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="seller-notifications-dropdown__list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn('seller-notification-item', !notification.read && 'seller-notification-item--unread')}
              >
                <div className="seller-notification-item__indicator" />
                <div className="seller-notification-item__content">
                  <h4 className="seller-notification-item__title">{notification.title || 'Notification'}</h4>
                  {notification.message && (
                    <p className="seller-notification-item__message">{notification.message}</p>
                  )}
                  <span className="seller-notification-item__time">
                    {notification.date ? formatTime(notification.date) : 'Recently'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

