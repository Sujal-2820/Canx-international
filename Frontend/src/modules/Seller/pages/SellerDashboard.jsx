import { useEffect, useMemo, useState, useRef } from 'react'
import { useSellerDispatch, useSellerState } from '../context/SellerContext'
import { MobileShell } from '../components/MobileShell'
import { BottomNavItem } from '../components/BottomNavItem'
import { MenuList } from '../components/MenuList'
import { HomeIcon, UsersIcon, WalletIcon, BellIcon, MenuIcon, SearchIcon, UserIcon } from '../components/icons'
import { sellerSnapshot } from '../services/sellerData'
import { cn } from '../../../lib/cn'
import { useToast } from '../components/ToastNotification'
import { OverviewView } from './views/OverviewView'
import { ReferralsView } from './views/ReferralsView'
import { WalletView } from './views/WalletView'
import { AnnouncementsView } from './views/AnnouncementsView'
import { PerformanceView } from './views/PerformanceView'
import { ProfileView } from './views/ProfileView'
import { WithdrawalRequestPanel } from '../components/WithdrawalRequestPanel'
import { ShareSellerIdPanel } from '../components/ShareSellerIdPanel'
import '../seller.css'

const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Target, wallet, stats',
    icon: HomeIcon,
  },
  {
    id: 'referrals',
    label: 'Referrals',
    description: 'Your referral network',
    icon: UsersIcon,
  },
  {
    id: 'wallet',
    label: 'Wallet',
    description: 'Balance & transactions',
    icon: WalletIcon,
  },
  {
    id: 'announcements',
    label: 'Updates',
    description: 'Admin announcements',
    icon: BellIcon,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Settings & account',
    icon: UserIcon,
  },
]

export function SellerDashboard({ onLogout }) {
  const { profile, notifications } = useSellerState()
  const dispatch = useSellerDispatch()
  const [activeTab, setActiveTab] = useState('overview')
  const welcomeName = (profile?.name || sellerSnapshot.profile.name || 'Seller').split(' ')[0]
  const { success, error, info, warning } = useToast()
  const [searchMounted, setSearchMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const [activePanel, setActivePanel] = useState(null)
  const [panelMounted, setPanelMounted] = useState(false)

  // Initialize seller data if not present
  useEffect(() => {
    if (!profile.name || profile.name === 'Guest Seller') {
      dispatch({
        type: 'AUTH_LOGIN',
        payload: sellerSnapshot.profile,
      })
    }
    // Initialize notifications if empty
    if (notifications.length === 0 && sellerSnapshot.announcements.length > 0) {
      sellerSnapshot.announcements.forEach((announcement) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { ...announcement, read: announcement.read } })
      })
    }
  }, [dispatch, profile, notifications.length])

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
      description: 'Log out from seller account',
      onSelect: () => {
        handleLogout()
        close()
      },
    },
  ]

  const openSearch = () => {
    setSearchMounted(true)
    requestAnimationFrame(() => setSearchOpen(true))
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setTimeout(() => {
      setSearchMounted(false)
      setSearchQuery('')
    }, 260)
  }

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }, [searchOpen])

  const handlePanelAction = (actionType, data) => {
    switch (actionType) {
      case 'share-seller-id':
        setPanelMounted(true)
        requestAnimationFrame(() => setActivePanel('share-seller-id'))
        break
      case 'request-withdrawal':
        const balance = parseFloat(sellerSnapshot.wallet.balance.replace(/[₹,\s]/g, '')) || 0
        if (balance < 5000) {
          warning('Minimum withdrawal amount is ₹5,000')
        } else {
          setPanelMounted(true)
          requestAnimationFrame(() => setActivePanel('request-withdrawal'))
        }
        break
      case 'view-performance':
        setActiveTab('performance')
        break
      default:
        break
    }
  }

  const closePanel = () => {
    setActivePanel(null)
    setTimeout(() => {
      setPanelMounted(false)
    }, 260)
  }

  const handleWithdrawalSuccess = (data) => {
    success(`Withdrawal request of ₹${data.amount.toLocaleString('en-IN')} submitted successfully!`)
    // In a real app, this would update the wallet state
  }

  const handleShareCopy = (text) => {
    success('Copied to clipboard!')
  }

  const unreadNotificationsCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  return (
    <>
      <MobileShell
        title={`Hello ${welcomeName}`}
        subtitle={sellerSnapshot.profile.area || 'Kolhapur, Maharashtra'}
        onSearchClick={openSearch}
        onProfileClick={() => setActiveTab('profile')}
        notificationsCount={unreadNotificationsCount}
        notifications={notifications}
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
          {activeTab === 'overview' && (
            <OverviewView onNavigate={navigateTo} openPanel={handlePanelAction} />
          )}
          {activeTab === 'referrals' && <ReferralsView onNavigate={navigateTo} />}
          {activeTab === 'wallet' && <WalletView openPanel={handlePanelAction} />}
          {activeTab === 'announcements' && <AnnouncementsView />}
          {activeTab === 'performance' && (
            <PerformanceView onBack={() => setActiveTab('overview')} />
          )}
          {activeTab === 'profile' && <ProfileView onLogout={handleLogout} />}
        </section>
      </MobileShell>

      {searchMounted ? (
        <div className={cn('seller-search-sheet', searchOpen && 'is-open')}>
          <div className={cn('seller-search-sheet__overlay', searchOpen && 'is-open')} onClick={closeSearch} />
          <div className={cn('seller-search-sheet__panel', searchOpen && 'is-open')}>
            <div className="seller-search-sheet__header">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    closeSearch()
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    closeSearch()
                  }
                }}
                placeholder="Search referrals, transactions..."
                className="seller-search-input"
                aria-label="Search seller console"
              />
              <button type="button" className="seller-search-cancel" onClick={closeSearch}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Action Panels */}
      {panelMounted && (
        <>
          {activePanel === 'request-withdrawal' && (
            <WithdrawalRequestPanel
              isOpen={activePanel === 'request-withdrawal'}
              onClose={closePanel}
              onSuccess={handleWithdrawalSuccess}
            />
          )}
          {activePanel === 'share-seller-id' && (
            <ShareSellerIdPanel
              isOpen={activePanel === 'share-seller-id'}
              onClose={closePanel}
              onCopy={handleShareCopy}
            />
          )}
        </>
      )}
    </>
  )
}
