import { useMemo } from 'react'
import { ClockIcon, AlertTriangleIcon, CheckCircleIcon, GiftIcon, BellIcon } from '../../../components/shared/catalog'
import { cn } from '../../../lib/cn'
import { Trans } from '../../../components/Trans'

/**
 * CreditNotificationCard
 * 
 * Displays credit-related notifications with appropriate styling and icons
 * Used in the notification panel and credit dashboard
 */
export function CreditNotificationCard({ notification, onRead, onDismiss, compact = false }) {
    const { type, title, message, priority, read, metadata, createdAt } = notification

    // Determine icon and color based on type and priority
    const notificationStyle = useMemo(() => {
        const baseStyles = {
            icon: BellIcon,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-900'
        }

        if (type === 'repayment_overdue_alert') {
            return {
                icon: AlertTriangleIcon,
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                iconColor: 'text-red-600',
                textColor: 'text-red-900'
            }
        }

        if (type === 'repayment_due_reminder') {
            if (priority === 'urgent') {
                return {
                    icon: ClockIcon,
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    iconColor: 'text-orange-600',
                    textColor: 'text-orange-900'
                }
            }
            return {
                icon: ClockIcon,
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
                iconColor: 'text-amber-600',
                textColor: 'text-amber-900'
            }
        }

        if (type === 'repayment_success') {
            return {
                icon: CheckCircleIcon,
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                iconColor: 'text-blue-600',
                textColor: 'text-blue-900'
            }
        }

        if (type === 'admin_announcement') {
            return {
                icon: GiftIcon,
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                iconColor: 'text-purple-600',
                textColor: 'text-purple-900'
            }
        }

        return baseStyles
    }, [type, priority])

    const Icon = notificationStyle.icon

    // Format time ago
    const timeAgo = useMemo(() => {
        const now = new Date()
        const created = new Date(createdAt)
        const diffMs = now - created
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}d ago`
    }, [createdAt])

    const handleClick = () => {
        if (!read && onRead) {
            onRead(notification._id || notification.id)
        }
    }

    if (compact) {
        return (
            <div
                onClick={handleClick}
                className={cn(
                    'p-3 rounded-lg border-l-4 cursor-pointer transition-all',
                    notificationStyle.bgColor,
                    notificationStyle.borderColor,
                    read ? 'opacity-60' : 'opacity-100'
                )}
            >
                <div className="flex items-start gap-2">
                    <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', notificationStyle.iconColor)} />
                    <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-semibold line-clamp-1', notificationStyle.textColor)}>
                            {title}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">{message}</p>
                    </div>
                    {!read && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={handleClick}
            className={cn(
                'p-4 rounded-xl border-2 transition-all cursor-pointer',
                notificationStyle.bgColor,
                notificationStyle.borderColor,
                read ? 'opacity-70' : 'opacity-100 shadow-sm'
            )}
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
                <div className={cn(
                    'p-2 rounded-lg',
                    read ? 'bg-white/50' : 'bg-white',
                    notificationStyle.iconColor
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={cn('text-sm font-bold', notificationStyle.textColor)}>
                            {title}
                        </h4>
                        {!read && (
                            <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                <span className="text-[9px] font-bold uppercase"><Trans>New</Trans></span>
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo}</p>
                </div>
            </div>

            {/* Message */}
            <p className="text-xs text-gray-700 leading-relaxed mb-3">
                {message}
            </p>

            {/* Metadata (if available) */}
            {metadata && Object.keys(metadata).length > 0 && (
                <div className="space-y-1.5 mb-3">
                    {metadata.purchaseAmount && (
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-600"><Trans>Purchase Amount</Trans>:</span>
                            <span className="font-bold text-gray-900">
                                ₹{metadata.purchaseAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                    {metadata.currentPayable && (
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-600"><Trans>Current Payable</Trans>:</span>
                            <span className="font-bold text-gray-900">
                                ₹{metadata.currentPayable.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                    {metadata.savings > 0 && (
                        <div className="flex justify-between text-[11px]">
                            <span className="text-blue-600"><Trans>Potential Savings</Trans>:</span>
                            <span className="font-bold text-blue-700">
                                ₹{metadata.savings.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                    {metadata.penalty > 0 && (
                        <div className="flex justify-between text-[11px]">
                            <span className="text-red-600"><Trans>Interest Applied</Trans>:</span>
                            <span className="font-bold text-red-700">
                                ₹{metadata.penalty.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                    {metadata.daysElapsed !== undefined && (
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-600"><Trans>Days Since Purchase</Trans>:</span>
                            <span className="font-bold text-gray-900">{metadata.daysElapsed} days</span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            {onDismiss && (
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDismiss(notification._id || notification.id)
                        }}
                        className="flex-1 py-2 text-xs font-semibold text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <Trans>Dismiss</Trans>
                    </button>
                    {type.includes('repayment') && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                // Navigate to credit/repayment section
                                window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'credit' }))
                            }}
                            className={cn(
                                'flex-1 py-2 text-xs font-bold text-white rounded-lg transition-colors',
                                priority === 'urgent' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                            )}
                        >
                            <Trans>View Repayment</Trans>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * CreditNotificationBadge
 * 
 * Small badge showing count of unread credit notifications
 */
export function CreditNotificationBadge({ count }) {
    if (!count || count === 0) return null

    return (
        <div className="relative inline-flex">
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
                {count > 9 ? '9+' : count}
            </div>
        </div>
    )
}
