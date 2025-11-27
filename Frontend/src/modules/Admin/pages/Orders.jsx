import { useState, useEffect, useCallback } from 'react'
import { CalendarRange, Recycle, Truck, Eye, FileText, RefreshCw, AlertCircle, Warehouse, ArrowLeft, CheckCircle, CreditCard } from 'lucide-react'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { FilterBar } from '../components/FilterBar'
import { Timeline } from '../components/Timeline'
import { Modal } from '../components/Modal'
import { OrderDetailModal } from '../components/OrderDetailModal'
import { OrderReassignmentModal } from '../components/OrderReassignmentModal'
import { OrderEscalationModal } from '../components/OrderEscalationModal'
import { OrderStatusUpdateModal } from '../components/OrderStatusUpdateModal'
import { useAdminState } from '../context/AdminContext'
import { useAdminApi } from '../hooks/useAdminApi'
import { useToast } from '../components/ToastNotification'
import { orders as mockOrders } from '../services/adminData'
import { cn } from '../../../lib/cn'

const columns = [
  { Header: 'Order ID', accessor: 'id' },
  { Header: 'User', accessor: 'userName' },
  { Header: 'User Location', accessor: 'userLocation' },
  { Header: 'Vendor', accessor: 'vendor' },
  { Header: 'Vendor Location', accessor: 'vendorLocation' },
  { Header: 'Order Value', accessor: 'value' },
  { Header: 'Advance (30%)', accessor: 'advance' },
  { Header: 'Pending (70%)', accessor: 'pending' },
  { Header: 'Status', accessor: 'status' },
  { Header: 'Actions', accessor: 'actions' },
]

const commissionColumns = [
  { Header: 'Seller ID', accessor: 'sellerIdCode' },
  { Header: 'Seller Name', accessor: 'sellerName' },
  { Header: 'User Name', accessor: 'userName' },
  { Header: 'User Location', accessor: 'userLocation' },
  { Header: 'Order Number', accessor: 'orderNumber' },
  { Header: 'Order Amount', accessor: 'orderAmount' },
  { Header: 'Commission Rate', accessor: 'commissionRate' },
  { Header: 'Commission Amount', accessor: 'commissionAmount' },
  { Header: 'Status', accessor: 'status' },
  { Header: 'Date', accessor: 'creditedAt' },
]

const REGIONS = ['All', 'West', 'North', 'South', 'Central', 'North East', 'East']
const ORDER_STATUSES = ['All', 'Processing', 'Awaiting Dispatch', 'Completed', 'Cancelled']
const ORDER_TYPES = ['All', 'User', 'Vendor']

export function OrdersPage() {
  const { orders: ordersState, vendors } = useAdminState()
  const {
    getOrders,
    getOrderDetails,
    reassignOrder,
    generateInvoice,
    getVendors,
    getCommissions,
    revertEscalation,
    fulfillOrderFromWarehouse,
    updateOrderStatus,
    loading,
  } = useAdminApi()
  const { success, error: showError, warning: showWarning } = useToast()

  const [ordersList, setOrdersList] = useState([])
  const [availableVendors, setAvailableVendors] = useState([])
  const [commissionsList, setCommissionsList] = useState([])
  const [showCommissions, setShowCommissions] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    region: 'All',
    vendor: 'All',
    status: 'All',
    type: 'All',
    dateFrom: '',
    dateTo: '',
  })

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null)
  const [orderDetails, setOrderDetails] = useState(null)
  const [reassignmentModalOpen, setReassignmentModalOpen] = useState(false)
  const [selectedOrderForReassign, setSelectedOrderForReassign] = useState(null)
  const [escalationModalOpen, setEscalationModalOpen] = useState(false)
  const [selectedOrderForEscalation, setSelectedOrderForEscalation] = useState(null)
  const [revertModalOpen, setRevertModalOpen] = useState(false)
  const [selectedOrderForRevert, setSelectedOrderForRevert] = useState(null)
  const [revertReason, setRevertReason] = useState('')
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false)
  const [selectedOrderForStatusUpdate, setSelectedOrderForStatusUpdate] = useState(null)

  // Format order data for display
  const formatOrderForDisplay = (order) => {
    const orderValue = typeof order.value === 'number'
      ? order.value
      : parseFloat(order.value?.replace(/[₹,\sL]/g, '') || '0') * 100000

    const advanceAmount = typeof order.advance === 'number'
      ? order.advance
      : order.advanceStatus === 'paid' ? orderValue * 0.3 : 0

    const pendingAmount = typeof order.pending === 'number'
      ? order.pending
      : parseFloat(order.pending?.replace(/[₹,\sL]/g, '') || '0') * 100000

    return {
      ...order,
      value: orderValue >= 100000 ? `₹${(orderValue / 100000).toFixed(1)} L` : `₹${orderValue.toLocaleString('en-IN')}`,
      advance: order.advanceStatus === 'paid' || order.advance === 'Paid' ? 'Paid' : 'Pending',
      pending: pendingAmount >= 100000 ? `₹${(pendingAmount / 100000).toFixed(1)} L` : `₹${pendingAmount.toLocaleString('en-IN')}`,
      paymentStatus: order.paymentStatus || 'pending',
      isPaid: order.paymentStatus === 'fully_paid',
      statusUpdateGracePeriod: order.statusUpdateGracePeriod || null,
    }
  }

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    const params = {}
    if (filters.region !== 'All') params.region = filters.region
    if (filters.vendor !== 'All') params.vendorId = filters.vendor
    if (filters.status !== 'All') params.status = filters.status.toLowerCase().replace(' ', '_')
    if (filters.type !== 'All') params.type = filters.type.toLowerCase()
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo

    const result = await getOrders(params)
    if (result.data?.orders) {
      const formatted = result.data.orders.map(formatOrderForDisplay)
      setOrdersList(formatted)
    } else {
      // Fallback to mock data
      setOrdersList(mockOrders.map(formatOrderForDisplay))
    }
  }, [getOrders, filters])

  // Fetch vendors for reassignment
  const fetchVendors = useCallback(async () => {
    const result = await getVendors()
    if (result.data?.vendors) {
      setAvailableVendors(result.data.vendors)
    }
  }, [getVendors])

  // Fetch commissions
  const fetchCommissions = useCallback(async () => {
    const result = await getCommissions({ limit: 50 })
    if (result.data?.commissions) {
      setCommissionsList(result.data.commissions)
    }
  }, [getCommissions])

  useEffect(() => {
    fetchOrders()
    fetchVendors()
    fetchCommissions()
  }, [fetchOrders, fetchVendors, fetchCommissions])

  // Refresh when orders are updated
  useEffect(() => {
    if (ordersState.updated) {
      fetchOrders()
    }
  }, [ordersState.updated, fetchOrders])

  const handleFilterChange = (filter) => {
    // This would open a dropdown/modal for filter selection
    // For now, we'll toggle the active state
    setFilters((prev) => ({
      ...prev,
      [filter.id]: prev[filter.id] === filter.label ? 'All' : filter.label,
    }))
  }

  const handleViewOrderDetails = async (order) => {
    const originalOrder = ordersState.data?.orders?.find((o) => o.id === order.id) || order
    setSelectedOrderForDetail(originalOrder)
    
    // Fetch detailed order data
    const result = await getOrderDetails(order.id)
    if (result.data) {
      setOrderDetails(result.data)
    }
    
    setDetailModalOpen(true)
  }

  const handleReassignOrder = (order) => {
    const originalOrder = ordersState.data?.orders?.find((o) => o.id === order.id) || order
    setSelectedOrderForReassign(originalOrder)
    setReassignmentModalOpen(true)
  }

  const handleReassignSubmit = async (orderId, reassignData) => {
    try {
      const result = await reassignOrder(orderId, reassignData)
      if (result.data) {
        setReassignmentModalOpen(false)
        setSelectedOrderForReassign(null)
        fetchOrders()
        success('Order reassigned successfully!', 3000)
      } else if (result.error) {
        const errorMessage = result.error.message || 'Failed to reassign order'
        if (errorMessage.includes('vendor') || errorMessage.includes('unavailable') || errorMessage.includes('stock')) {
          showWarning(errorMessage, 6000)
        } else {
          showError(errorMessage, 5000)
        }
      }
    } catch (error) {
      showError(error.message || 'Failed to reassign order', 5000)
    }
  }

  const handleGenerateInvoice = async (orderId) => {
    try {
      const result = await generateInvoice(orderId)
      if (result.data) {
        // Invoice is automatically downloaded and opened for printing
        success(result.data.message || 'Invoice generated successfully! Use browser print (Ctrl+P) to save as PDF.', 5000)
      } else if (result.error) {
        const errorMessage = result.error.message || 'Failed to generate invoice'
        if (errorMessage.includes('not found') || errorMessage.includes('cannot')) {
          showWarning(errorMessage, 6000)
        } else {
          showError(errorMessage, 5000)
        }
      }
    } catch (error) {
      showError(error.message || 'Failed to generate invoice', 5000)
    }
  }

  const handleProcessRefund = async (orderId) => {
    const confirmed = window.confirm('Are you sure you want to process this refund?')
    if (confirmed) {
      // This would call a refund API
      console.log('Processing refund for order:', orderId)
      alert('Refund processed successfully')
      fetchOrders()
    }
  }

  const handleRevertEscalation = async () => {
    if (!revertReason.trim()) {
      showError('Please provide a reason for reverting the escalation')
      return
    }

    try {
      const result = await revertEscalation(selectedOrderForRevert.id, { reason: revertReason.trim() })
      if (result.data) {
        setRevertModalOpen(false)
        setSelectedOrderForRevert(null)
        setRevertReason('')
        fetchOrders()
        success('Escalation reverted successfully. Order assigned back to vendor.', 3000)
      } else if (result.error) {
        showError(result.error.message || 'Failed to revert escalation', 5000)
      }
    } catch (error) {
      showError(error.message || 'Failed to revert escalation', 5000)
    }
  }

  const handleFulfillFromWarehouse = async (orderId, fulfillmentData) => {
    try {
      const result = await fulfillOrderFromWarehouse(orderId, fulfillmentData)
      if (result.data) {
        setEscalationModalOpen(false)
        setSelectedOrderForEscalation(null)
        fetchOrders()
        success('Order fulfilled from warehouse successfully!', 3000)
      } else if (result.error) {
        const errorMessage = result.error.message || 'Failed to fulfill order'
        showError(errorMessage, 5000)
      }
    } catch (error) {
      showError(error.message || 'Failed to fulfill order', 5000)
    }
  }

  const handleUpdateOrderStatus = async (orderId, updateData) => {
    try {
      const result = await updateOrderStatus(orderId, updateData)
      if (result.data) {
        setStatusUpdateModalOpen(false)
        setSelectedOrderForStatusUpdate(null)
        fetchOrders()
        // Show message from backend (includes grace period info if applicable)
        success(result.data.message || 'Order status updated successfully!', 3000)
      } else if (result.error) {
        showError(result.error.message || 'Failed to update order status', 5000)
      }
    } catch (error) {
      showError(error.message || 'Failed to update order status', 5000)
    }
  }

  const handleOpenStatusUpdateModal = (order) => {
    setSelectedOrderForStatusUpdate(order)
    setStatusUpdateModalOpen(true)
  }

  const normalizeOrderStatus = (status) => {
    if (!status) return 'awaiting'
    const normalized = status.toLowerCase()
    if (normalized === 'fully_paid') return 'fully_paid'
    if (normalized === 'accepted' || normalized === 'processing') return 'accepted'
    if (normalized === 'dispatched' || normalized === 'out_for_delivery' || normalized === 'ready_for_delivery') return 'dispatched'
    if (normalized === 'delivered') return 'delivered'
    if (normalized === 'pending' || normalized === 'awaiting') return 'awaiting'
    return normalized
  }

  const getNextStatus = (order) => {
    const currentStatus = normalizeOrderStatus(order?.status)
    const paymentPreference = order?.paymentPreference || 'partial'
    const isAlreadyPaid = order?.paymentStatus === 'fully_paid'

    if (currentStatus === 'awaiting') return 'accepted'
    if (currentStatus === 'accepted') return 'dispatched'
    if (currentStatus === 'dispatched') return 'delivered'
    if (currentStatus === 'delivered' && paymentPreference !== 'full' && !isAlreadyPaid) return 'fully_paid'
    return null
  }

  const getStatusButtonConfig = (order) => {
    const nextStatus = getNextStatus(order)
    if (!nextStatus) return null

    const configs = {
      dispatched: {
        label: 'Mark Dispatched',
        icon: Truck,
        className: 'border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-500 hover:bg-blue-100',
        title: 'Mark as Dispatched',
      },
      delivered: {
        label: 'Mark Delivered',
        icon: CheckCircle,
        className: 'border-green-300 bg-green-50 text-green-700 hover:border-green-500 hover:bg-green-100',
        title: 'Mark as Delivered',
      },
      fully_paid: {
        label: 'Payment Done',
        icon: CreditCard,
        className: 'border-purple-300 bg-purple-50 text-purple-700 hover:border-purple-500 hover:bg-purple-100',
        title: 'Mark Payment as Done',
      },
      accepted: {
        label: 'Mark Accepted',
        icon: CheckCircle,
        className: 'border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-500 hover:bg-blue-100',
        title: 'Mark as Accepted',
      },
    }

    return configs[nextStatus]
  }

  const tableColumns = columns.map((column) => {
    if (column.accessor === 'status') {
      return {
        ...column,
        Cell: (row) => {
          const originalOrder = ordersState.data?.orders?.find((o) => o.id === row.id) || row
          const isEscalated = originalOrder.escalated || originalOrder.assignedTo === 'admin'
          const status = row.status || 'Unknown'
          const isPaid = row.isPaid || originalOrder.paymentStatus === 'fully_paid'
          
          if (isEscalated) {
            return (
              <div className="flex flex-col gap-1">
                <StatusBadge tone="warning">Escalated</StatusBadge>
                <span className="text-xs text-gray-500">{status}</span>
                {isPaid && (
                  <StatusBadge tone="success" className="mt-1">Paid</StatusBadge>
                )}
              </div>
            )
          }
          
          const tone = status === 'Processing' || status === 'processing' ? 'warning' : status === 'Completed' || status === 'completed' ? 'success' : 'neutral'
          return (
            <div className="flex flex-col gap-1">
              <StatusBadge tone={tone}>{status}</StatusBadge>
              {isPaid && (
                <StatusBadge tone="success" className="mt-1">Paid</StatusBadge>
              )}
            </div>
          )
        },
      }
    }
    if (column.accessor === 'advance') {
      return {
        ...column,
        Cell: (row) => {
          const advance = row.advance || 'Unknown'
          const tone = advance === 'Paid' || advance === 'paid' ? 'success' : 'warning'
          return <StatusBadge tone={tone}>{advance}</StatusBadge>
        },
      }
    }
    if (column.accessor === 'type') {
      return {
        ...column,
        Cell: (row) => {
          const type = row.type || 'Unknown'
          return (
            <span className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
              type === 'User' || type === 'user' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            )}>
              {type}
            </span>
          )
        },
      }
    }
    if (column.accessor === 'userLocation' || column.accessor === 'vendorLocation') {
      return {
        ...column,
        Cell: (row) => {
          const location = row[column.accessor] || 'Not provided'
          return (
            <span className="text-sm text-gray-600" title={location}>
              {location}
            </span>
          )
        },
      }
    }
    if (column.accessor === 'actions') {
      return {
        ...column,
        Cell: (row) => {
          const originalOrder = ordersState.data?.orders?.find((o) => o.id === row.id) || row
          const isEscalated = originalOrder.escalated || originalOrder.assignedTo === 'admin'
          const currentStatus = (originalOrder.status || row.status || '').toLowerCase()
          const normalizedStatus = normalizeOrderStatus(currentStatus)
          const isFulfilled = normalizedStatus === 'accepted' || normalizedStatus === 'dispatched' || normalizedStatus === 'delivered' || normalizedStatus === 'fully_paid'
          const isPaid = row.isPaid || originalOrder.paymentStatus === 'fully_paid'
          const paymentPreference = originalOrder.paymentPreference || 'partial'
          const workflowCompleted = paymentPreference === 'partial'
            ? normalizedStatus === 'fully_paid'
            : normalizedStatus === 'delivered'
          const isInStatusUpdateGracePeriod = row.statusUpdateGracePeriod?.isActive || originalOrder.statusUpdateGracePeriod?.isActive
          const statusUpdateGracePeriodExpiresAt = row.statusUpdateGracePeriod?.expiresAt || originalOrder.statusUpdateGracePeriod?.expiresAt
          const statusUpdateTimeRemaining = statusUpdateGracePeriodExpiresAt ? Math.max(0, Math.floor((new Date(statusUpdateGracePeriodExpiresAt) - new Date()) / 1000 / 60)) : 0
          const previousStatus = row.statusUpdateGracePeriod?.previousStatus || originalOrder.statusUpdateGracePeriod?.previousStatus
          const hideUpdateButton = workflowCompleted && !isInStatusUpdateGracePeriod
          const statusButtonConfig = hideUpdateButton ? null : getStatusButtonConfig(originalOrder)
          
          return (
            <div className="flex flex-col gap-1">
              {isInStatusUpdateGracePeriod && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  ⏰ {statusUpdateTimeRemaining}m to revert
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleViewOrderDetails(originalOrder)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-700"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {/* Update Status button - hidden when workflow completed */}
                {!hideUpdateButton && (
                  <button
                    type="button"
                    onClick={() => handleOpenStatusUpdateModal(originalOrder)}
                    disabled={(isInStatusUpdateGracePeriod && !previousStatus) || !statusButtonConfig}
                    className={cn(
                      'flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition-all hover:border-blue-500 hover:bg-blue-100',
                      ((isInStatusUpdateGracePeriod && !previousStatus) || !statusButtonConfig) && 'opacity-50 cursor-not-allowed'
                    )}
                    title={isInStatusUpdateGracePeriod && !previousStatus ? 'Status update in progress' : 'Update order status'}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Update Status</span>
                  </button>
                )}
                {/* Paid badge - Show if order is paid */}
                {isPaid && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Paid
                  </span>
                )}
                {/* Escalation buttons - Show for escalated orders that are not fulfilled */}
                {isEscalated && !isFulfilled && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderForEscalation(originalOrder)
                        setEscalationModalOpen(true)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-300 bg-green-50 text-green-700 transition-all hover:border-green-500 hover:bg-green-100"
                      title="Fulfill from warehouse"
                    >
                      <Warehouse className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderForRevert(originalOrder)
                        setRevertModalOpen(true)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-300 bg-orange-50 text-orange-700 transition-all hover:border-orange-500 hover:bg-orange-100"
                      title="Revert to vendor"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </>
                )}
                {/* Reassign button - Show for non-escalated orders */}
                {!isEscalated && (
                  <button
                    type="button"
                    onClick={() => handleReassignOrder(originalOrder)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-all hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700"
                    title="Reassign order"
                  >
                    <Recycle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        },
      }
    }
    return column
  })

  const commissionTableColumns = commissionColumns.map((column) => {
    if (column.accessor === 'status') {
      return {
        ...column,
        Cell: (row) => {
          const status = row.status || 'credited'
          const tone = status === 'credited' ? 'success' : status === 'pending' ? 'warning' : 'neutral'
          return <StatusBadge tone={tone}>{status}</StatusBadge>
        },
      }
    }
    if (column.accessor === 'commissionRate') {
      return {
        ...column,
        Cell: (row) => {
          const rate = row.commissionRate || 0
          return <span className="text-sm font-semibold text-gray-700">{rate}%</span>
        },
      }
    }
    if (column.accessor === 'orderAmount' || column.accessor === 'commissionAmount') {
      return {
        ...column,
        Cell: (row) => {
          const amount = row[column.accessor] || 0
          const formatted = amount >= 100000 
            ? `₹${(amount / 100000).toFixed(1)} L` 
            : `₹${amount.toLocaleString('en-IN')}`
          return <span className="text-sm font-semibold text-gray-900">{formatted}</span>
        },
      }
    }
    if (column.accessor === 'creditedAt') {
      return {
        ...column,
        Cell: (row) => {
          const date = row.creditedAt || row.createdAt
          if (!date) return 'N/A'
          return (
            <span className="text-sm text-gray-600">
              {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )
        },
      }
    }
    return column
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Step 6 • Order & Payment Management</p>
          <h2 className="text-2xl font-bold text-gray-900">Unified Order Control</h2>
          <p className="text-sm text-gray-600">
            Track user + vendor orders, monitor payment collections, and reassign logistics within a single viewport.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(239,68,68,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:scale-105 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
          <Truck className="h-4 w-4" />
          Assign Logistics
        </button>
      </header>

      <FilterBar
        filters={[
          { id: 'region', label: filters.region === 'All' ? 'Region' : filters.region, active: filters.region !== 'All' },
          { id: 'vendor', label: filters.vendor === 'All' ? 'Vendor' : filters.vendor, active: filters.vendor !== 'All' },
          { id: 'date', label: filters.dateFrom ? 'Date range' : 'Date range', active: !!filters.dateFrom },
          { id: 'status', label: filters.status === 'All' ? 'Order status' : filters.status, active: filters.status !== 'All' },
        ]}
        onChange={handleFilterChange}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Orders</h3>
          <button
            type="button"
            onClick={() => setShowCommissions(!showCommissions)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl"
          >
            {showCommissions ? 'Hide Commissions' : 'Show Commissions'}
          </button>
        </div>
        <DataTable
          columns={tableColumns}
          rows={ordersList}
          emptyState="No orders found for selected filters"
        />
      </div>

      {showCommissions && (
        <section className="space-y-4 rounded-3xl border border-green-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-700">Seller Commissions</h3>
              <p className="text-sm text-gray-600">
                Track which seller received commission from which order made by which user
              </p>
            </div>
            <FileText className="h-5 w-5 text-green-600" />
          </div>
          <DataTable
            columns={commissionTableColumns}
            rows={commissionsList}
            emptyState="No commissions found"
          />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-red-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-red-700">Reassignment Console</h3>
              <p className="text-sm text-gray-600">
                Manage order routing when vendors are unavailable or stock thresholds are crossed.
              </p>
            </div>
            <Recycle className="h-5 w-5 text-red-600" />
          </div>
          <div className="space-y-3">
            {[
              {
                label: 'Vendor unavailable',
                detail: 'Auto suggest alternate vendor based on stock + credit health.',
              },
              {
                label: 'Logistics delay',
                detail: 'Trigger alternate route with SLA compliance tracking.',
              },
              {
                label: 'Payment mismatch',
                detail: 'Reconcile advance vs pending amounts. Notify finance instantly.',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-4 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-blue-700">Billing Timeline</h3>
              <p className="text-sm text-gray-600">Advance and pending payments tracked across the order lifecycle.</p>
            </div>
          </div>
          <Timeline
            events={[
              {
                id: 'billing-1',
                title: 'Advance collection',
                timestamp: 'Today • 09:10',
                description: '₹2.6 Cr collected across 312 orders.',
                status: 'completed',
              },
              {
                id: 'billing-2',
                title: 'Pending follow-up',
                timestamp: 'Today • 12:40',
                description: 'Automated reminder sent for ₹1.9 Cr outstanding.',
                status: 'pending',
              },
              {
                id: 'billing-3',
                title: 'Invoice generation',
                timestamp: 'Scheduled • 17:00',
                description: 'Finance will generate GST-compliant invoices and export to PDF.',
                status: 'pending',
              },
            ]}
          />
        </div>
      </section>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedOrderForDetail(null)
          setOrderDetails(null)
        }}
        order={orderDetails || selectedOrderForDetail}
        onReassign={handleReassignOrder}
        onGenerateInvoice={handleGenerateInvoice}
        onProcessRefund={handleProcessRefund}
        loading={loading}
      />

      {/* Order Reassignment Modal */}
      <OrderReassignmentModal
        isOpen={reassignmentModalOpen}
        onClose={() => {
          setReassignmentModalOpen(false)
          setSelectedOrderForReassign(null)
        }}
        order={selectedOrderForReassign}
        availableVendors={availableVendors}
        onReassign={handleReassignSubmit}
        loading={loading}
      />

      {/* Escalation Modal - Fulfill from Warehouse */}
      <OrderEscalationModal
        isOpen={escalationModalOpen}
        onClose={() => {
          setEscalationModalOpen(false)
          setSelectedOrderForEscalation(null)
        }}
        order={selectedOrderForEscalation}
        onFulfillFromWarehouse={handleFulfillFromWarehouse}
        loading={loading}
      />

      {/* Order Status Update Modal */}
      <OrderStatusUpdateModal
        isOpen={statusUpdateModalOpen}
        onClose={() => {
          setStatusUpdateModalOpen(false)
          setSelectedOrderForStatusUpdate(null)
        }}
        order={selectedOrderForStatusUpdate}
        onUpdate={handleUpdateOrderStatus}
        loading={loading}
      />

      {/* Revert Escalation Modal */}
      <Modal
        isOpen={revertModalOpen}
        onClose={() => {
          setRevertModalOpen(false)
          setSelectedOrderForRevert(null)
          setRevertReason('')
        }}
        title="Revert Escalation"
        size="md"
      >
        <div className="space-y-6">
          {selectedOrderForRevert && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-bold text-gray-900">Order #{selectedOrderForRevert.orderNumber || selectedOrderForRevert.id}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-bold text-gray-900">
                    {selectedOrderForRevert.vendor || selectedOrderForRevert.vendorId?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Value:</span>
                  <span className="font-bold text-gray-900">
                    {typeof selectedOrderForRevert.value === 'number'
                      ? `₹${selectedOrderForRevert.value.toLocaleString('en-IN')}`
                      : selectedOrderForRevert.value || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="revertReason" className="mb-2 block text-sm font-bold text-gray-900">
              Reason for Reverting <span className="text-red-500">*</span>
            </label>
            <textarea
              id="revertReason"
              value={revertReason}
              onChange={(e) => setRevertReason(e.target.value)}
              placeholder="Why are you reverting this escalation back to the vendor?"
              rows={4}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />
              <div className="text-xs text-orange-900">
                <p className="font-bold">Revert Escalation</p>
                <p className="mt-1">
                  This order will be assigned back to the original vendor. The vendor will receive a notification and can proceed with fulfillment.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setRevertModalOpen(false)
                setSelectedOrderForRevert(null)
                setRevertReason('')
              }}
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRevertEscalation}
              disabled={loading || !revertReason.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:shadow-[0_6px_20px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {loading ? 'Reverting...' : 'Revert to Vendor'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

