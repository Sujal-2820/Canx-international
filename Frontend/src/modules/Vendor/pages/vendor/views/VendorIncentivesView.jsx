import { useState, useEffect } from 'react'
import { useVendorApi } from '../../../hooks/useVendorApi'
import { GiftIcon, SparkIcon, CheckIcon, ChevronRightIcon, PackageIcon } from '../../../components/icons'
import { cn } from '../../../../../lib/cn'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'

export function VendorIncentivesView() {
    const { getIncentiveSchemes, getIncentiveHistory } = useVendorApi()
    const [schemes, setSchemes] = useState([])
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('available') // 'available' or 'earned'

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [schemesResult, historyResult] = await Promise.all([
                getIncentiveSchemes(),
                getIncentiveHistory({})
            ])

            if (schemesResult.data) {
                setSchemes(Array.isArray(schemesResult.data) ? schemesResult.data : [])
            }

            if (historyResult.data) {
                setHistory(Array.isArray(historyResult.data) ? historyResult.data : [])
            }
        } catch (error) {
            console.error('Error loading incentive data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getRewardIcon = (rewardType) => {
        switch (rewardType) {
            case 'voucher':
            case 'cashback':
                return GiftIcon
            case 'gym_membership':
            case 'training_sessions':
                return SparkIcon
            case 'smartwatch':
            case 'gym_equipment':
                return SparkIcon
            default:
                return PackageIcon
        }
    }

    const getRewardBadgeColor = (rewardType) => {
        switch (rewardType) {
            case 'cashback':
            case 'bonus_credit':
                return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'voucher':
                return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'gym_membership':
            case 'training_sessions':
                return 'bg-purple-50 text-purple-700 border-purple-200'
            case 'smartwatch':
            case 'gym_equipment':
                return 'bg-orange-50 text-orange-700 border-orange-200'
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const formatRewardType = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatRewardValue = (scheme) => {
        if (scheme.rewardUnit === 'percentage') {
            return `${scheme.rewardValue}% Discount`
        } else if (scheme.rewardUnit === 'fixed_amount') {
            return `₹${Number(scheme.rewardValue).toLocaleString('en-IN')}`
        } else {
            return scheme.rewardValue
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending Approval' },
            pending_approval: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending Approval' },
            approved: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Approved' },
            claimed: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Claimed' },
            rejected: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' }
        }
        return badges[status] || badges.pending
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="pb-24 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 -mx-4 px-4 py-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <GiftIcon className="h-8 w-8" />
                    <div>
                        <h1 className="text-xl font-bold"><Trans>Incentives & Rewards</Trans></h1>
                        <p className="text-sm opacity-90"><Trans>Unlock rewards with every milestone</Trans></p>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                    onClick={() => setActiveTab('available')}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
                        activeTab === 'available'
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    )}
                >
                    <Trans>Available Schemes</Trans> ({schemes.length})
                </button>
                <button
                    onClick={() => setActiveTab('earned')}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
                        activeTab === 'earned'
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    )}
                >
                    <Trans>My Rewards</Trans> ({history.length})
                </button>
            </div>

            {/* Available Schemes Tab */}
            {activeTab === 'available' && (
                <div className="space-y-4">
                    {schemes.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center">
                            <GiftIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600 font-medium"><Trans>No active incentive schemes at the moment</Trans></p>
                            <p className="text-xs text-gray-500 mt-1"><Trans>Check back soon for new rewards!</Trans></p>
                        </div>
                    ) : (
                        schemes.map((scheme, index) => {
                            const RewardIcon = getRewardIcon(scheme.rewardType)
                            return (
                                <div
                                    key={scheme._id || index}
                                    className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-blue-200 transition-all"
                                >
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-4 border-b border-gray-100">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-base mb-1">
                                                    <TransText>{scheme.title}</TransText>
                                                </h3>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    <TransText>{scheme.description}</TransText>
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <RewardIcon className="h-8 w-8 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-4 space-y-3">
                                        {/* Reward Type Badge */}
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wide",
                                                getRewardBadgeColor(scheme.rewardType)
                                            )}>
                                                {formatRewardType(scheme.rewardType)}
                                            </span>
                                        </div>

                                        {/* Threshold & Reward */}
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] text-blue-700 font-medium uppercase tracking-wide mb-1">
                                                        <Trans>Order Value Required</Trans>
                                                    </p>
                                                    <p className="text-2xl font-black text-blue-800">
                                                        ₹{Number(scheme.minPurchaseAmount).toLocaleString('en-IN')}
                                                        {scheme.maxPurchaseAmount && (
                                                            <span className="text-sm font-normal text-blue-600 ml-1">
                                                                - ₹{Number(scheme.maxPurchaseAmount).toLocaleString('en-IN')}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-blue-700 font-medium uppercase tracking-wide mb-1">
                                                        <Trans>You'll Receive</Trans>
                                                    </p>
                                                    <p className="text-xl font-black text-blue-800">
                                                        {formatRewardValue(scheme)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conditions */}
                                        {scheme.conditions && (
                                            <div className="space-y-2">
                                                {scheme.conditions.orderFrequency && scheme.conditions.orderFrequency !== 'any' && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <SparkIcon className="h-4 w-4 text-blue-500" />
                                                        <span className="font-medium">
                                                            {scheme.conditions.orderFrequency === 'first_order' && <Trans>First Order Only</Trans>}
                                                            {scheme.conditions.orderFrequency === 'milestone' && <Trans>Milestone Reward</Trans>}
                                                            {scheme.conditions.orderFrequency === 'recurring' && <Trans>Recurring Benefit</Trans>}
                                                        </span>
                                                    </div>
                                                )}
                                                {scheme.conditions.minOrderCount > 1 && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <CheckIcon className="h-4 w-4 text-blue-500" />
                                                        <span><Trans>Minimum {scheme.conditions.minOrderCount} orders required</Trans></span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Validity */}
                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>
                                                    <Trans>Valid until</Trans>:{' '}
                                                    {scheme.validUntil
                                                        ? new Date(scheme.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : 'Ongoing'}
                                                </span>
                                            </div>
                                            {scheme.maxRedemptionsPerVendor > 1 && (
                                                <span className="font-medium">
                                                    <Trans>Max {scheme.maxRedemptionsPerVendor}x per vendor</Trans>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Earned Rewards Tab */}
            {activeTab === 'earned' && (
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center">
                            <SparkIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600 font-medium"><Trans>No rewards earned yet</Trans></p>
                            <p className="text-xs text-gray-500 mt-1"><Trans>Place qualifying orders to unlock incentives!</Trans></p>
                        </div>
                    ) : (
                        history.map((reward, index) => {
                            const statusBadge = getStatusBadge(reward.status)
                            return (
                                <div
                                    key={reward._id || index}
                                    className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">
                                                {reward.incentiveSnapshot?.title || reward.incentiveTitle || 'Reward'}
                                            </h4>
                                            <p className="text-xs text-gray-600">
                                                <Trans>Earned on</Trans>: {reward.earnedAt || reward.createdAt ? new Date(reward.earnedAt || reward.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide",
                                            statusBadge.color
                                        )}>
                                            {statusBadge.label}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-700 font-medium">
                                            <Trans>Reward Value</Trans>:{' '}
                                            <span className="text-blue-700 font-bold">
                                                {reward.incentiveSnapshot?.rewardValue || reward.rewardValue || 'Contact Admin'}
                                            </span>
                                        </p>
                                        {reward.purchaseOrderId && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                <Trans>Order</Trans>: #{String(reward.purchaseOrderId).slice(-8)}
                                            </p>
                                        )}
                                    </div>

                                    {reward.adminNotes && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                            <p className="text-xs text-blue-900">
                                                <span className="font-semibold"><Trans>Admin Note</Trans>:</span> {reward.adminNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
