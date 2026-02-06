import { useState, useEffect } from 'react'
import { useVendorApi } from '../../../hooks/useVendorApi'
import { GiftIcon, SparkIcon, CheckIcon, ChevronRightIcon, PackageIcon, ClockIcon, AlertCircleIcon } from '../../../components/icons'
import { cn } from '../../../../../lib/cn'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'
import { useToast } from '../../../../../components/ToastNotification'

export function VendorIncentivesView() {
    const { getIncentiveSchemes, getIncentiveHistory, claimReward } = useVendorApi()
    const [schemes, setSchemes] = useState([])
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [isClaiming, setIsClaiming] = useState(null) // ID of reward being claimed
    const [activeTab, setActiveTab] = useState('available') // 'available' or 'earned'
    const toast = useToast()

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

    const handleClaimReward = async (rewardId) => {
        setIsClaiming(rewardId)
        try {
            const result = await claimReward(rewardId, { notes: 'Claimed from vendor dashboard' })
            if (result.data) {
                toast.success('Reward claimed successfully!')
                loadData()
            } else {
                toast.error(result.error?.message || 'Failed to claim reward')
            }
        } catch (error) {
            toast.error('An error occurred while claiming the reward')
        } finally {
            setIsClaiming(null)
        }
    }

    const getSchemeStatusFlag = (schemeId) => {
        const relevant = history.filter(h =>
            (h.incentiveId?._id === schemeId || h.incentiveId === schemeId || h.incentiveSnapshot?.incentiveId === schemeId) &&
            h.status !== 'rejected'
        );

        // Logic requested by user:
        // If Eligible and approved by admin -> "claimed" 
        // Note: I'll also check if status is 'claimed'
        if (relevant.some(h => h.status === 'claimed' || h.status === 'approved')) {
            return { label: 'Claimed', color: 'bg-green-100 text-green-700 border-green-200' };
        }

        // If earned but pending approval
        if (relevant.some(h => h.status === 'pending_approval')) {
            return { label: 'Under Review', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        }

        // If not currently eligible -> "Pending"
        return { label: 'Pending', color: 'bg-gray-100 text-gray-500 border-gray-200' };
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
            pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Processing' },
            pending_approval: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Processing' },
            approved: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Approved (Ready)' },
            claimed: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Claimed' },
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
            {/* Vyapaar Hub Header - Sleeker transition */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 -mx-4 px-6 pt-8 pb-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transform scale-150">
                    <GiftIcon className="w-48 h-48" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/20">
                            <GiftIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight"><Trans>Reward Center</Trans></h1>
                            <p className="text-xs text-blue-100 font-medium tracking-wide uppercase opacity-80"><Trans>Vyapaar Growth Milestones</Trans></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Tab Switcher */}
            <div className="flex gap-2 p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-[24px] mx-2 -mt-6 relative z-20 shadow-xl border border-white">
                <button
                    onClick={() => setActiveTab('available')}
                    className={cn(
                        "flex-1 py-3.5 px-4 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-500",
                        activeTab === 'available'
                            ? "bg-white text-blue-800 shadow-[0_8px_16px_rgba(0,0,0,0.06)] transform scale-[1.02]"
                            : "text-gray-500 hover:text-gray-800"
                    )}
                >
                    <Trans>Live Schemes</Trans>
                </button>
                <button
                    onClick={() => setActiveTab('earned')}
                    className={cn(
                        "flex-1 py-3.5 px-4 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-500 relative",
                        activeTab === 'earned'
                            ? "bg-white text-blue-800 shadow-[0_8px_16px_rgba(0,0,0,0.06)] transform scale-[1.02]"
                            : "text-gray-500 hover:text-gray-800"
                    )}
                >
                    <Trans>Claim History</Trans>
                    {history.filter(h => h.status === 'approved').length > 0 && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-[10px] text-white items-center justify-center font-black">!</span>
                        </div>
                    )}
                </button>
            </div>

            {/* Live Schemes Tab */}
            {activeTab === 'available' && (
                <div className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {schemes.length === 0 ? (
                        <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-200">
                            <GiftIcon className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                            <h4 className="text-gray-900 font-bold"><Trans>No active programs</Trans></h4>
                            <p className="text-xs text-gray-500 mt-2 max-w-[200px] mx-auto"><Trans>We're brewing new rewards for you. Catch up soon!</Trans></p>
                        </div>
                    ) : (
                        schemes.map((scheme, index) => {
                            const RewardIcon = getRewardIcon(scheme.rewardType)
                            const status = getSchemeStatusFlag(scheme._id)
                            const isClaimed = status.label === 'Claimed'

                            return (
                                <div
                                    key={scheme._id || index}
                                    className={cn(
                                        "bg-white rounded-[32px] border-2 overflow-hidden transition-all duration-500 relative shadow-sm",
                                        isClaimed ? "border-gray-100 opacity-80" : "border-gray-50 hover:shadow-2xl hover:border-blue-100"
                                    )}
                                >
                                    {/* Status Flag - Requested Requirement */}
                                    <div className={cn(
                                        "absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border z-10",
                                        status.color
                                    )}>
                                        {status.label}
                                    </div>

                                    {/* Card Header */}
                                    <div className="p-6 pb-2">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={cn(
                                                "p-3 rounded-2xl shadow-inner",
                                                isClaimed ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-blue-600"
                                            )}>
                                                <RewardIcon className="h-7 w-7" />
                                            </div>
                                            <div className="flex-1 pr-20"> {/* Padding for the status flag */}
                                                <h3 className="font-extrabold text-gray-900 text-lg leading-tight mb-1">
                                                    <TransText>{scheme.title}</TransText>
                                                </h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                    {scheme.rewardType.replace(/_/g, ' ')} Milestone
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-6">
                                            <TransText>{scheme.description}</TransText>
                                        </p>
                                    </div>

                                    {/* Threshold Benchmarks */}
                                    <div className="mx-6 mb-6 p-5 rounded-[24px] bg-gray-50/50 border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Threshold</p>
                                            <p className="text-xl font-black text-gray-900">
                                                ₹{Number(scheme.minPurchaseAmount).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="h-10 w-px bg-gray-200 mx-2" />
                                        <div className="text-right">
                                            <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1.5">Benefit</p>
                                            <p className="text-xl font-black text-blue-700 italic">
                                                {formatRewardValue(scheme)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer Details */}
                                    <div className="px-6 py-4 bg-gray-50/30 flex items-center justify-between border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            {scheme.validUntil ? new Date(scheme.validUntil).toLocaleDateString() : 'Active'}
                                        </div>

                                        {isClaimed && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase">
                                                <CheckIcon className="w-4 h-4" />
                                                Verified Claim
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Claim History Tab - Where approved claims live */}
            {activeTab === 'earned' && (
                <div className="space-y-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {history.length === 0 ? (
                        <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-200 mt-4">
                            <SparkIcon className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                            <h4 className="text-gray-900 font-bold"><Trans>History Empty</Trans></h4>
                            <p className="text-xs text-gray-500 mt-2 max-w-[200px] mx-auto"><Trans>When you meet Vyapaar milestones, your claims will appear here for management.</Trans></p>
                        </div>
                    ) : (
                        history.map((reward, index) => {
                            const statusBadge = getStatusBadge(reward.status)
                            const canClaim = reward.status === 'approved'
                            const isAlreadyClaimed = reward.status === 'claimed'

                            return (
                                <div
                                    key={reward._id || index}
                                    className="bg-white rounded-[30px] border border-gray-100 p-6 shadow-xl shadow-gray-200/50 relative overflow-hidden group mb-4"
                                >
                                    {/* High-end accent */}
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-2.5",
                                        reward.status === 'claimed' ? 'bg-green-500' :
                                            reward.status === 'approved' ? 'bg-blue-600' :
                                                reward.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'
                                    )} />

                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h4 className="font-black text-gray-900 text-base uppercase tracking-tight mb-1">
                                                {reward.incentiveSnapshot?.title || reward.incentiveTitle || 'Milestone Reward'}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                <ClockIcon className="w-3.5 h-3.5" />
                                                Processed: {reward.updatedAt ? new Date(reward.updatedAt).toLocaleDateString() : 'Pending'}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest shadow-sm",
                                            statusBadge.color
                                        )}>
                                            {statusBadge.label}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50/80 rounded-[20px] p-5 flex items-center justify-between border border-gray-100/50 mb-6">
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Redemption Value</p>
                                            <p className="text-2xl font-black text-blue-900 italic">
                                                {reward.incentiveSnapshot?.rewardValue || reward.rewardValue || '---'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Purchase Ref</p>
                                            <p className="text-xs font-mono font-bold text-gray-700 bg-white border border-gray-100 px-3 py-1.5 rounded-lg">
                                                #{String(reward.purchaseOrderId || 'N/A').slice(-8).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Scenarios */}
                                    {canClaim && (
                                        <button
                                            onClick={() => handleClaimReward(reward._id)}
                                            disabled={isClaiming === reward._id}
                                            className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-[20px] text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            {isClaiming === reward._id ? (
                                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckIcon className="w-5 h-5" />
                                                    <Trans>Redeem Reward</Trans>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {isAlreadyClaimed && (
                                        <div className="w-full py-4 bg-green-50 text-green-700 border border-green-100 rounded-[20px] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                            <CheckIcon className="w-5 h-5 shadow-sm" />
                                            <Trans>Success: Redeemed</Trans>
                                        </div>
                                    )}

                                    {/* Admin Context */}
                                    {reward.adminNotes && (
                                        <div className="mt-5 p-4 bg-amber-50/50 border-l-4 border-amber-300 rounded-r-2xl">
                                            <div className="flex gap-2">
                                                <AlertCircleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                                                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                                                    <span className="font-black uppercase tracking-tighter mr-1">Admin Remark:</span>
                                                    {reward.adminNotes}
                                                </p>
                                            </div>
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

export default VendorIncentivesView
