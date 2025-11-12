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

const tabs = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'inventory', label: 'Inventory', icon: BoxIcon },
  { id: 'orders', label: 'Orders', icon: CartIcon },
  { id: 'credit', label: 'Credit', icon: CreditIcon },
  { id: 'reports', label: 'Reports', icon: ReportIcon },
]

export function VendorDashboard({ onLogout }) {
  const { profile } = useVendorState()
  const dispatch = useVendorDispatch()
  const [activeTab, setActiveTab] = useState('overview')

  const handleLogout = () => {
    dispatch({ type: 'AUTH_LOGOUT' })
    onLogout?.()
  }

  const menuItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <HomeIcon className="h-4 w-4" />,
      description: 'Orders, sales, and reminders',
      onSelect: setActiveTab,
    },
    {
      id: 'inventory',
      label: 'Inventory Manager',
      icon: <BoxIcon className="h-4 w-4" />,
      description: 'Current stock status',
      onSelect: setActiveTab,
    },
    {
      id: 'orders',
      label: 'Order Queue',
      icon: <CartIcon className="h-4 w-4" />,
      description: 'Confirm availability and delivery',
      onSelect: setActiveTab,
    },
    {
      id: 'credit',
      label: 'Credit Health',
      icon: <CreditIcon className="h-4 w-4" />,
      description: 'Limits, penalties, repayment',
      onSelect: setActiveTab,
    },
    {
      id: 'reports',
      label: 'Insights & Reports',
      icon: <ReportIcon className="h-4 w-4" />,
      description: 'Weekly / monthly performance',
      onSelect: setActiveTab,
    },
    {
      id: 'logout',
      label: 'Sign out',
      icon: <MenuIcon className="h-4 w-4" />,
      description: 'Log out from vendor account',
      onSelect: handleLogout,
    },
  ]

  return (
    <MobileShell
      title="Vendor Dashboard"
      subtitle={`Welcome ${profile.name || vendorSnapshot.welcome.name} • ${vendorSnapshot.welcome.region}`}
      navigation={tabs.map((tab) => (
        <BottomNavItem
          key={tab.id}
          label={tab.label}
          active={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          icon={<tab.icon active={activeTab === tab.id} className="h-5 w-5" />}
        />
      ))}
      menuContent={<MenuList items={menuItems} active={activeTab} />}
    >
      <section className="space-y-6">
        {activeTab === 'overview' && <OverviewView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'credit' && <CreditView />}
        {activeTab === 'reports' && <ReportsView />}
      </section>
    </MobileShell>
  )
}

function OverviewView() {
  return (
    <div className="space-y-5">
      <div className="vendor-card flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <SparkIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand">
            Coverage {vendorSnapshot.welcome.coverageKm} km
          </p>
          <h2 className="mt-1 text-lg font-semibold text-surface-foreground">Stay ahead every morning</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quickly check deliveries, low stock alerts, and credit reminders in one glance.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {vendorSnapshot.highlights.map((item) => (
          <div key={item.id} className="vendor-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <span className="vendor-pill">{item.trend}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-surface-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function InventoryView() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-foreground">Inventory Overview</h2>
      <p className="text-sm text-muted-foreground">
        Update stock after physical delivery. Admin notifications trigger when levels fall below threshold.
      </p>
      <div className="space-y-3">
        {vendorSnapshot.inventory.map((item) => (
          <div key={item.id} className="vendor-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand">
                <BoxIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-surface-foreground">{item.name}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === 'Healthy'
                        ? 'bg-brand-soft text-brand'
                        : item.status === 'Low'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-accent/30 text-accent'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-2xl bg-surface px-3 py-2">Purchase: {item.purchase}</div>
              <div className="rounded-2xl bg-surface px-3 py-2">Selling: {item.selling}</div>
            </div>
            <button className="mt-3 w-full rounded-2xl border border-brand/40 bg-brand-soft/70 py-2 text-xs font-semibold text-brand">
              Update stock quantity
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrdersView() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-foreground">Orders Queue</h2>
      <p className="text-sm text-muted-foreground">
        Confirm availability or provide reason for unavailability. Payment status is shown for quick review.
      </p>
      <div className="space-y-3">
        {vendorSnapshot.orders.map((order) => (
          <div key={order.id} className="vendor-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-accent/20 text-accent">
                <TruckIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-surface-foreground">{order.farmer}</p>
                  <p className="text-xs font-semibold text-brand">{order.payment}</p>
                </div>
                <p className="text-xs text-muted-foreground">{order.value}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Status: {order.status}</p>
            <p className="mt-1 rounded-2xl bg-brand-soft/50 px-3 py-2 text-xs text-brand">Next: {order.next}</p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground">
                Available
              </button>
              <button className="flex-1 rounded-full border border-accent/50 bg-white px-4 py-2 text-xs font-semibold text-accent">
                Not available
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CreditView() {
  const credit = vendorSnapshot.credit
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-foreground">Credit Health</h2>
      <div className="vendor-card border-brand/40 p-5">
        <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-surface-foreground">
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
        <p className="mt-4 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-brand">{credit.penalty}</p>
      </div>
      <div className="vendor-card flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand">
          <WalletIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-surface-foreground">Need to reorder?</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Minimum purchase value ₹50,000. Credit order requests go to Admin for approval before stock updates.
          </p>
          <button className="mt-3 w-full rounded-full border border-brand/50 bg-white py-2 text-xs font-semibold text-brand">
            Place credit purchase request
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-foreground">Reports & Insights</h2>
      <p className="text-sm text-muted-foreground">
        Glance through weekly, monthly summaries and export for your records. More detailed analytics planned soon.
      </p>
      <div className="space-y-3">
        {vendorSnapshot.reports.map((report) => (
          <div key={report.label} className="vendor-card flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand">
              <ChartIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-surface-foreground">{report.label}</p>
                <p className="text-base font-semibold text-brand">{report.value}</p>
              </div>
              <p className="text-xs text-muted-foreground">{report.meta}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full rounded-full bg-brand px-4 py-3 text-xs font-semibold text-brand-foreground">
        Export latest report
      </button>
    </div>
  )
}

