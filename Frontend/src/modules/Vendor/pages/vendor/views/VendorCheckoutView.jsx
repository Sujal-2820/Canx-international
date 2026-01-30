import { useMemo, useState, useEffect } from 'react'
import { useVendorState, useVendorDispatch } from '../../../context/VendorContext'
import {
    MapPinIcon,
    CreditCardIcon,
    TruckIcon,
    ChevronRightIcon,
    CheckIcon,
    PackageIcon,
    WalletIcon,
    EditIcon
} from '../../../../../components/shared/catalog'
import { cn } from '../../../../../lib/cn'
import { useVendorApi } from '../../../hooks/useVendorApi'
import { getPrimaryImageUrl } from '../../../../../utils/productImages'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'
import { GoogleMapsLocationPicker } from '../../../../../components/GoogleMapsLocationPicker'

export function VendorCheckoutView({ onBack, onOrderPlaced }) {
    const { cart, profile, settings } = useVendorState()
    const dispatch = useVendorDispatch()
    const { requestCreditPurchase, getCreditInfo, getRepaymentRules, updateVendorProfile } = useVendorApi()

    const [paymentMode, setPaymentMode] = useState('credit') // 'credit' or 'cash'
    const [loading, setLoading] = useState(false)
    const [creditInfo, setCreditInfo] = useState(null)
    const [repaymentRules, setRepaymentRules] = useState({ discountTiers: [], interestTiers: [] })

    // Address Editing State
    const [isEditingAddress, setIsEditingAddress] = useState(false)
    const [tempLocation, setTempLocation] = useState(null)
    const [isUpdatingAddress, setIsUpdatingAddress] = useState(false)

    // Wholesale Order Requirements (New)
    const [reason, setReason] = useState('')
    const [bankDetails, setBankDetails] = useState({
        accountName: '',
        accountNumber: '',
        bankName: '',
        ifsc: '',
        branch: ''
    })
    const [confirmationText, setConfirmationText] = useState('')
    const [policyAccepted, setPolicyAccepted] = useState(false)

    // Dynamically get the primary discount rate (usually 0-5 or 0-30 days)
    const CASH_DISCOUNT_PERCENT = useMemo(() => {
        if (repaymentRules.discountTiers && repaymentRules.discountTiers.length > 0) {
            // Find the tier that starts at 0 (or the earliest one)
            const sortedByStart = [...repaymentRules.discountTiers].sort((a, b) => a.start - b.start)
            return sortedByStart[0].rate
        }
        return 0 // Fallback
    }, [repaymentRules.discountTiers])

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [creditRes, rulesRes] = await Promise.all([
                    getCreditInfo(),
                    getRepaymentRules()
                ])
                if (creditRes.data) setCreditInfo(creditRes.data)
                if (rulesRes.data) setRepaymentRules(rulesRes.data)
            } catch (err) {
                console.error('Failed to load checkout data:', err)
            }
        }
        loadInitialData()
    }, [getCreditInfo, getRepaymentRules])

    const handleUpdateAddress = async () => {
        if (!tempLocation) return
        setIsUpdatingAddress(true)
        try {
            const result = await updateVendorProfile({ location: tempLocation })
            if (result.data) {
                dispatch({
                    type: 'UPDATE_PROFILE',
                    payload: { location: tempLocation }
                })
                setIsEditingAddress(false)
            } else {
                alert(result.error?.message || 'Failed to update address')
            }
        } catch (err) {
            console.error('Address update error:', err)
            alert('An error occurred while updating the address.')
        } finally {
            setIsUpdatingAddress(false)
        }
    }

    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        const delivery = 0
        const baseTotal = subtotal + delivery

        // Calculate 7% discount if paying "cash" (online) now
        const cashDiscount = paymentMode === 'cash' ? (baseTotal * CASH_DISCOUNT_PERCENT) / 100 : 0
        const finalTotal = baseTotal - cashDiscount

        return {
            subtotal,
            delivery,
            cashDiscount,
            total: finalTotal,
            baseTotal
        }
    }, [cart, paymentMode, CASH_DISCOUNT_PERCENT])

    // Form Validation (Conditional based on Payment Mode)
    const isFormValid = useMemo(() => {
        // Basic cart check
        if (cart.length === 0) return false

        // Reason validation (min 10 characters) - ALWAYS REQUIRED
        if (!reason || reason.trim().length < 10) return false

        // Bank details validation - ONLY for CASH payments
        if (paymentMode === 'cash') {
            const requiredBankFields = ['accountName', 'accountNumber', 'bankName', 'ifsc']
            const bankValid = requiredBankFields.every(field => bankDetails[field] && bankDetails[field].trim().length > 0)
            if (!bankValid) return false
        }

        // Policy acceptance and confirmation - ONLY for CREDIT purchases
        if (paymentMode === 'credit') {
            if (!policyAccepted) return false
            if (confirmationText.trim().toLowerCase() !== 'confirm') return false

            // Credit limit check
            if (creditInfo && totals.baseTotal > creditInfo.remaining) return false
        }

        // Address check
        if (!profile.location?.address) return false

        return true
    }, [cart, reason, bankDetails, policyAccepted, confirmationText, paymentMode, creditInfo, totals.baseTotal, profile.location])

    const handlePlaceOrder = async () => {
        setLoading(true)
        try {
            const orderData = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    attributeCombination: item.variantAttributes || {}
                })),
                totalAmount: totals.total,
                paymentMode: paymentMode,
                notes: paymentMode === 'cash' ? 'Paid via Online/Cash' : 'Purchased on Credit',
                // Wholesale Order Requirements
                reason: reason.trim(),
                bankDetails: {
                    accountName: bankDetails.accountName.trim(),
                    accountNumber: bankDetails.accountNumber.trim(),
                    bankName: bankDetails.bankName.trim(),
                    ifsc: bankDetails.ifsc.trim().toUpperCase(),
                    branch: bankDetails.branch.trim()
                },
                confirmationText: confirmationText.trim()
            }

            const result = await requestCreditPurchase(orderData)
            if (result.data) {
                // Success
                dispatch({ type: 'CLEAR_CART' })
                onOrderPlaced(result.data)
            } else {
                alert(result.error?.message || 'Failed to place order')
            }
        } catch (err) {
            console.error('Order placement error:', err)
            alert('An error occurred while placing the order.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="user-checkout-view vendor-checkout-view space-y-6 pb-24">
            <header className="flex items-center gap-3 mb-2">
                <button onClick={onBack} className="p-2 -ml-2">
                    <ChevronRightIcon className="h-5 w-5 rotate-180 text-gray-400" />
                </button>
                <h2 className="text-xl font-bold text-gray-900"><Trans>Order Review</Trans></h2>
            </header>

            {/* Delivery Address */}
            <section className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-gray-900"><Trans>Delivery Location</Trans></h3>
                    </div>
                    {!isEditingAddress && (
                        <button
                            onClick={() => setIsEditingAddress(true)}
                            className="text-xs font-bold text-blue-600 flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg"
                        >
                            <EditIcon className="h-3 w-3" />
                            <Trans>Change</Trans>
                        </button>
                    )}
                </div>

                {isEditingAddress ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
                        <GoogleMapsLocationPicker
                            initialLocation={profile.location}
                            onLocationSelect={(loc) => setTempLocation(loc)}
                            label={<Trans>Update Delivery Address</Trans>}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditingAddress(false)}
                                className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-50 rounded-xl"
                            >
                                <Trans>Cancel</Trans>
                            </button>
                            <button
                                disabled={!tempLocation || isUpdatingAddress}
                                onClick={handleUpdateAddress}
                                className={cn(
                                    "flex-2 py-2 px-4 text-xs font-bold rounded-xl transition-all",
                                    !tempLocation || isUpdatingAddress
                                        ? "bg-gray-100 text-gray-400"
                                        : "bg-blue-600 text-white"
                                )}
                            >
                                {isUpdatingAddress ? <Trans>Saving...</Trans> : <Trans>Save Address</Trans>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-600 space-y-1">
                        <p className="font-bold text-gray-800">{profile.name}</p>
                        <p>{profile.location?.address}</p>
                        <p>{profile.location?.city}, {profile.location?.state} - {profile.location?.pincode}</p>
                        <p className="pt-1 font-medium text-gray-400">{profile.phone}</p>
                    </div>
                )}
            </section>

            {/* Order Summary */}
            <section className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <PackageIcon className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900"><Trans>Stock Items</Trans></h3>
                </div>
                <div className="space-y-4">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name || 'Product'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <PackageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1">
                                    <TransText>{item.name || 'Product'}</TransText>
                                </p>
                                {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        {Object.entries(item.variantAttributes).map(([key, value], i) => (
                                            <span key={key}>
                                                {i > 0 && ' • '}
                                                <span className="font-medium">{key}:</span> {value}
                                            </span>
                                        ))}
                                    </p>
                                )}
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {item.quantity} units × ₹{(item.unitPrice || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="text-right font-bold text-xs text-gray-900">
                                ₹{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-IN')}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Payment Mode Selection - MOVED UP */}
            <section className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 ml-1"><Trans>Payment Mode</Trans></h3>

                {/* Credit Option */}
                <div
                    onClick={() => setPaymentMode('credit')}
                    className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white",
                        paymentMode === 'credit' ? "border-blue-600 ring-4 ring-blue-50 shadow-md" : "border-gray-100"
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <WalletIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-bold text-sm text-gray-900"><Trans>Purchasing on Credit</Trans></span>
                        </div>
                        {creditInfo && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                <Trans>Limit</Trans>: ₹{creditInfo.remaining?.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2"><Trans>Get stock now, pay later. Interest-free up to 104 days.</Trans></p>
                    <div className="text-sm font-bold text-gray-900">
                        <Trans>Payable Amount</Trans>: ₹{totals.baseTotal.toLocaleString('en-IN')}
                    </div>
                </div>

                {/* Offline/Online Option */}
                <div
                    onClick={() => setPaymentMode('cash')}
                    className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white",
                        paymentMode === 'cash' ? "border-blue-600 ring-4 ring-blue-50 shadow-md" : "border-gray-100"
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-bold text-sm text-gray-900"><Trans>Instant Cash Payment</Trans></span>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">
                            <Trans>REWARD: 7% Off</Trans>
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2"><Trans>Pay immediately for the highest cash discount benefit.</Trans></p>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-900 line-through opacity-30">
                            ₹{totals.baseTotal.toLocaleString('en-IN')}
                        </div>
                        <div className="text-base font-black text-blue-700">
                            ₹{totals.total.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            </section>

            {/* Wholesale Order Requirements Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 ml-1"><Trans>Wholesale Order Information</Trans></h3>

                {/* Reason for Request - ALWAYS SHOWN */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                        <Trans>Reason for Stock Request</Trans> <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe why you need this stock (minimum 10 characters)"
                        rows={3}
                        className={cn(
                            "w-full px-3 py-2 border rounded-xl text-xs resize-none focus:outline-none focus:ring-2 transition-all",
                            reason.trim().length >= 10
                                ? "border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                                : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        )}
                    />
                    <p className={cn(
                        "text-[10px] mt-1 font-medium",
                        reason.trim().length >= 10 ? "text-blue-600" : "text-gray-400"
                    )}>
                        {reason.trim().length}/10 characters minimum
                    </p>
                </div>

                {/* Bank Account Details - ONLY for CASH payments */}
                {paymentMode === 'cash' && (
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
                        <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                            <Trans>Billing Bank Account Details</Trans> <span className="text-red-500">*</span>
                        </h4>

                        <div className="grid grid-cols-1 gap-3">
                            {/* Account Holder Name */}
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                    <Trans>Account Holder Name</Trans>
                                </label>
                                <input
                                    type="text"
                                    value={bankDetails.accountName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                    placeholder="Enter account holder name"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Account Number */}
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                    <Trans>Account Number</Trans>
                                </label>
                                <input
                                    type="text"
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                    placeholder="Enter account number"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Bank Name */}
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                    <Trans>Bank Name</Trans>
                                </label>
                                <input
                                    type="text"
                                    value={bankDetails.bankName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                    placeholder="Enter bank name"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* IFSC Code */}
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                    <Trans>IFSC Code</Trans>
                                </label>
                                <input
                                    type="text"
                                    value={bankDetails.ifsc}
                                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                                    placeholder="Enter IFSC code"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Branch (Optional) */}
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                    <Trans>Branch</Trans> <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={bankDetails.branch}
                                    onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                                    placeholder="Enter branch name"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Credit Policy Acceptance - ONLY for CREDIT purchases */}
                {paymentMode === 'credit' && (
                    <div className="p-4 rounded-2xl border-2 border-orange-100 bg-orange-50/30 shadow-sm space-y-3">
                        <h4 className="text-xs font-bold text-orange-900">
                            <Trans>Credit Policy Agreement</Trans>
                        </h4>

                        <div className="bg-white/70 p-3 rounded-lg border border-orange-100">
                            <p className="text-[10px] text-gray-700 leading-relaxed space-y-1">
                                <span className="block font-semibold text-orange-800"><Trans>Important Terms:</Trans></span>
                                <span className="block">• <Trans>Repayment within 0-15 days: 5% discount</Trans></span>
                                <span className="block">• <Trans>Repayment within 16-30 days: 2% discount</Trans></span>
                                <span className="block">• <Trans>Repayment after 45 days: 2% interest charge</Trans></span>
                                <span className="block">• <Trans>Repayment after 61 days: 5% interest charge</Trans></span>
                                <span className="block font-semibold text-orange-800 mt-2"><Trans>Your bank details will be securely stored for settlement processing.</Trans></span>
                            </p>
                        </div>

                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={policyAccepted}
                                onChange={(e) => setPolicyAccepted(e.target.checked)}
                                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-gray-700 leading-relaxed">
                                <Trans>I have read and agree to the credit policy terms above. I understand the discount and interest timelines.</Trans>
                            </span>
                        </label>

                        {/* Confirmation Input */}
                        <div>
                            <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                                <Trans>Type "confirm" to proceed</Trans> <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                placeholder="confirm"
                                className={cn(
                                    "w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all",
                                    confirmationText.trim().toLowerCase() === 'confirm'
                                        ? "border-blue-200 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                                        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                )}
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Summary Card */}
            <section className="p-4 rounded-2xl bg-gray-900 text-white shadow-xl">
                <div className="space-y-3">
                    <div className="flex justify-between text-xs opacity-70">
                        <span><Trans>Order Subtotal</Trans></span>
                        <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {totals.cashDiscount > 0 && (
                        <div className="flex justify-between text-xs text-blue-400">
                            <span><Trans>Early Payment Reward (7%)</Trans></span>
                            <span>- ₹{totals.cashDiscount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold"><Trans>Final Amount</Trans></span>
                        <span className="text-xl font-black text-blue-400">₹{totals.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </section>

            {/* Confirm Button */}
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 -mx-4 z-10 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
                <button
                    disabled={loading || !isFormValid}
                    onClick={handlePlaceOrder}
                    className={cn(
                        "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                        loading || !isFormValid
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-blue-700 text-white shadow-lg active:scale-95 hover:bg-blue-800"
                    )}
                >
                    {loading ? <Trans>Processing...</Trans> : (
                        <>
                            <CheckIcon className="h-5 w-5" />
                            <span>
                                {paymentMode === 'credit' ? <Trans>Request Credit Purchase</Trans> : <Trans>Place Order & Pay</Trans>}
                            </span>
                        </>
                    )}
                </button>

                {/* Validation Error Messages - Conditional based on Payment Mode */}
                {!loading && !isFormValid && (
                    <div className="text-[10px] text-red-500 font-medium text-center mt-2 space-y-0.5">
                        {cart.length === 0 && <p><Trans>• Cart is empty</Trans></p>}
                        {reason.trim().length < 10 && <p><Trans>• Reason must be at least 10 characters</Trans></p>}

                        {/* Bank details errors - ONLY for CASH mode */}
                        {paymentMode === 'cash' && (!bankDetails.accountName.trim() || !bankDetails.accountNumber.trim() || !bankDetails.bankName.trim() || !bankDetails.ifsc.trim()) && (
                            <p><Trans>• Complete bank details are required</Trans></p>
                        )}

                        {/* Policy and confirmation errors - ONLY for CREDIT mode */}
                        {paymentMode === 'credit' && !policyAccepted && <p><Trans>• Accept the credit policy to continue</Trans></p>}
                        {paymentMode === 'credit' && confirmationText.trim().toLowerCase() !== 'confirm' && <p><Trans>• Type "confirm" in the confirmation box</Trans></p>}
                        {paymentMode === 'credit' && creditInfo && totals.baseTotal > creditInfo.remaining && (
                            <p><Trans>• Insufficient credit balance</Trans></p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

