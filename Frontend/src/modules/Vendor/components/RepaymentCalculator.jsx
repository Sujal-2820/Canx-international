/**
 * Vendor Repayment Calculator Component
 * 
 * Allows vendors to:
 * - Select a pending purchase
 * - Choose repayment date
 * - See real-time calculation (discount/interest/neutral)
 * - View detailed breakdown
 * - Submit repayment
 */

import { useState, useEffect } from 'react'
import { Calendar, Calculator, TrendingDown, TrendingUp, DollarSign, Info, CheckCircle, Loader, ArrowRight, ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Trans } from '../../../components/Trans'

export function RepaymentCalculator({ vendorApi, onSuccess }) {
    const [purchases, setPurchases] = useState([])
    const [selectedPurchase, setSelectedPurchase] = useState(null)
    const [repaymentDate, setRepaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [calculation, setCalculation] = useState(null)
    const [projection, setProjection] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showProjection, setShowProjection] = useState(false)

    // Load pending purchases on mount
    useEffect(() => {
        loadPendingPurchases()
    }, [])

    const loadPendingPurchases = async () => {
        try {
            if (vendorApi?.getPendingPurchases) {
                const res = await vendorApi.getPendingPurchases()
                if (res.data?.purchases) {
                    setPurchases(res.data.purchases)
                    return
                }
            }

            // Fallback mock
            const mockPurchases = [
                {
                    _id: '1',
                    purchaseOrderId: 'PUR-20260101-0001',
                    totalAmount: 100000,
                    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'approved',
                    products: [{ name: 'Micro Nutrient Mix', quantity: 100 }]
                }
            ]
            setPurchases(mockPurchases)
        } catch (error) {
            console.error('Failed to load purchases:', error)
        }
    }

    const handleCalculate = async () => {
        if (!selectedPurchase) return

        setIsLoading(true)
        try {
            if (vendorApi?.calculateRepayment) {
                const res = await vendorApi.calculateRepayment({
                    purchaseId: selectedPurchase._id,
                    repaymentDate: new Date(repaymentDate).toISOString()
                })
                if (res.data) {
                    setCalculation(res.data)
                    setIsLoading(false)
                    return
                }
            }

            // Mock calculation fallback
            const daysElapsed = Math.floor(
                (new Date(repaymentDate) - new Date(selectedPurchase.createdAt)) / (1000 * 60 * 60 * 24)
            )

            let discountRate = 0
            let interestRate = 0
            let tierType = 'neutral'

            if (daysElapsed <= 30) { discountRate = 10; tierType = 'discount'; }
            else if (daysElapsed <= 60) { discountRate = 5; tierType = 'discount'; }
            else if (daysElapsed > 90) { interestRate = 2; tierType = 'interest'; }

            const baseAmount = selectedPurchase.totalAmount
            const discountAmount = (baseAmount * discountRate) / 100
            const interestAmount = (baseAmount * interestRate) / 100
            const finalPayable = tierType === 'discount' ? baseAmount - discountAmount : tierType === 'interest' ? baseAmount + interestAmount : baseAmount

            setCalculation({
                purchaseId: selectedPurchase._id,
                baseAmount,
                daysElapsed,
                tierType,
                discountRate,
                interestRate,
                discountAmount,
                interestAmount,
                finalPayable,
                tierApplied: tierType === 'discount' ? `${discountRate}% Early Pay Discount` : tierType === 'interest' ? `${interestRate}% Late Fee` : 'Standard Rate'
            })
        } catch (error) {
            console.error('Calculation failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleViewProjection = async () => {
        if (!selectedPurchase) return
        setIsLoading(true)
        try {
            if (vendorApi?.getRepaymentProjection) {
                const res = await vendorApi.getRepaymentProjection(selectedPurchase._id)
                if (res.data) {
                    setProjection(res.data)
                    setShowProjection(true)
                    return
                }
            }
        } catch (error) {
            console.error('Failed to load projection:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitRepayment = async () => {
        if (!calculation || !selectedPurchase) return

        if (!confirm(`Confirm repayment of ₹${calculation.finalPayable.toLocaleString('en-IN')}?`)) return

        setIsSubmitting(true)
        try {
            if (vendorApi?.submitRepayment) {
                const res = await vendorApi.submitRepayment(selectedPurchase._id, {
                    repaymentAmount: calculation.finalPayable,
                    paymentMode: 'online',
                    transactionId: 'TXN-' + Date.now()
                })
                if (res.success) {
                    if (onSuccess) onSuccess()
                    setCalculation(null)
                    setSelectedPurchase(null)
                    loadPendingPurchases()
                }
            }
        } catch (error) {
            console.error('Submission failed:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

    return (
        <div className="space-y-6">
            {/* Active Dues List - BETTER UI TO SETTLE CREDITS */}
            {purchases.length > 0 && !calculation && (
                <div className="space-y-3">
                    <p className="px-2 text-[10px] text-gray-400 uppercase tracking-widest"><Trans>Select a due to settle</Trans></p>
                    <div className="grid grid-cols-1 gap-3">
                        {purchases.map((p) => (
                            <button
                                key={p._id}
                                onClick={() => {
                                    setSelectedPurchase(p)
                                    setCalculation(null)
                                }}
                                className={cn(
                                    "p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                                    selectedPurchase?._id === p._id
                                        ? "bg-green-50 border-green-200 ring-1 ring-green-600 shadow-sm"
                                        : "bg-white border-gray-100 hover:border-gray-300"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                        selectedPurchase?._id === p._id ? "bg-green-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                                    )}>
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-900 leading-none">
                                            {p.creditPurchaseId || `Order #${String(p._id).slice(-4)}`}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase">
                                            {new Date(p.createdAt).toLocaleDateString()} • {formatCurrency(p.totalAmount)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedPurchase?._id === p._id && <CheckCircle className="w-4 h-4 text-green-600" />}
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-green-600" />
                        <h3 className="text-gray-900 text-base tracking-tight">
                            <Trans>Settlement Hub</Trans>
                        </h3>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                    {/* Selection Area */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 ml-1"><Trans>Repayment Effective Date</Trans></label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={repaymentDate}
                                        onChange={(e) => {
                                            setRepaymentDate(e.target.value)
                                            setCalculation(null)
                                        }}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-green-600 focus:ring-0 transition-all outline-none"
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={handleCalculate}
                                    disabled={!selectedPurchase || isLoading}
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl text-xs uppercase tracking-wide hover:bg-green-700 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2 h-[46px]"
                                >
                                    {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                                    <span><Trans>Calculate</Trans></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Result - Integrated with Dashboard Style */}
                    {calculation && (
                        <div className="animate-in fade-in duration-300">
                            <div className={cn(
                                "rounded-2xl p-6 border transition-all",
                                calculation.tierType === 'discount' ? "bg-green-50 border-green-100" :
                                    calculation.tierType === 'interest' ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                            )}>
                                <div className="space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 min-w-[2.5rem] rounded-xl flex items-center justify-center bg-white shadow-sm",
                                                calculation.tierType === 'discount' ? "text-green-600" :
                                                    calculation.tierType === 'interest' ? "text-red-600" : "text-gray-400"
                                            )}>
                                                {calculation.tierType === 'discount' ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider line-clamp-1">{calculation.tierApplied}</p>
                                                <h4 className="text-sm text-gray-900 leading-tight">
                                                    {calculation.tierType === 'discount' ? <Trans>Savings Applicable</Trans> : <Trans>Settlement Adjustment</Trans>}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1"><Trans>Payable</Trans></p>
                                            <p className="text-lg text-gray-900 leading-none">{formatCurrency(calculation.finalPayable)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-gray-100 pt-4">
                                        <div className="flex justify-between items-center text-xs text-gray-600">
                                            <span><Trans>Base Principal</Trans></span>
                                            <span className="text-gray-900">{formatCurrency(calculation.baseAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className={cn(
                                                calculation.tierType === 'discount' ? "text-green-600" :
                                                    calculation.tierType === 'interest' ? "text-red-600" : "text-gray-400"
                                            )}>
                                                {calculation.tierType === 'discount' ? <Trans>Discount</Trans> : <Trans>Handling Fee</Trans>}
                                            </span>
                                            <span className={cn(
                                                calculation.tierType === 'discount' ? "text-green-600" :
                                                    calculation.tierType === 'interest' ? "text-red-600" : "text-gray-400"
                                            )}>
                                                {calculation.tierType === 'discount' ? `-${formatCurrency(calculation.discountAmount)}` : `+${formatCurrency(calculation.interestAmount)}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                        <button
                                            onClick={handleViewProjection}
                                            className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-gray-700 transition-all text-center"
                                        >
                                            <Trans>Full Schedule</Trans>
                                        </button>
                                        <button
                                            onClick={handleSubmitRepayment}
                                            disabled={isSubmitting}
                                            className="flex-[2] py-3 px-4 bg-green-600 text-white rounded-xl text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                                            <Trans>Finalize Payment</Trans>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Projection Modal */}
                {showProjection && projection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-gray-900/10 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100">
                            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-gray-900 text-base tracking-tight"><Trans>Repayment Valuation Graph</Trans></h3>
                                <button
                                    onClick={() => setShowProjection(false)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-2">
                                {projection.map((point, idx) => (
                                    <div key={idx} className={cn(
                                        "p-3 rounded-xl flex items-center justify-between text-xs border border-transparent shadow-sm",
                                        point.tierType === 'discount' ? "bg-green-50 border-green-100" :
                                            point.tierType === 'interest' ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                                {point.day}d
                                            </div>
                                            <div>
                                                <p className="text-gray-900">{formatCurrency(point.amount)}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(point.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-[9px] uppercase px-1.5 py-0.5 rounded",
                                                point.tierType === 'discount' ? "text-green-700 bg-white/50" :
                                                    point.tierType === 'interest' ? "text-red-700 bg-white/50" : "text-gray-500"
                                            )}>
                                                {point.rate}% {point.tierType}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RepaymentCalculator
