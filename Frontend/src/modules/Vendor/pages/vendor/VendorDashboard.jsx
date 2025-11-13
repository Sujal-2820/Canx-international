import { useState } from 'react'
import { useVendorDispatch, useVendorState } from '../../context/VendorContext'
import { MobileShell } from '../../components/MobileShell'
import { BottomNavItem } from '../../components/BottomNavItem'
import { MenuList } from '../../components/MenuList'
import {
  BoxIcon,
  CartIcon,
  ChartIcon,
  CreditIcon,
  HomeIcon,
  MenuIcon,
  ReportIcon,
  SparkIcon,
  TruckIcon,
  WalletIcon,
} from '../../components/icons'
import { vendorSnapshot } from '../../services/vendorDashboard'
import { cn } from '../../../../lib/cn'

const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Orders, sales, and reminders',
    icon: HomeIcon,
  },
  {
    id: 'inventory',
    label: 'Inventory Manager',
    description: 'Current stock status',
    icon: BoxIcon,
  },
  {
    id: 'orders',
    label: 'Order Queue',
    description: 'Confirm availability and delivery',
    icon: CartIcon,
  },
  {
    id: 'credit',
    label: 'Credit Health',
    description: 'Limits, penalties, repayment',
    icon: CreditIcon,
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Weekly / monthly performance',
    icon: ReportIcon,
  },
]

export function VendorDashboard({ onLogout }) {
  const { profile } = useVendorState()
  const dispatch = useVendorDispatch()
  const [activeTab, setActiveTab] = useState('overview')

  const handleLogout = () => {
    dispatch({ type: 'AUTH_LOGOUT' })
    onLogout?.()
  }

  const navigateTo = (target) => {
    setActiveTab(target)
  }

  const buildMenuItems = (close) => [
    ...NAV_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      icon: <item.icon className="h-4 w-4" />,
      onSelect: () => {
        setActiveTab(item.id)
        close()
      },
    })),
    {
      id: 'logout',
      label: 'Sign out',
      icon: <MenuIcon className="h-4 w-4" />,
      description: 'Log out from vendor account',
      onSelect: () => {
        handleLogout()
        close()
      },
    },
  ]

  return (
    <MobileShell
      navigation={NAV_ITEMS.map((item) => (
        <BottomNavItem
          key={item.id}
          label={item.label}
          active={activeTab === item.id}
          onClick={() => setActiveTab(item.id)}
          icon={<item.icon active={activeTab === item.id} className="h-5 w-5" />}
      />
      ))}
      menuContent={({ close }) => <MenuList items={buildMenuItems(close)} active={activeTab} />}
    >
      <section className="space-y-6">
        {activeTab === 'overview' && <OverviewView onNavigate={navigateTo} />}
        {activeTab === 'inventory' && <InventoryView onNavigate={navigateTo} />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'credit' && <CreditView />}
        {activeTab === 'reports' && <ReportsView />}
      </section>
    </MobileShell>
  )
}

function OverviewView({ onNavigate }) {
  const [showActivitySheet, setShowActivitySheet] = useState(false)

  const services = [
    { label: 'Inventory', note: 'Reorder stock', tone: 'success', target: 'inventory', icon: BoxIcon },
    { label: 'Pricing', note: 'Update MRP', tone: 'warn', target: 'inventory', icon: ReportIcon },
    { label: 'Dispatch', note: 'Arrange truck', tone: 'success', target: 'orders', icon: TruckIcon },
    { label: 'Wallet', note: 'View payouts', tone: 'success', target: 'credit', icon: WalletIcon },
    { label: 'Performance', note: 'Reports', tone: 'success', target: 'reports', icon: ChartIcon },
    { label: 'Support', note: 'Raise ticket', tone: 'warn', target: 'orders', icon: MenuIcon },
    { label: 'Network', note: 'Partner list', tone: 'success', target: 'reports', icon: HomeIcon },
    { label: 'Settings', note: 'Profile & KYC', tone: 'success', target: 'credit', icon: CreditIcon },
  ]

  const transactions = [
    { name: 'Farm Fresh Traders', action: 'Order accepted', amount: '+₹86,200', status: 'Completed', avatar: 'FF' },
    { name: 'Green Valley Hub', action: 'Credit repayment', amount: '-₹40,000', status: 'Pending', avatar: 'GV' },
    { name: 'HarvestLink Pvt Ltd', action: 'Dispatch scheduled', amount: '+₹21,500', status: 'Scheduled', avatar: 'HL' },
  ]

  const heroActions = [
    { label: 'Inventory', icon: BoxIcon, target: 'inventory' },
    { label: 'Orders', icon: CartIcon, target: 'orders' },
    { label: 'Credit', icon: CreditIcon, target: 'credit' },
    { label: 'Reports', icon: ReportIcon, target: 'reports' },
    { label: 'Logistics', icon: TruckIcon, target: 'orders' },
  ]

  const walletBalance = vendorSnapshot.credit.remaining || '₹0'

  const quickActions = [
    {
      label: 'Confirm delivery slot',
      description: 'Assign logistics window',
      target: 'orders',
      icon: TruckIcon,
      tone: 'green',
    },
    {
      label: 'Update inventory batch',
      description: 'Add new GRN / update stock',
      target: 'inventory',
      icon: BoxIcon,
      tone: 'orange',
    },
    {
      label: 'Raise credit order',
      description: 'Request refill from admin',
      target: 'credit',
      icon: CreditIcon,
      tone: 'teal',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="vendor-gradient-card p-6">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="vendor-chip success uppercase tracking-wide">
              Active Zone • {vendorSnapshot.welcome.coverageKm} km
            </span>
            <span className="vendor-chip warn uppercase tracking-wide">Today {new Date().toLocaleDateString()}</span>
          </div>
          <h2 className="vendor-hero-title">
            Morning brief, {vendorSnapshot.welcome.name.split(' ')[0]}
          </h2>
          <div className="vendor-hero-balance">
            <div>
              <p className="vendor-hero-label">Wallet balance</p>
              <p className="vendor-hero-value">{walletBalance}</p>
            </div>
            <button type="button" onClick={() => onNavigate('credit')} className="vendor-hero-cta">
              Credit center
            </button>
          </div>
          <div className="vendor-hero-actions">
            {heroActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onNavigate(action.target)}
                className="vendor-hero-action"
              >
                <action.icon className="h-5 w-5" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Order confirmations pending', value: '02', tone: 'warn' },
              { label: 'Credit reminder today', value: '₹1.2L', tone: 'success' },
              { label: 'Average delivery time', value: '21h', tone: 'success' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/30 bg-white/40 px-4 py-3 text-xs font-medium text-surface-foreground shadow-sm backdrop-blur"
              >
                <p className="text-[11px] uppercase tracking-wide text-surface-foreground/60">{item.label}</p>
                <p className="mt-1 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="vendor-section-title">Other services</h3>
        <div className="vendor-service-carousel">
          {services.map((service) => (
            <button
              key={service.label}
              type="button"
              onClick={() => service.target && onNavigate(service.target)}
              className="vendor-service-card"
            >
              <div className={cn('vendor-service-icon', service.tone === 'warn' ? 'warn' : 'success')}>
                <service.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-surface-foreground">{service.label}</p>
                <p className="text-xs text-muted-foreground">{service.note}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="vendor-section-title">Recent activity</h3>
          <button type="button" onClick={() => setShowActivitySheet(true)} className="text-xs font-semibold text-brand">
            See all
          </button>
        </div>
        <div className="space-y-2">
          {transactions.map((item) => (
            <div key={item.name} className="vendor-transaction-card">
              <div className="vendor-transaction-avatar">{item.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-surface-foreground">{item.name}</p>
                  <p className={cn('text-sm font-semibold', item.amount.startsWith('-') ? 'text-accent' : 'text-brand')}>
                    {item.amount}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.action}</span>
                  <span>{item.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showActivitySheet ? (
        <div className="vendor-activity-sheet">
          <div className="vendor-activity-sheet__overlay" onClick={() => setShowActivitySheet(false)} />
          <div className="vendor-activity-sheet__panel">
            <div className="vendor-activity-sheet__header">
              <h4>All activity</h4>
              <button type="button" onClick={() => setShowActivitySheet(false)}>
                Close
              </button>
            </div>
            <div className="vendor-activity-sheet__body">
              {[...transactions, ...transactions].map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="vendor-transaction-card">
                  <div className="vendor-transaction-avatar">{item.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-surface-foreground">{item.name}</p>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          item.amount.startsWith('-') ? 'text-accent' : 'text-brand',
                        )}
                      >
                        {item.amount}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.action}</span>
                      <span>{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <h3 className="vendor-section-title">Snapshot</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {vendorSnapshot.highlights.map((item) => (
            <div key={item.id} className="vendor-card overflow-hidden border border-muted/40 bg-white/95 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <span className="vendor-pill bg-linear-to-r from-brand-soft/70 to-brand-soft/30 text-brand">{item.trend}</span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-surface-foreground">{item.value}</p>
              <div className="mt-4 vendor-progress">
                <span style={{ width: item.id === 'orders' ? '78%' : item.id === 'inventory' ? '64%' : '92%' }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="vendor-section-title">Quick actions</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((action, idx) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onNavigate(action.target)}
              className={cn(
                'vendor-action-card text-left transition hover:-translate-y-1',
                action.tone === 'orange'
                  ? 'vendor-action-card--orange'
                  : action.tone === 'teal'
                  ? 'vendor-action-card--teal'
                  : 'vendor-action-card--green',
              )}
            >
              <action.icon className="mb-3 h-5 w-5 text-brand" />
              <p className="text-sm font-semibold text-surface-foreground">{action.label}</p>
              <p className="text-xs text-surface-foreground/70">{action.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function InventoryView() {
  const inventoryStats = [
    { label: 'Total SKUs', value: '18', meta: '+2 added this week', tone: 'success' },
    { label: 'Critical SKUs', value: '3', meta: 'Needs procurement', tone: 'warn' },
    { label: 'Average stock health', value: '74%', meta: 'Based on safety buffers', tone: 'success' },
  ]

  const stockProgress = {
    Healthy: 86,
    Low: 48,
    Critical: 22,
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="vendor-section-title">Your Inventory</h2>
        <p className="vendor-section-subtitle">
          Keep fulfilment ready by tracking safety buffers, pricing and replenishment in one place.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {inventoryStats.map((stat) => (
          <div
            key={stat.label}
            className="vendor-card border border-muted/35 bg-white/95 p-4 shadow-card transition hover:-translate-y-1 hover:border-brand/40"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold text-surface-foreground">{stat.value}</p>
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                stat.tone === 'success' ? 'text-brand' : 'text-accent',
              )}
            >
              {stat.meta}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {vendorSnapshot.inventory.map((item) => (
          <div key={item.id} className="vendor-card relative overflow-hidden border border-muted/45 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-brand-soft to-brand text-white shadow-inner">
                  <BoxIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  item.status === 'Healthy'
                    ? 'bg-brand-soft text-brand'
                    : item.status === 'Low'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-accent/30 text-accent',
                )}
              >
                {item.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-2xl bg-[#f2f5f1] px-3 py-2 font-semibold text-surface-foreground">
                Purchase: {item.purchase}
              </div>
              <div className="rounded-2xl bg-[#f2f0f5] px-3 py-2 font-semibold text-surface-foreground">
                Selling: {item.selling}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="vendor-progress w-2/3">
                <span style={{ width: `${stockProgress[item.status] ?? 40}%` }} />
              </div>
              <button className="rounded-full border border-brand/40 bg-brand-soft/70 px-4 py-1.5 text-xs font-semibold text-brand">
                Update stock
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="vendor-card border border-brand/20 bg-white px-5 py-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-surface-foreground">Restock advisory</p>
            <p className="text-xs text-muted-foreground">
              Micro Nutrients trending towards critical. Submit a credit requisition within 48h to avoid disruptions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="vendor-chip warn">Lead time • 3 days</span>
            <button className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-brand-foreground">
              Raise request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersView() {
  const STAGES = ['Awaiting', 'Processing', 'Delivered']

  const stageIndex = (status) => {
    if (!status) return 0
    const normalized = status.toLowerCase()
    if (normalized.includes('delivered')) return 2
    if (normalized.includes('processing')) return 1
    return 0
  }

  const filterChips = [
    { label: 'All orders', value: '24', active: true },
    { label: 'Awaiting', value: '6' },
    { label: 'Processing', value: '11' },
    { label: 'Delivered', value: '7' },
  ]

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h2 className="vendor-section-title">Orders workflow</h2>
        <p className="vendor-section-subtitle">
          Confirm availability, keep dispatches on schedule, and maintain top-tier service ratings.
        </p>
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <span
              key={chip.label}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                chip.active ? 'bg-brand-soft text-brand' : 'border border-muted/40 bg-white text-muted-foreground',
              )}
            >
              {chip.label} • {chip.value}
            </span>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {vendorSnapshot.orders.map((order) => (
          <div key={order.id} className="vendor-card border border-muted/45 bg-white/95 p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-accent/40 to-accent/10 text-accent">
                  <TruckIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-foreground">{order.farmer}</p>
                  <p className="text-xs text-muted-foreground">{order.value}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-brand">{order.payment}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{order.status}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f0f4ef] px-3 py-2 text-xs text-brand">
              <span className="font-semibold uppercase tracking-wide">Next</span>
              <span>{order.next}</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
              {STAGES.map((stage, index) => (
                <div key={stage} className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition',
                      index <= stageIndex(order.status)
                        ? 'border-brand bg-brand text-white'
                        : 'border-muted/60 bg-white text-muted-foreground',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span>{stage}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-sm">
                Available
              </button>
              <button className="flex-1 rounded-full border border-accent/40 bg-white px-4 py-2 text-xs font-semibold text-accent">
                Not available
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="vendor-card border border-muted/40 bg-white px-5 py-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-surface-foreground">Fallback logistics</p>
            <p className="text-xs text-muted-foreground">
              Western hub reporting a mild delay. Redirect low-priority orders to Admin fulfilment if SLA exceeds 24h.
            </p>
          </div>
          <button className="rounded-full border border-brand/40 px-4 py-2 text-xs font-semibold text-brand">
            Escalate to admin
          </button>
        </div>
      </div>
    </div>
  )
}

function CreditView() {
  const credit = vendorSnapshot.credit
  const usedPercent = Math.min(
    Math.round(
      (parseInt(credit.used.replace(/[^0-9]/g, ''), 10) / parseInt(credit.limit.replace(/[^0-9]/g, ''), 10)) * 100,
    ),
    100,
  )

  return (
    <div className="space-y-6">
      <section className="vendor-card border border-brand/30 bg-linear-to-br from-brand-soft/60 via-white to-white p-6 shadow-card">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-inner">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(rgba(16,185,129,0.85) ${usedPercent}%, rgba(209,213,219,0.35) ${usedPercent}% 100%)`,
                }}
              />
              <div className="relative h-20 w-20 rounded-full bg-white shadow-inner" />
              <span className="absolute text-sm font-semibold text-brand">{usedPercent}% used</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-surface-foreground">
            <div>
              <p className="text-xs text-muted-foreground">Credit limit</p>
              <p className="mt-1 text-lg">{credit.limit}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="mt-1 text-lg">{credit.remaining}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="mt-1 text-lg">{credit.used}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="mt-1 text-lg">{credit.due}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-brand shadow-sm">
          {credit.penalty}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="vendor-card flex items-start gap-3 border border-brand/20 bg-white/95 p-5 shadow-card">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-brand-soft to-brand text-white">
            <WalletIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-surface-foreground">Need to reorder?</p>
              <p className="text-xs text-muted-foreground">
                Minimum purchase value ₹50,000. Credit order requests go to Admin for approval before stock updates.
              </p>
            </div>
            <button className="w-full rounded-full border border-brand/50 bg-white py-2 text-xs font-semibold text-brand">
              Place credit purchase request
            </button>
          </div>
        </div>
        <div className="vendor-card border border-muted/35 bg-white/95 p-5 shadow-card">
          <p className="text-sm font-semibold text-surface-foreground">Penalty timeline</p>
          <p className="text-xs text-muted-foreground">
            Grace period: 5 days • Penalty accrues daily thereafter until repayment is confirmed.
          </p>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            {[
              'Day 0-5 • Grace window with reminders sent automatically.',
              'Day 6-10 • Penalty applied, finance receives escalation.',
              'Day 11+ • New credit blocked until dues cleared.',
            ].map((line) => (
              <div key={line} className="rounded-2xl bg-[#f4f6f3] px-3 py-2 font-semibold text-surface-foreground/75">
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ReportsView() {
  const topVendors = [
    { name: 'HarvestLink Pvt Ltd', revenue: '₹1.4 Cr', change: '+12%' },
    { name: 'GreenGrow Supplies', revenue: '₹1.1 Cr', change: '+9%' },
    { name: 'GrowSure Traders', revenue: '₹82 L', change: '+4%' },
  ]

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="vendor-section-title">Reports & insights</h2>
        <p className="vendor-section-subtitle">
          Weekly snapshot of revenue, order velocity, partner performance, and fulfilment quality.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {vendorSnapshot.reports.map((report) => (
          <div key={report.label} className="vendor-card flex items-center gap-3 border border-muted/45 bg-white/95 px-4 py-4 shadow-card">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-brand-soft to-brand/70 text-brand-foreground">
              <ChartIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-surface-foreground">{report.label}</p>
              <p className="text-base font-semibold text-brand">{report.value}</p>
              <p className="text-xs text-muted-foreground">{report.meta}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="vendor-card grid gap-4 border border-muted/40 bg-white/95 p-5 shadow-card sm:grid-cols-[1.2fr_auto]">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-surface-foreground">Revenue vs fulfilment</p>
            <span className="vendor-chip success">Last 30 days</span>
          </div>
          <div className="mt-4 h-40 rounded-2xl bg-linear-to-br from-brand-soft/40 via-white to-white p-4">
            <div className="h-full rounded-xl border border-dashed border-brand/30 bg-white/70" />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3">
          <button className="self-start rounded-full border border-brand/40 px-4 py-2 text-xs font-semibold text-brand">
            Export latest report
          </button>
          <div className="space-y-2">
            {topVendors.map((vendor) => (
              <div
                key={vendor.name}
                className="rounded-2xl border border-muted/40 bg-[#f6f8f5] px-4 py-3 text-xs text-surface-foreground"
              >
                <p className="font-semibold">{vendor.name}</p>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{vendor.revenue}</span>
                  <span className="text-brand">{vendor.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

