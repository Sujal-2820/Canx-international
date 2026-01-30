/**
 * Premium Credit Summary Widget
 * 
 * Re-envisioned for high visual impact and utility.
 */

import { Wallet, TrendingUp, Award, Clock, DollarSign, Calculator, ChevronRight, Zap, Target, Star } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Trans } from '../../../components/Trans'

export function CreditSummaryWidget({ creditData, onNavigateToCalculator }) {
    const data = creditData || {
        creditLimit: 100000,
        creditUsed: 25000,
        creditAvailable: 75000,
        creditScore: 85,
        performanceTier: 'Gold',
        stats: {
            totalDiscountsEarned: 1250,
            totalInterestPaid: 0,
            avgRepaymentDays: 14,
            onTimeRate: 98
        },
        outstandingPurchases: 1
    }

    if (!data.stats) {
        data.stats = { totalDiscountsEarned: 0, totalInterestPaid: 0, avgRepaymentDays: 0, onTimeRate: 0 }
    }

    const creditUtilization = data.creditLimit > 0 ? (data.creditUsed / data.creditLimit) * 100 : 0

    const getTierConfig = (tier) => {
        switch (tier?.toUpperCase()) {
            case 'PLATINUM': return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: <Star className="w-3 h-3" /> }
            case 'GOLD': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Star className="w-3 h-3" /> }
            default: return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Star className="w-3 h-3" /> }
        }
    }

    const tier = getTierConfig(data.performanceTier)
    const formatCurrency = (amount) => `₹${(Number(amount) || 0).toLocaleString('en-IN')}`

    return (
        <div className="relative group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all duration-300">
            {/* Header Area - Balanced & Refined */}
            <div className="relative px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-gray-900 text-base font-semibold tracking-tight leading-none"><Trans>Capital Limit</Trans></h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1"><Trans>Verified Credit Line</Trans></p>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase border shadow-sm",
                    tier.color, tier.bg, tier.border
                )}>
                    {tier.icon}
                    <span>{(data.performanceTier || 'STANDARD').replace(/_/g, ' ')}</span>
                </div>
            </div>

            <div className="relative p-5 space-y-6">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Metrics */}
                    <div className="lg:col-span-7 space-y-5">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 px-1"><Trans>Total Available Capital</Trans></p>
                            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-baseline gap-1">
                                {formatCurrency(data.creditAvailable)}
                                <span className="text-sm font-normal text-gray-300 tracking-normal ml-2">/ {formatCurrency(data.creditLimit)}</span>
                            </h2>
                        </div>

                        {/* Visual Utilization Track */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end px-1">
                                <div>
                                    <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest"><Trans>Usage Impact</Trans></span>
                                    <p className="text-[9px] text-gray-400"><Trans>Maintains score health</Trans></p>
                                </div>
                                <span className={cn(
                                    "text-base font-semibold",
                                    creditUtilization > 80 ? "text-red-500" : "text-blue-600"
                                )}>{creditUtilization.toFixed(0)}%</span>
                            </div>
                            <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        creditUtilization > 80 ? 'bg-red-500' : 'bg-blue-500'
                                    )}
                                    style={{ width: `${Math.min(creditUtilization + 1, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1"><Trans>Current Used</Trans></p>
                                <p className="text-base font-semibold text-gray-900 leading-none">{formatCurrency(data.creditUsed)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                                <p className="text-[9px] text-blue-600 uppercase tracking-widest mb-1"><Trans>Safe Balance</Trans></p>
                                <p className="text-base font-semibold text-blue-700 leading-none">{formatCurrency(data.creditAvailable)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Score Engine - Made more compact */}
                    <div className="lg:col-span-5">
                        <div className="h-full bg-gray-50/50 rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center text-center relative shadow-sm overflow-hidden">
                            <div className="relative mb-3">
                                <div className="h-24 w-24 rounded-full border-[6px] border-white shadow-md flex flex-col items-center justify-center bg-white relative z-10">
                                    <span className="text-3xl font-semibold text-gray-900 tracking-tight leading-none mb-0.5">{data.creditScore}</span>
                                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Score</span>
                                </div>
                                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-20 -z-10"></div>
                            </div>

                            <div className="space-y-0.5">
                                <h4 className="text-[11px] font-semibold text-gray-900 uppercase tracking-widest leading-none"><Trans>Reputation Engine</Trans></h4>
                                <p className="text-[10px] text-gray-400 px-2 leading-tight"><Trans>Trust rating based on fulfillment</Trans></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats Strip - Tightened */}
                <div className="pt-5 border-t border-gray-50 flex flex-wrap gap-x-6 gap-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                            <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest"><Trans>Early Pays</Trans></p>
                            <p className="text-xs font-semibold text-gray-900">{formatCurrency(data.stats.totalDiscountsEarned)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Target className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest"><Trans>Reliability</Trans></p>
                            <p className="text-xs font-semibold text-gray-900">{data.stats.onTimeRate}%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                            <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest"><Trans>Avg Repay</Trans></p>
                            <p className="text-xs font-semibold text-gray-900">{data.stats.avgRepaymentDays} d</p>
                        </div>
                    </div>
                </div>

                {/* Intelligent Action Banner - Reduced padding */}
                {data.outstandingPurchases > 0 && (
                    <button
                        onClick={onNavigateToCalculator}
                        className="group w-full bg-blue-600 p-4 rounded-xl flex items-center justify-between transition-all hover:bg-blue-700 active:scale-[0.98] shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center border border-white/20">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left text-white">
                                <p className="text-[10px] font-semibold uppercase tracking-wide"><Trans>Settle Outstanding Capital</Trans></p>
                                <p className="text-[9px] text-blue-100/70 uppercase"><Trans>Maintain your reliability score</Trans></p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    )
}

export default CreditSummaryWidget
