import { useMemo, useState, useEffect } from 'react'
import { useVendorState, useVendorDispatch } from '../../../context/VendorContext'
import { MapPinIcon, CreditCardIcon, TruckIcon, ChevronRightIcon, CheckIcon, PackageIcon, WalletIcon } from '../../../../User/components/icons'
import { cn } from '../../../../../lib/cn'
import { useVendorApi } from '../../../hooks/useVendorApi'
import { getPrimaryImageUrl } from '../../../../User/utils/productImages'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'

export function VendorCheckoutView({ onBack, onOrderPlaced }) {
    const { cart, profile, settings } = useVendorState()
    const dispatch = useVendorDispatch()
    const { requestCreditPurchase, getCreditInfo, getRepaymentRules } = useVendorApi()

    const [paymentMode, setPaymentMode] = useState('credit') // 'credit' or 'cash'
    const [loading, setLoading] = useState(false)
    const [creditInfo, setCreditInfo] = useState(null)
    const [repaymentRules, setRepaymentRules] = useState({ discountTiers: [], interestTiers: [] })

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
    }, [cart, paymentMode])

    const handlePlaceOrder = async () => {
        setLoading(true)
        try {
            const orderData = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    variantAttributes: item.variantAttributes
                })),
                totalAmount: totals.total,
                paymentMode: paymentMode,
                notes: paymentMode === 'cash' ? 'Paid via Online/Cash' : 'Purchased on Credit'
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
                <div className="flex items-center gap-2 mb-3">
                    <MapPinIcon className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-bold text-gray-900"><Trans>Delivery Location</Trans></h3>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-bold text-gray-800">{profile.name}</p>
                    <p>{profile.location?.address}</p>
                    <p>{profile.location?.city}, {profile.location?.state} - {profile.location?.pincode}</p>
                    <p className="pt-1 font-medium text-gray-400">{profile.phone}</p>
                </div>
            </section>

            {/* Order Summary */}
            <section className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <PackageIcon className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-bold text-gray-900"><Trans>Stock Items</Trans></h3>
                </div>
                <div className="space-y-4">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden">
                                <img src={item.image || (item.product ? getPrimaryImageUrl(item.product) : 'https://via.placeholder.com/100')} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1"><TransText>{item.name}</TransText></p>
                                <p className="text-[10px] text-gray-500">
                                    {item.quantity} units x ₹{item.unitPrice.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="text-right font-bold text-xs text-gray-900">
                                ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Payment Mode Selection */}
            <section className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 ml-1"><Trans>Payment Mode</Trans></h3>

                {/* Credit Option */}
                <div
                    onClick={() => setPaymentMode('credit')}
                    className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white",
                        paymentMode === 'credit' ? "border-green-600 ring-4 ring-green-50 shadow-md" : "border-gray-100"
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <WalletIcon className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-sm text-gray-900"><Trans>Purchasing on Credit</Trans></span>
                        </div>
                        {creditInfo && (
                            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">
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
                        paymentMode === 'cash' ? "border-green-600 ring-4 ring-green-50 shadow-md" : "border-gray-100"
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
                        <div className="text-base font-black text-green-700">
                            ₹{totals.total.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            </section>

            {/* Summary Card */}
            <section className="p-4 rounded-2xl bg-gray-900 text-white shadow-xl">
                <div className="space-y-3">
                    <div className="flex justify-between text-xs opacity-70">
                        <span><Trans>Order Subtotal</Trans></span>
                        <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {totals.cashDiscount > 0 && (
                        <div className="flex justify-between text-xs text-green-400">
                            <span><Trans>Early Payment Reward (7%)</Trans></span>
                            <span>- ₹{totals.cashDiscount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold"><Trans>Final Amount</Trans></span>
                        <span className="text-xl font-black text-green-400">₹{totals.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </section>

            {/* Confirm Button */}
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 -mx-4 z-10 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
                <button
                    disabled={loading || (paymentMode === 'credit' && creditInfo && totals.baseTotal > creditInfo.remaining)}
                    onClick={handlePlaceOrder}
                    className={cn(
                        "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                        loading || (paymentMode === 'credit' && creditInfo && totals.baseTotal > creditInfo.remaining)
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-green-700 text-white shadow-lg active:scale-95 hover:bg-green-800"
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
                {paymentMode === 'credit' && creditInfo && totals.baseTotal > creditInfo.remaining && (
                    <p className="text-[10px] text-red-500 font-bold text-center mt-2">
                        <Trans>Insufficient credit balance. Repay existing dues to free up limit.</Trans>
                    </p>
                )}
            </div>
        </div>
    )
}
