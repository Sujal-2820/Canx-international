import { useState, useEffect, useCallback, useMemo } from 'react'
import { useVendorState, useVendorDispatch } from '../../../context/VendorContext'
import { useVendorApi } from '../../../hooks/useVendorApi'
import {
    GiftIcon,
    SparkIcon,
    CheckIcon,
    ChevronRightIcon,
    PackageIcon,
    CreditIcon,
    ReportIcon,
    ClockIcon,
    TrendingUpIcon,
    AwardIcon,
    AlertCircleIcon
} from '../../../components/icons'
import { cn } from '../../../../../lib/cn'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'
import CreditSummaryWidget from '../../../components/CreditSummaryWidget'
import RepaymentCalculator from '../../../components/RepaymentCalculator'
import * as vendorApi from '../../../services/vendorApi'

export function VendorVyapaarView() {
    const { dashboard } = useVendorState()
    const dispatch = useVendorDispatch()
    const {
        getCreditSummary,
        getPendingPurchases,
        calculateRepaymentAmount,
        getRepaymentProjection,
        submitRepayment,
        getIncentiveSchemes,
        getIncentiveHistory,
        claimReward,
        getRepaymentHistory
    } = useVendorApi()

    // State for tabs
    const [mainTab, setMainTab] = useState('credit') // 'credit' or 'incentives'
    const [incentiveTab, setIncentiveTab] = useState('schemes') // 'schemes' or 'eligible'

    // Data state
    const [repaymentHistory, setRepaymentHistory] = useState([])
    const [creditSummary, setCreditSummary] = useState(null)
    const [pendingPurchases, setPendingPurchases] = useState([])
    const [incentiveSchemes, setIncentiveSchemes] = useState([])
    const [incentiveHistory, setIncentiveHistory] = useState([])
    // Loading states
    const [loading, setLoading] = useState(true)
    const [repaymentRefreshKey, setRepaymentRefreshKey] = useState(0)

    // Load data
    const loadAllData = useCallback(async () => {
        setLoading(true)
        try {
            const [
                creditSummaryRes,
                pendingPurchasesRes,
                schemesRes,
                historyRes,
                repaymentHistoryRes
            ] = await Promise.all([
                getCreditSummary(),
                getPendingPurchases(),
                getIncentiveSchemes(),
                getIncentiveHistory({}),
                getRepaymentHistory({ page: 1, limit: 10 })
            ])

            if (creditSummaryRes.data) {
                setCreditSummary(creditSummaryRes.data)
            }
            if (pendingPurchasesRes.data?.purchases) {
                setPendingPurchases(pendingPurchasesRes.data.purchases)
            }
            if (schemesRes.data) {
                setIncentiveSchemes(Array.isArray(schemesRes.data) ? schemesRes.data : [])
            }
            if (historyRes.data) {
                setIncentiveHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
            }
            if (repaymentHistoryRes.data?.repayments) {
                setRepaymentHistory(repaymentHistoryRes.data.repayments)
            }
        } catch (error) {
            console.error('Error loading Vyapaar data:', error)
        } finally {
            setLoading(false)
        }
    }, [getCreditSummary, getPendingPurchases, getIncentiveSchemes, getIncentiveHistory, getRepaymentHistory])

    useEffect(() => {
        loadAllData()
    }, [loadAllData, repaymentRefreshKey])

    // Filter incentive history for eligible but unclaimed rewards (status: approved)
    const eligibleRewards = useMemo(() => {
        return (incentiveHistory || []).filter(h => h.status === 'approved')
    }, [incentiveHistory])

    // Claim reward handler
    const handleClaimReward = async (claimId) => {
        try {
            const result = await claimReward(claimId, { notes: 'Claimed by vendor via dashboard' })
            if (result.success) {
                // Refresh data
                setRepaymentRefreshKey(prev => prev + 1)
            }
        } catch (error) {
            console.error('Error claiming reward:', error)
        }
    }

    const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`

    if (loading && !creditSummary && incentiveSchemes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-400 text-sm font-medium animate-pulse"><Trans>Loading Vyapaar Hub...</Trans></p>
            </div>
        )
    }

    return (
        <div className="vyapaar-container pb-24 -mt-2 -mx-3">
            {/* Header Area */}
            <div className="px-2 pt-6 pb-6 space-y-1">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
                    <h1 className="text-2xl tracking-tight text-gray-900"><Trans>Vyapaar Hub</Trans></h1>
                </div>
                <p className="text-xs text-gray-500"><Trans>Global business capital and growth management</Trans></p>
            </div>

            {/* Sticky Main Tabs - Consistent with Dashboard */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-y border-gray-100 px-2">
                <div className="flex gap-4">
                    <button
                        onClick={() => setMainTab('credit')}
                        className={cn(
                            "py-4 text-sm transition-all relative",
                            mainTab === 'credit' ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Trans>Wholesale Credit</Trans>
                        {mainTab === 'credit' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></span>}
                    </button>
                    <button
                        onClick={() => setMainTab('incentives')}
                        className={cn(
                            "py-4 text-sm transition-all relative flex items-center gap-2",
                            mainTab === 'incentives' ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Trans>Incentives</Trans>
                        {eligibleRewards.length > 0 && (
                            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                        )}
                        {mainTab === 'incentives' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></span>}
                    </button>
                </div>
            </div>

            <div className="px-2 mt-6">
                {/* TAB 1: CREDIT & WALLET */}
                {mainTab === 'credit' && (
                    <div className="space-y-10 animate-in fade-in duration-500 pb-12">


                        {/* CAPITAL & DUES SECTION */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                                    <Trans>Capital Management</Trans>
                                </h2>
                                <div className="h-px flex-1 bg-gray-100 ml-4"></div>
                            </div>

                            {/* Summary Widget */}
                            <CreditSummaryWidget
                                creditData={creditSummary}
                                onNavigateToCalculator={() => {
                                    const el = document.getElementById('repayment-section')
                                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                                }}
                            />

                            {/* Repayment Action Section */}
                            <div id="repayment-section" className="scroll-mt-24">
                                <RepaymentCalculator
                                    vendorApi={{
                                        getPendingPurchases: async () => ({ data: { purchases: pendingPurchases } }),
                                        calculateRepayment: calculateRepaymentAmount,
                                        getRepaymentProjection,
                                        submitRepayment,
                                        initiateRepayment: vendorApi.initiateRepayment
                                    }}
                                    onSuccess={() => {
                                        setRepaymentRefreshKey(prev => prev + 1)
                                    }}
                                />
                            </div>
                        </div>

                        {/* LEDGER SECTION */}
                        <div className="space-y-4">
                            <h2 className="text-xs text-gray-400 uppercase tracking-widest px-1">
                                <Trans>Recent Ledger</Trans>
                            </h2>

                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
                                {repaymentHistory.length === 0 ? (
                                    <div className="p-12 text-center text-gray-300">
                                        <ReportIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-xs"><Trans>No transactions found</Trans></p>
                                    </div>
                                ) : (
                                    repaymentHistory.map((item) => (
                                        <div key={item._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <TrendingUpIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-900">{formatCurrency(item.amount)}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                                        {new Date(item.paymentDate || item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-2 py-0.5 rounded bg-blue-50 text-[9px] text-blue-700 border border-blue-100 uppercase tracking-widest">
                                                    <Trans>Settled</Trans>
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: INCENTIVES */}
                {mainTab === 'incentives' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Minimalist Sub-navigation */}
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            <button
                                onClick={() => setIncentiveTab('schemes')}
                                className={cn(
                                    "flex-1 py-2.5 text-xs font-bold transition-all rounded-lg",
                                    incentiveTab === 'schemes' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                <Trans>Live Schemes</Trans>
                            </button>
                            <button
                                onClick={() => setIncentiveTab('eligible')}
                                className={cn(
                                    "flex-1 py-2.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2",
                                    incentiveTab === 'eligible' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                <Trans>Eligible Rewards</Trans>
                                {eligibleRewards.length > 0 && (
                                    <span className="h-5 min-w-[1.25rem] px-1 rounded-full flex items-center justify-center text-[10px] font-bold bg-orange-500 text-white">
                                        {eligibleRewards.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Sub Tab Content Area */}
                        <div className="space-y-4">
                            {incentiveTab === 'schemes' && (
                                <div className="space-y-4">
                                    {incentiveSchemes.length === 0 ? (
                                        <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                            <PackageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm text-gray-400 font-medium"><Trans>No active schemes</Trans></p>
                                        </div>
                                    ) : (
                                        incentiveSchemes.map((scheme) => (
                                            <div key={scheme._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:border-blue-200 transition-all group">
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">
                                                                    {scheme.rewardType?.replace(/_/g, ' ').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-lg font-bold text-gray-900">
                                                                <TransText>{scheme.title}</TransText>
                                                            </h3>
                                                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                                <TransText>{scheme.description}</TransText>
                                                            </p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                            {scheme.rewardType === 'voucher' ? <SparkIcon className="h-6 w-6" /> : <GiftIcon className="h-6 w-6" />}
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 grid grid-cols-2 gap-4 border-t border-gray-50">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"><Trans>Threshold</Trans></p>
                                                            <p className="text-base font-bold text-gray-900">₹{scheme.minPurchaseAmount?.toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div className="text-right space-y-1">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"><Trans>Benefit</Trans></p>
                                                            <p className="text-base font-bold text-blue-600">
                                                                {scheme.rewardUnit === 'percentage' ? `${scheme.rewardValue}% OFF` :
                                                                    scheme.rewardUnit === 'fixed_amount' ? `₹${scheme.rewardValue.toLocaleString('en-IN')}` :
                                                                        scheme.rewardValue}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {incentiveTab === 'eligible' && (
                                <div className="space-y-4">
                                    {eligibleRewards.length === 0 ? (
                                        <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                            <AwardIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm text-gray-400 font-medium"><Trans>No rewards ready to claim</Trans></p>
                                        </div>
                                    ) : (
                                        eligibleRewards.map((reward) => (
                                            <div key={reward._id} className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg shadow-blue-900/10 text-white group overflow-hidden relative">
                                                <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                                                <div className="relative space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                                            <SparkIcon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Milestone Reached</span>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-bold leading-tight">
                                                            {reward.incentiveSnapshot?.title || <Trans>Purchase Reward</Trans>}
                                                        </h3>
                                                        <p className="text-sm font-medium text-white/80 mt-1">
                                                            Value: {reward.incentiveSnapshot?.rewardType === 'fixed_amount' ? `₹${reward.incentiveSnapshot.rewardValue.toLocaleString('en-IN')}` :
                                                                reward.incentiveSnapshot?.rewardValue || <Trans>Check details</Trans>}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleClaimReward(reward._id)}
                                                        className="w-full py-3 bg-white text-blue-700 text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-gray-50 transition-all"
                                                    >
                                                        <Trans>Claim Reward Now</Trans>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* History Section below */}
                                    {incentiveHistory.filter(h => h.status !== 'approved').length > 0 && (
                                        <div className="pt-6">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2"><Trans>Redemption Log</Trans></h4>
                                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
                                                {incentiveHistory.filter(h => h.status !== 'approved').slice(0, 8).map((item) => (
                                                    <div key={item._id} className="p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-2 w-2 rounded-full",
                                                                item.status === 'claimed' ? "bg-blue-500" :
                                                                    item.status === 'rejected' ? "bg-red-500" : "bg-gray-300"
                                                            )}></div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                                    {item.incentiveSnapshot?.title}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">{new Date(item.earnedAt || item.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border",
                                                            item.status === 'claimed' ? "text-blue-700 bg-blue-50 border-blue-100" :
                                                                item.status === 'rejected' ? "text-red-700 bg-red-50 border-red-100" : "text-gray-500 bg-gray-50 border-gray-100"
                                                        )}>
                                                            {item.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

function CalculatorIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path strokeLinecap="round" d="M8 6h8M8 10h8M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2M16 18h2" />
        </svg>
    )
}
