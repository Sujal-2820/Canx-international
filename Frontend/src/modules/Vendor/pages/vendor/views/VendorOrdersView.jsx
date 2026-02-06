import { useState, useEffect, useCallback, useMemo } from 'react'
import { useVendorState, useVendorDispatch } from '../../../context/VendorContext'
import { useVendorApi } from '../../../hooks/useVendorApi'
import {
    TruckIcon,
    PackageIcon,
    ClockIcon,
    CheckIcon,
    ChevronRightIcon,
    CreditIcon,
    AlertCircleIcon,
    ArrowUpRightIcon,
    WalletIcon,
    ReportIcon
} from '../../../components/icons'
import { VendorInvoice } from '../../../components/VendorInvoice'
import { cn } from '../../../../../lib/cn'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'
import CreditSummaryWidget from '../../../components/CreditSummaryWidget'
import RepaymentCalculator from '../../../components/RepaymentCalculator'
import { useToast } from '../../../components/ToastNotification'

export function VendorOrdersView() {
    const { dashboard, profile } = useVendorState()
    const dispatch = useVendorDispatch()
    const {
        getCreditPurchases,
        getCreditInfo,
        getCreditSummary,
        getCreditPurchaseDetails,
        getPendingPurchases,
        calculateRepaymentAmount,
        getRepaymentProjection,
        submitRepayment,
        initiateRepayment,
        verifyRepayment
    } = useVendorApi()
    const { success, error } = useToast()

    // State for tabs
    const [activeTab, setActiveTab] = useState('active') // 'active', 'repayment', 'history'

    // Data state
    const [orders, setOrders] = useState([])
    const [creditInfo, setCreditInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

    // Detail view state
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showDetails, setShowDetails] = useState(false)
    const [showInvoice, setShowInvoice] = useState(false)

    // Load data
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [ordersRes, creditRes] = await Promise.all([
                getCreditPurchases({ limit: 100 }), // Get many for local filtering
                getCreditSummary() // Get full credit summary with stats
            ])

            if (ordersRes.data?.purchases) {
                setOrders(ordersRes.data.purchases)
            }
            if (creditRes.data) {
                setCreditInfo(creditRes.data)
            }
        } catch (err) {
            console.error('Error loading vendor orders:', err)
        } finally {
            setLoading(false)
        }
    }, [getCreditPurchases, getCreditSummary])

    useEffect(() => {
        loadData()
    }, [loadData, refreshKey])

    // Filter orders based on tabs
    const filteredOrders = useMemo(() => {
        if (activeTab === 'active') {
            return orders.filter(o => ['pending', 'processing', 'approved', 'dispatched'].includes(o.status.toLowerCase()))
        } else if (activeTab === 'repayment') {
            // Unpaid orders that are delivered or completed
            return orders.filter(o =>
                ['delivered', 'completed'].includes(o.status.toLowerCase()) &&
                o.repaymentStatus !== 'paid'
            )
        } else if (activeTab === 'history') {
            return orders
        }
        return orders
    }, [orders, activeTab])

    const getStatusTone = (status) => {
        if (!status) return 'gray'
        const s = status.toLowerCase().replace(/_/g, ' ')
        if (['pending', 'awaiting'].includes(s)) return 'warn'
        if (['processing', 'approved', 'dispatched', 'in transit', 'scheduled'].includes(s)) return 'info'
        if (['completed', 'delivered', 'paid', 'fully paid', 'fully repaid'].includes(s)) return 'success'
        if (['rejected', 'cancelled', 'expired'].includes(s)) return 'error'
        return 'gray'
    }

    const getStatusDisplay = (order) => {
        // If the order is fully paid, that's the most important status to show
        if (order.repaymentStatus === 'completed' || order.cycleStatus === 'fully_paid' || order.status === 'fully_paid') {
            return 'Fully Repaid'
        }

        // Otherwise use the delivery or general status
        const status = order.deliveryStatus && order.deliveryStatus !== 'pending'
            ? order.deliveryStatus
            : order.status

        return status.replace(/_/g, ' ')
    }

    const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`

    const handleViewDetails = async (orderId) => {
        setLoading(true)
        try {
            const res = await getCreditPurchaseDetails(orderId)
            if (res.data) {
                setSelectedOrder(res.data.purchase || res.data)
                setShowDetails(true)
            }
        } catch (err) {
            error(<Trans>Failed to load order details</Trans>)
        } finally {
            setLoading(false)
        }
    }

    if (loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-400 text-sm animate-pulse"><Trans>Loading wholesale orders...</Trans></p>
            </div>
        )
    }

    return (
        <div className="vendor-orders-view space-y-6 pb-20 -mx-4 sm:mx-0">
            {/* Header / Hero Section */}
            <div className="px-4 py-6 bg-gradient-to-br from-blue-50 to-white border-b border-blue-100/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-6 bg-blue-600 rounded-full"></div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest"><Trans>Wholesale Terminal</Trans></span>
                </div>
                <h2 className="text-2xl font-light text-gray-900 tracking-tight"><Trans>Your Orders</Trans></h2>
                <p className="text-xs text-gray-500 mt-1"><Trans>Manage your inventory purchases and credit repayments</Trans></p>
            </div>

            {/* Credit Status Widget - Integrated into the page */}
            <div className="px-4">
                <CreditSummaryWidget
                    creditData={creditInfo}
                    onNavigateToCalculator={() => {
                        setActiveTab('repayment')
                        // Optional: Scroll to top of list if needed, but tab switch typically resets view focus contextually
                    }}
                />
            </div>

            {/* Internal Tabs */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 border-y border-gray-100">
                <div className="flex gap-6">
                    {[
                        { id: 'active', label: <Trans>Active</Trans>, icon: TruckIcon },
                        { id: 'repayment', label: <Trans>Repayments</Trans>, icon: WalletIcon },
                        { id: 'history', label: <Trans>History</Trans>, icon: ClockIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setShowDetails(false); }}
                            className={cn(
                                "flex items-center gap-2 py-4 text-xs font-bold transition-all relative",
                                activeTab === tab.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 space-y-6">
                {!showDetails ? (
                    <>
                        {/* Tab-specific Content */}
                        {activeTab === 'repayment' && (
                            <div className="repayment-section animate-in fade-in slide-in-from-top-2 duration-300">
                                <RepaymentCalculator
                                    vendorApi={{
                                        getPendingPurchases,
                                        calculateRepayment: calculateRepaymentAmount,
                                        getRepaymentProjection,
                                        submitRepayment,
                                        initiateRepayment,
                                        verifyRepayment
                                    }}
                                    onSuccess={() => setRefreshKey(k => k + 1)}
                                />
                            </div>
                        )}

                        {/* Orders List */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                <Trans>{activeTab} orders</Trans>
                            </h3>

                            {filteredOrders.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <PackageIcon className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400"><Trans>No orders found for this section</Trans></p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
                                    {filteredOrders.map(order => (
                                        <div
                                            key={order._id}
                                            onClick={() => handleViewDetails(order._id)}
                                            className="group bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">#{order.requestId?.slice(-6) || order._id?.slice(-6)}</span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                                            getStatusTone(getStatusDisplay(order)) === 'warn' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                                                getStatusTone(getStatusDisplay(order)) === 'info' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                                                    getStatusTone(getStatusDisplay(order)) === 'success' ? "bg-green-50 text-green-600 border border-green-100" :
                                                                        getStatusTone(getStatusDisplay(order)) === 'error' ? "bg-red-50 text-red-600 border border-red-100" :
                                                                            "bg-gray-50 text-gray-600 border border-gray-100"
                                                        )}>
                                                            <Trans>{getStatusDisplay(order)}</Trans>
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                                                </div>
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                    <ChevronRightIcon className="h-5 w-5" />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <ClockIcon className="h-3 w-3" />
                                                    <span className="text-[10px] font-medium uppercase truncate">
                                                        {new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <PackageIcon className="h-3 w-3 text-gray-300" />
                                                    <span className="text-[10px] font-medium text-gray-500">{order.items?.length || 0} <Trans>Items</Trans></span>
                                                </div>
                                            </div>

                                            {/* Repayment Progress indicator if applicable */}
                                            {order.repaymentStatus === 'partially_paid' && (
                                                <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: '50%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Order Details Sub-view */
                    <div className="animate-in slide-in-from-right duration-300 space-y-6">
                        <button
                            onClick={() => setShowDetails(false)}
                            className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
                        >
                            ← <Trans>Back to list</Trans>
                        </button>

                        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Detail</span>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 break-all">#{selectedOrder.requestId || selectedOrder._id}</h3>
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap",
                                        getStatusTone(getStatusDisplay(selectedOrder)) === 'warn' ? "bg-orange-100 text-orange-700" :
                                            getStatusTone(getStatusDisplay(selectedOrder)) === 'info' ? "bg-blue-100 text-blue-700" :
                                                getStatusTone(getStatusDisplay(selectedOrder)) === 'success' ? "bg-green-100 text-green-700" :
                                                    getStatusTone(getStatusDisplay(selectedOrder)) === 'error' ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-700"
                                    )}>
                                        <Trans>{getStatusDisplay(selectedOrder)}</Trans>
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Date</p>
                                        <p className="text-sm font-bold text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowInvoice(true)}
                                    className="mt-4 w-full flex items-center justify-center gap-3 py-3.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95"
                                >
                                    <ReportIcon className="h-4 w-4 text-blue-400" />
                                    <Trans>View Protected Invoice</Trans>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</h4>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                        <PackageIcon className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">{item.productName || item.productId?.name || item.name || <Trans>Unnamed Product</Trans>}</p>
                                                        <p className="text-[10px] text-gray-400">Qty: {item.quantity} {item.unit || 'units'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-gray-900">{formatCurrency(item.totalPrice || (item.unitPrice * item.quantity) || (item.price * item.quantity))}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedOrder.notes && (
                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <div className="flex gap-2 items-center mb-1">
                                            <AlertCircleIcon className="h-3 w-3 text-orange-500" />
                                            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Admin Notes</span>
                                        </div>
                                        <p className="text-xs text-orange-800 leading-relaxed">{selectedOrder.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Secure Invoice Modal Overlay */}
            {showInvoice && selectedOrder && (
                <VendorInvoice
                    order={selectedOrder}
                    vendor={profile}
                    onClose={() => setShowInvoice(false)}
                />
            )}
        </div>
    )
}
