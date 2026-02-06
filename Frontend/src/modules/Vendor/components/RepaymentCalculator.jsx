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
import { Calendar, Calculator, TrendingDown, TrendingUp, DollarSign, Info, CheckCircle, Loader, ArrowRight, ChevronRight, AlertCircle, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Trans } from '../../../components/Trans'
import { VendorRepaymentConfirmation } from './VendorRepaymentConfirmation'

// Helper to load Razorpay script
const loadRazorpay = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

export function RepaymentCalculator({ vendorApi, onSuccess }) {
    const [purchases, setPurchases] = useState([])
    const [selectedPurchase, setSelectedPurchase] = useState(null)
    // Repayment date is always today - enforced by backend
    const today = new Date().toISOString().split('T')[0]
    const [calculation, setCalculation] = useState(null)
    const [projection, setProjection] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showProjection, setShowProjection] = useState(false)
    const [day0Error, setDay0Error] = useState(null) // Track Day 0 restriction
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)

    const [paymentMode, setPaymentMode] = useState('full') // 'full' | 'partial'
    const [partialAmount, setPartialAmount] = useState('')
    const [validationError, setValidationError] = useState(null) // For beautiful in-app validation

    // Reset payment mode when purchase changes
    useEffect(() => {
        if (selectedPurchase) {
            setPaymentMode('full')
            setPartialAmount('')
        }
    }, [selectedPurchase])

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
                    // Always use today's date - backend will enforce this
                    repaymentDate: new Date().toISOString()
                })

                // Check for Day 0 restriction error
                if (res.error && res.error.isDay0) {
                    setDay0Error({
                        message: res.error.message,
                        guidance: res.error.guidance,
                        earliestDate: res.error.earliestRepaymentDate
                    })
                    setCalculation(null)
                    setIsLoading(false)
                    return
                }

                if (res.data) {
                    setCalculation(res.data)
                    setDay0Error(null) // Clear any previous Day 0 error

                    // Pre-fill partial amount with full amount initially if empty
                    if (!partialAmount) {
                        // We don't set partialAmount here to keep it clean, but logic will use it
                    }

                    setIsLoading(false)
                    return
                }
            }

            // Mock calculation fallback
            const daysElapsed = Math.floor(
                (new Date() - new Date(selectedPurchase.createdAt)) / (1000 * 60 * 60 * 24)
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
                tierApplied: tierType === 'discount' ? `${discountRate}% Early Pay Discount` : tierType === 'interest' ? `${interestRate}% Late Fee` : 'Standard Rate',
                savingsFromEarlyPayment: discountAmount,
                penaltyFromLatePayment: interestAmount
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

    const handleInitiateRepayment = () => {
        if (!calculation || !selectedPurchase) return

        // Clear previous validation errors
        setValidationError(null)

        // Validate partial amount if mode is partial
        if (paymentMode === 'partial') {
            const amount = Number(partialAmount)
            if (!amount || amount <= 0) {
                setValidationError({
                    title: 'Invalid Amount',
                    message: 'Please enter a valid amount greater than ₹0',
                    type: 'error'
                })
                return
            }
            if (amount > calculation.finalPayable) {
                setValidationError({
                    title: 'Amount Too High',
                    message: `Amount cannot exceed the total payable amount of ₹${calculation.finalPayable.toLocaleString('en-IN')}`,
                    type: 'error'
                })
                return
            }

            // CRITICAL: Enforce 5% minimum partial payment rule
            const minPercentage = 5 // This should match backend setting
            const minAllowedAmount = Math.ceil((calculation.finalPayable * minPercentage) / 100)

            // Allow if it's very close to full payment (within ₹1)
            const isNearlyFull = amount >= calculation.finalPayable - 1

            if (!isNearlyFull && amount < minAllowedAmount) {
                setValidationError({
                    title: 'Minimum Payment Required',
                    message: `Partial payment must be at least ${minPercentage}% of the total payable amount.`,
                    details: `Minimum required: ₹${minAllowedAmount.toLocaleString('en-IN')}`,
                    entered: `You entered: ₹${amount.toLocaleString('en-IN')}`,
                    type: 'warning'
                })
                return
            }
        }

        setIsConfirmationOpen(true)
    }

    const handleConfirmRepayment = async () => {
        setIsSubmitting(true)
        try {
            // 1. Load Razorpay SDK
            const isLoaded = await loadRazorpay()
            if (!isLoaded) {
                alert('Razorpay SDK failed to load. Please check your internet connection.')
                setIsSubmitting(false)
                return
            }

            // Determine amount to pay
            let amountPayload = {}
            if (paymentMode === 'partial' && partialAmount) {
                amountPayload = { amount: Number(partialAmount) }
                console.log('🔍 [RepaymentCalculator] Partial Payment Detected')
                console.log('🔍 [RepaymentCalculator] Partial Amount:', partialAmount)
                console.log('🔍 [RepaymentCalculator] Amount Payload:', amountPayload)
            } else {
                console.log('🔍 [RepaymentCalculator] Full Payment - No amount payload')
            }

            // 2. Initiate Repayment (Get Order ID)
            console.log('🔍 [RepaymentCalculator] Calling initiateRepayment with:', {
                purchaseId: selectedPurchase._id,
                payload: amountPayload
            })
            console.log('🔍 [RepaymentCalculator] amountPayload type:', typeof amountPayload)
            console.log('🔍 [RepaymentCalculator] amountPayload keys:', Object.keys(amountPayload))
            console.log('🔍 [RepaymentCalculator] amountPayload.amount:', amountPayload.amount)
            console.log('🔍 [RepaymentCalculator] vendorApi exists:', !!vendorApi)
            console.log('🔍 [RepaymentCalculator] vendorApi.initiateRepayment exists:', !!vendorApi?.initiateRepayment)

            const initRes = await vendorApi.initiateRepayment(selectedPurchase._id, amountPayload)

            if (!initRes?.data?.razorpayOrder) {
                throw new Error('Failed to initiate repayment order')
            }

            const { razorpayOrder, tempId } = initRes.data
            const options = {
                key: razorpayOrder.key,
                amount: razorpayOrder.amount, // Amount is in paise from backend
                currency: razorpayOrder.currency,
                name: "FarmCommerce",
                description: `Payment for Purchase #${selectedPurchase.creditPurchaseId || selectedPurchase._id.slice(-6)}`,
                order_id: razorpayOrder.id,
                prefill: {
                    // prefill data if available
                },
                theme: {
                    color: "#2563eb"
                },
                handler: async function (response) {
                    try {
                        // 3. Verify Repayment
                        const verifyRes = await vendorApi.verifyRepayment(selectedPurchase._id, {
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature
                        })

                        if (!verifyRes.error) {
                            if (onSuccess) onSuccess()
                            setCalculation(null)
                            setSelectedPurchase(null)
                            setDay0Error(null)
                            setIsConfirmationOpen(false)
                            setPaymentMode('full')
                            setPartialAmount('')
                            loadPendingPurchases()
                            // No alert needed, parent refresh will handle UI updates
                        } else {
                            alert('Payment verification failed: ' + (verifyRes.error.message || 'Please contact support.'))
                        }
                    } catch (err) {
                        console.error('Verification error:', err)
                        alert('Error verifying payment. Please contact support.')
                    } finally {
                        setIsSubmitting(false)
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsSubmitting(false)
                    }
                }
            }

            const paymentObject = new window.Razorpay(options)
            paymentObject.open()

        } catch (error) {
            console.error('Repayment flow failed:', error)
            alert(error.message || 'Failed to process repayment')
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

    return (
        <div className="space-y-6">
            {/* Active Dues List ... (keep existing) */}
            {purchases.length > 0 && !calculation && (
                <div className="space-y-3">
                    <div className="px-2 flex items-center justify-between">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <Trans>Select an open invoice to calculate repayment</Trans>
                        </p>
                    </div>
                    {/* ... list render ... */}
                    <div className="grid grid-cols-1 gap-3">
                        {purchases.map((p) => {
                            // ... keep existing map ...
                            const purchaseDate = new Date(p.createdAt);
                            const purchaseDateOnly = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
                            const currentDateOnly = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                            const daysSincePurchase = Math.floor((currentDateOnly - purchaseDateOnly) / (1000 * 60 * 60 * 24));
                            const isDay0 = daysSincePurchase === 0;

                            return (
                                <button
                                    key={p._id}
                                    onClick={() => {
                                        setSelectedPurchase(p)
                                        setCalculation(null)
                                        if (!isDay0) setDay0Error(null)
                                    }}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all flex items-center justify-between group relative overflow-hidden",
                                        selectedPurchase?._id === p._id
                                            ? "bg-blue-50 border-blue-200 ring-1 ring-blue-600 shadow-sm"
                                            : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-md"
                                    )}
                                >
                                    {selectedPurchase?._id === p._id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                            selectedPurchase?._id === p._id ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                                        )}>
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm text-gray-900 leading-none font-medium">
                                                    {p.creditPurchaseId || `Order #${String(p._id).slice(-4)}`}
                                                </p>
                                                {isDay0 && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-semibold uppercase tracking-wide rounded-full">
                                                        Day 0
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-medium">
                                                {new Date(p.createdAt).toLocaleDateString()} • {formatCurrency(p.totalAmount)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedPurchase?._id === p._id && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-600" />
                        <h3 className="text-gray-900 text-base tracking-tight">
                            <Trans>Settlement Hub</Trans>
                        </h3>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                    {/* Selection Area */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 ml-1"><Trans>Repayment Date</Trans></label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={today}
                                        min={today}
                                        max={today}
                                        disabled
                                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 cursor-not-allowed transition-all outline-none"
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={handleCalculate}
                                    disabled={!selectedPurchase || isLoading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs uppercase tracking-wide hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2 h-[46px]"
                                >
                                    {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                                    <span><Trans>Calculate</Trans></span>
                                </button>
                            </div>

                            <div className="flex items-start gap-2 px-1">
                                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    <Trans>Repayments are processed for the current date only to ensure accurate discount/interest calculation and prevent manipulation.</Trans>
                                </p>
                            </div>

                            {/* Day 0 Restriction Alert */}
                            {day0Error && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-sm font-semibold text-amber-900">
                                                <Trans>Day 0 - Repayment Not Available</Trans>
                                            </h4>
                                            <p className="text-xs text-amber-700 leading-relaxed">
                                                {day0Error.guidance}
                                            </p>
                                            <div className="mt-2 pt-2 border-t border-amber-200">
                                                <p className="text-[10px] text-amber-600 font-medium">
                                                    <Trans>Earliest Repayment Date:</Trans> <span className="font-semibold">{day0Error.earliestDate}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calculation Result - Integrated with Dashboard Style */}
                    {calculation && (
                        <div className="animate-in fade-in duration-300 space-y-6">

                            {/* Payment Mode Toggles */}
                            <div className="flex items-center gap-3 p-1 bg-gray-100 rounded-xl w-fit">
                                <button
                                    onClick={() => setPaymentMode('full')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                                        paymentMode === 'full' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    <Trans>Full Payment</Trans>
                                </button>
                                <button
                                    onClick={() => setPaymentMode('partial')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                                        paymentMode === 'partial' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    <Trans>Partial Amount</Trans>
                                </button>
                            </div>

                            {/* Input for Partial Amount */}
                            {paymentMode === 'partial' && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-xs text-gray-500 ml-1 mb-1 block"><Trans>Enter Amount to Pay</Trans></label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</div>
                                        <input
                                            type="number"
                                            value={partialAmount}
                                            onChange={(e) => setPartialAmount(e.target.value)}
                                            placeholder="Enter amount (e.g. 5000)"
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                                        <Trans>Max Payable:</Trans> {formatCurrency(calculation.finalPayable)}
                                    </p>
                                </div>
                            )}

                            {/* Beautiful Validation Error Display */}
                            {validationError && (
                                <div className={cn(
                                    "animate-in slide-in-from-top-2 fade-in duration-300 rounded-xl p-4 border-2",
                                    validationError.type === 'error' ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                                )}>
                                    <div className="flex gap-3">
                                        <div className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                            validationError.type === 'error' ? "bg-red-100" : "bg-amber-100"
                                        )}>
                                            <AlertCircle className={cn(
                                                "w-5 h-5",
                                                validationError.type === 'error' ? "text-red-600" : "text-amber-600"
                                            )} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={cn(
                                                "text-sm font-bold mb-1",
                                                validationError.type === 'error' ? "text-red-900" : "text-amber-900"
                                            )}>
                                                {validationError.title}
                                            </h4>
                                            <p className={cn(
                                                "text-xs leading-relaxed mb-2",
                                                validationError.type === 'error' ? "text-red-700" : "text-amber-700"
                                            )}>
                                                {validationError.message}
                                            </p>
                                            {validationError.details && (
                                                <div className={cn(
                                                    "text-xs font-semibold p-2 rounded-lg mt-2",
                                                    validationError.type === 'error' ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                                                )}>
                                                    <div>{validationError.details}</div>
                                                    {validationError.entered && (
                                                        <div className="mt-1">{validationError.entered}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setValidationError(null)}
                                            className={cn(
                                                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                                validationError.type === 'error'
                                                    ? "hover:bg-red-100 text-red-400 hover:text-red-600"
                                                    : "hover:bg-amber-100 text-amber-400 hover:text-amber-600"
                                            )}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={cn(
                                "rounded-2xl p-6 border transition-all",
                                calculation.tierType === 'discount' ? "bg-blue-50 border-blue-100" :
                                    calculation.tierType === 'interest' ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                            )}>
                                <div className="space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 min-w-[2.5rem] rounded-xl flex items-center justify-center bg-white shadow-sm",
                                                calculation.tierType === 'discount' ? "text-blue-600" :
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
                                            <p className="text-lg text-gray-900 leading-none">
                                                {paymentMode === 'partial' && partialAmount ? formatCurrency(partialAmount) : formatCurrency(calculation.finalPayable)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-gray-100 pt-4">
                                        <div className="flex justify-between items-center text-xs text-gray-600">
                                            <span><Trans>Total Outstanding</Trans></span>
                                            <span className="text-gray-900">{formatCurrency(calculation.baseAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className={cn(
                                                calculation.tierType === 'discount' ? "text-blue-600" :
                                                    calculation.tierType === 'interest' ? "text-red-600" : "text-gray-400"
                                            )}>
                                                {calculation.tierType === 'discount' ? <Trans>Total Discount</Trans> : <Trans>Total Fee</Trans>}
                                            </span>
                                            <span className={cn(
                                                calculation.tierType === 'discount' ? "text-blue-600" :
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
                                            onClick={handleInitiateRepayment}
                                            disabled={isSubmitting || (paymentMode === 'partial' && !partialAmount)}
                                            className="flex-[2] py-3 px-4 bg-blue-600 text-white rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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

                {/* Projection Modal ... (keep existing) */}
                {showProjection && projection && (
                    // ... kept ...
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-gray-900/10 backdrop-blur-sm animate-in fade-in duration-300">
                        {/* ... content ... */}
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
                                {(Array.isArray(projection) ? projection : (projection.projections || [])).map((point, idx) => (
                                    <div key={idx} className={cn(
                                        "p-3 rounded-xl flex items-center justify-between text-xs border border-transparent shadow-sm",
                                        point.tierType === 'discount' ? "bg-blue-50 border-blue-100" :
                                            point.tierType === 'interest' ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                                {point.day}d
                                            </div>
                                            <div>
                                                <p className="text-gray-900">{formatCurrency(point.finalPayable)}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(point.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-[9px] uppercase px-1.5 py-0.5 rounded",
                                                point.tierType === 'discount' ? "text-blue-700 bg-white/50" :
                                                    point.tierType === 'interest' ? "text-red-700 bg-white/50" : "text-gray-500"
                                            )}>
                                                {point.rate || point.discountRate || point.interestRate}% {point.tierType}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Secure Repayment Confirmation Modal */}
                <VendorRepaymentConfirmation
                    isOpen={isConfirmationOpen}
                    onClose={() => {
                        if (!isSubmitting) setIsConfirmationOpen(false)
                    }}
                    onConfirm={handleConfirmRepayment}
                    calculation={calculation}
                    purchase={selectedPurchase}
                    isProcessing={isSubmitting}
                    // Pass formatted custom amount if partial
                    amountOverride={paymentMode === 'partial' ? Number(partialAmount) : undefined}
                />
            </div>
        </div>
    )
}

export default RepaymentCalculator
