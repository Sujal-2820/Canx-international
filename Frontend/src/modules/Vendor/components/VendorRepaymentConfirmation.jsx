import React from 'react';
import { ShieldCheck, ArrowRight, AlertCircle, X, Check, Wallet, Globe } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { Trans } from '../../../components/Trans';

export function VendorRepaymentConfirmation({
    isOpen,
    onClose,
    onConfirm,
    calculation,
    purchase,
    isProcessing,
    amountOverride // New optional prop
}) {
    if (!isOpen || !calculation) return null;

    const {
        finalPayable,
        baseAmount,
        tierType,
        tierApplied,
        discountAmount,
        interestAmount,
        savingsFromEarlyPayment,
        penaltyFromLatePayment
    } = calculation;

    // Use override if present, else default to full calculation
    const displayAmount = amountOverride || finalPayable;
    const isPartial = !!amountOverride;

    // CRITICAL: Calculate remaining balance correctly
    // Partial payment is deducted from the CURRENT payable (after discount/interest),
    // NOT from the original base amount
    const remainingBalance = isPartial ? (finalPayable - displayAmount) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Content */}
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">

                {/* Header with Security Badge */}
                <div className="bg-gradient-to-b from-blue-50 to-white pt-8 pb-6 px-6 relative overflow-hidden text-center shrink-0">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />

                    <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-lg shadow-blue-900/5 flex items-center justify-center mb-4 ring-4 ring-white relative z-10">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
                        <Trans>Secure Payment</Trans>
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                        <Trans>Razorpay Secured Gateway</Trans>
                    </p>
                </div>

                {/* Scrollable Content */}
                <div className="px-6 py-2 overflow-y-auto custom-scrollbar flex-1">
                    {/* Amount Card */}
                    <div className="mt-2 bg-gray-900 rounded-2xl p-6 text-center text-white shadow-xl shadow-gray-200 mb-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wallet className="w-24 h-24 rotate-[-15deg]" />
                        </div>
                        <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-2">
                            {isPartial ? <Trans>Partial Payment Amount</Trans> : <Trans>Total Payable Amount</Trans>}
                        </p>
                        <div className="flex items-start justify-center gap-1">
                            <span className="text-2xl mt-1 font-medium text-blue-300">₹</span>
                            <span className="text-5xl font-bold tracking-tight">{displayAmount.toLocaleString('en-IN')}</span>
                        </div>
                        {tierType === 'discount' && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-medium animate-pulse">
                                <Check className="w-3 h-3" />
                                <span><Trans>You are saving</Trans> ₹{savingsFromEarlyPayment.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        {tierType === 'interest' && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full text-rose-300 text-xs font-medium">
                                <AlertCircle className="w-3 h-3" />
                                <span><Trans>Includes Penalty</Trans> ₹{penaltyFromLatePayment.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                    </div>

                    {/* Details List */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500"><Trans>Purchase ID</Trans></span>
                            <span className="text-sm font-semibold text-gray-900 font-mono">{purchase.creditPurchaseId || purchase._id?.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500"><Trans>Purchase Date</Trans></span>
                            <span className="text-sm font-medium text-gray-900">
                                {new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500"><Trans>Original Amount</Trans></span>
                            <span className="text-sm font-medium text-gray-900">₹{baseAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500"><Trans>Applied Rate</Trans></span>
                            <span className={cn(
                                "text-sm font-medium px-2 py-0.5 rounded-lg",
                                tierType === 'discount' ? "bg-emerald-50 text-emerald-700" :
                                    tierType === 'interest' ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-700"
                            )}>
                                {tierApplied}
                            </span>
                        </div>
                    </div>

                    {/* Partial Payment Notice - Only show for partial payments */}
                    {isPartial && (
                        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 mb-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-amber-900 mb-2">
                                        <Trans>Remaining Balance Information</Trans>
                                    </h4>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        {tierType === 'discount' ? (
                                            <Trans>
                                                Since you are making a partial payment of <span className="font-semibold">₹{displayAmount.toLocaleString('en-IN')}</span>,
                                                you will receive a <span className="font-semibold">{tierApplied}</span> discount
                                                on the remaining balance of <span className="font-semibold">₹{remainingBalance.toLocaleString('en-IN')}</span> when
                                                you complete the payment within the applicable period.
                                            </Trans>
                                        ) : tierType === 'interest' ? (
                                            <Trans>
                                                Since you are making a partial payment of <span className="font-semibold">₹{displayAmount.toLocaleString('en-IN')}</span>,
                                                an interest charge based on <span className="font-semibold">{tierApplied}</span> will apply
                                                to the remaining balance of <span className="font-semibold">₹{remainingBalance.toLocaleString('en-IN')}</span> when
                                                you complete the payment.
                                            </Trans>
                                        ) : (
                                            <Trans>
                                                You are making a partial payment of <span className="font-semibold">₹{displayAmount.toLocaleString('en-IN')}</span>.
                                                The remaining balance is <span className="font-semibold">₹{remainingBalance.toLocaleString('en-IN')}</span>.
                                            </Trans>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guidance Text */}
                    <div className="bg-blue-50/50 rounded-xl p-3 flex gap-3 mb-4">
                        <Globe className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                            <Trans>You will be redirected to Razorpay's secure checkout page. Please do not close the window until the transaction is complete.</Trans>
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-2 shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
                        >
                            <Trans>Cancel</Trans>
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className="px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2 group"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span><Trans>Processing...</Trans></span>
                                </>
                            ) : (
                                <>
                                    <span><Trans>Pay Now</Trans></span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
