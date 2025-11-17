import { useState, useEffect } from 'react'
import { useSellerState, useSellerDispatch } from '../../context/SellerContext'
import { sellerSnapshot } from '../../services/sellerData'
import {
  UserIcon,
  MapPinIcon,
  BellIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  WalletIcon,
  TargetIcon,
  BuildingIcon,
} from '../../components/icons'
import { cn } from '../../../../lib/cn'
import { useToast } from '../../components/ToastNotification'

export function ProfileView({ onLogout }) {
  const { profile } = useSellerState()
  const dispatch = useSellerDispatch()
  const { success, warning } = useToast()
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState(profile.name || sellerSnapshot.profile.name)
  const [showPasswordPanel, setShowPasswordPanel] = useState(false)
  const [showSupportPanel, setShowSupportPanel] = useState(false)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false)

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    sms: true,
    email: true,
    push: true,
    announcements: true,
    commission: true,
    target: true,
  })

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  // Report issue form
  const [reportForm, setReportForm] = useState({
    subject: '',
    description: '',
    category: 'general',
  })

  // Update edited name when profile changes
  useEffect(() => {
    setEditedName(profile.name || sellerSnapshot.profile.name)
  }, [profile.name])

  const handleSaveName = () => {
    if (!editedName.trim()) {
      warning('Name cannot be empty')
      return
    }
    dispatch({
      type: 'AUTH_LOGIN',
      payload: { ...profile, name: editedName.trim() },
    })
    setEditingName(false)
    success('Name updated successfully!')
  }

  const handleSavePassword = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      warning('Please fill in all fields')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      warning('New passwords do not match')
      return
    }
    if (passwordForm.new.length < 6) {
      warning('Password must be at least 6 characters long')
      return
    }
    success('Password changed successfully!')
    setPasswordForm({ current: '', new: '', confirm: '' })
    setShowPasswordPanel(false)
  }

  const handleToggleNotification = (key) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    success(`${key === 'sms' ? 'SMS' : key === 'email' ? 'Email' : key === 'push' ? 'Push' : key === 'announcements' ? 'Announcements' : key === 'commission' ? 'Commission' : 'Target'} notifications ${!notificationPrefs[key] ? 'enabled' : 'disabled'}`)
  }

  const handleSubmitReport = () => {
    if (!reportForm.subject || !reportForm.description) {
      warning('Please fill in all fields')
      return
    }
    success('Issue reported successfully! We will get back to you soon.')
    setReportForm({ subject: '', description: '', category: 'general' })
    setShowReportPanel(false)
  }

  const sellerProfile = profile.name ? profile : sellerSnapshot.profile

  const sections = [
    {
      id: 'seller-info',
      title: 'Seller Information',
      icon: UserIcon,
      items: [
        {
          id: 'name',
          label: 'Full Name',
          value: sellerProfile.name,
          editable: true,
          onEdit: () => setEditingName(true),
        },
        {
          id: 'seller-id',
          label: 'Seller ID',
          value: sellerProfile.sellerId || sellerSnapshot.profile.sellerId,
          editable: false,
        },
        {
          id: 'email',
          label: 'Email',
          value: sellerProfile.email || sellerSnapshot.profile.email || 'Not set',
          editable: false,
        },
        {
          id: 'phone',
          label: 'Phone',
          value: sellerProfile.phone || sellerSnapshot.profile.phone || 'Not set',
          editable: false,
        },
        {
          id: 'password',
          label: 'Password',
          value: '••••••••',
          editable: true,
          onEdit: () => setShowPasswordPanel(true),
        },
      ],
    },
    {
      id: 'business',
      title: 'Business Details',
      icon: BuildingIcon,
      items: [
        {
          id: 'vendor',
          label: 'Assigned Vendor',
          value: sellerProfile.assignedVendor || sellerSnapshot.profile.assignedVendor || 'Not assigned',
          editable: false,
        },
        {
          id: 'area',
          label: 'Service Area',
          value: sellerProfile.area || sellerSnapshot.profile.area || 'Not set',
          editable: false,
        },
        {
          id: 'commission',
          label: 'Commission Rate',
          value: sellerProfile.commissionRate || sellerSnapshot.profile.commissionRate || 'Not set',
          editable: false,
        },
        {
          id: 'cashback',
          label: 'Cashback Rate',
          value: sellerProfile.cashbackRate || sellerSnapshot.profile.cashbackRate || 'Not set',
          editable: false,
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications & Alerts',
      icon: BellIcon,
      items: [
        {
          id: 'sms',
          label: 'SMS Notifications',
          value: notificationPrefs.sms ? 'Enabled' : 'Disabled',
          toggle: true,
          enabled: notificationPrefs.sms,
          onToggle: () => handleToggleNotification('sms'),
        },
        {
          id: 'email',
          label: 'Email Notifications',
          value: notificationPrefs.email ? 'Enabled' : 'Disabled',
          toggle: true,
          enabled: notificationPrefs.email,
          onToggle: () => handleToggleNotification('email'),
        },
        {
          id: 'push',
          label: 'Push Notifications',
          value: notificationPrefs.push ? 'Enabled' : 'Disabled',
          toggle: true,
          enabled: notificationPrefs.push,
          onToggle: () => handleToggleNotification('push'),
        },
        {
          id: 'announcements',
          label: 'Announcements',
          value: notificationPrefs.announcements ? 'Enabled' : 'Disabled',
          toggle: true,
          enabled: notificationPrefs.announcements,
          onToggle: () => handleToggleNotification('announcements'),
        },
        {
          id: 'commission',
          label: 'Commission Alerts',
          value: notificationPrefs.commission ? 'Enabled' : 'Disabled',
          toggle: true,
          enabled: notificationPrefs.commission,
          onToggle: () => handleToggleNotification('commission'),
        },
        {
          id: 'target',
          label: 'Target Updates',
          value: notificationPrefs.target ? 'Enabled' : 'Disabled',
          toggle: true,
          enabled: notificationPrefs.target,
          onToggle: () => handleToggleNotification('target'),
        },
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: ShieldCheckIcon,
      items: [
        {
          id: 'privacy',
          label: 'Privacy Settings',
          value: 'Manage privacy',
          action: () => setShowPrivacyPanel(true),
        },
      ],
    },
    {
      id: 'support',
      title: 'Support & Help',
      icon: HelpCircleIcon,
      items: [
        {
          id: 'help',
          label: 'Help Center',
          value: 'FAQs & Guides',
          action: () => setShowSupportPanel(true),
        },
        {
          id: 'contact',
          label: 'Contact Support',
          value: 'Chat or Call',
          action: () => setShowSupportPanel(true),
        },
        {
          id: 'report',
          label: 'Report Issue',
          value: 'Report a problem',
          action: () => setShowReportPanel(true),
        },
      ],
    },
  ]

  return (
    <div className="seller-profile-view space-y-6">
      {/* Profile Header */}
      <div className="seller-profile-view__header">
        <div className="seller-profile-view__header-avatar">
          <UserIcon className="h-12 w-12" />
        </div>
        <div className="seller-profile-view__header-info">
          <h2 className="seller-profile-view__header-name">{sellerProfile.name}</h2>
          <p className="seller-profile-view__header-id">Seller ID: {sellerProfile.sellerId || sellerSnapshot.profile.sellerId}</p>
          <p className="seller-profile-view__header-area">
            <MapPinIcon className="h-4 w-4 inline mr-1" />
            {sellerProfile.area || sellerSnapshot.profile.area}
          </p>
        </div>
      </div>

      {/* Name Edit Modal */}
      {editingName && (
        <div className="seller-profile-view__edit-modal">
          <div className="seller-profile-view__edit-modal-content">
            <h3 className="seller-profile-view__edit-modal-title">Edit Name</h3>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="seller-profile-view__edit-modal-input"
              placeholder="Enter your name"
              autoFocus
            />
            <div className="seller-profile-view__edit-modal-actions">
              <button
                type="button"
                className="seller-profile-view__edit-modal-cancel"
                onClick={() => {
                  setEditedName(sellerProfile.name)
                  setEditingName(false)
                }}
              >
                <XIcon className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                className="seller-profile-view__edit-modal-save"
                onClick={handleSaveName}
              >
                <CheckIcon className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="seller-profile-view__sections">
        {sections.map((section) => (
          <div key={section.id} className="seller-profile-view__section">
            <div className="seller-profile-view__section-header">
              <section.icon className="seller-profile-view__section-icon" />
              <h3 className="seller-profile-view__section-title">{section.title}</h3>
            </div>
            <div className="seller-profile-view__section-content">
              {section.items.length > 0 ? (
                section.items.map((item) => (
                  <div key={item.id} className="seller-profile-view__item">
                    <div className="seller-profile-view__item-content">
                      <span className="seller-profile-view__item-label">{item.label}</span>
                      <span className="seller-profile-view__item-value">{item.value}</span>
                    </div>
                    <div className="seller-profile-view__item-actions">
                      {item.toggle ? (
                        <label className="seller-profile-view__toggle">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={item.onToggle || (() => {})}
                            className="seller-profile-view__toggle-input"
                          />
                          <span className="seller-profile-view__toggle-slider" />
                        </label>
                      ) : (
                        <>
                          {item.editable && (
                            <button
                              type="button"
                              className="seller-profile-view__item-edit"
                              onClick={item.onEdit}
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                          )}
                          {item.action && (
                            <button
                              type="button"
                              className="seller-profile-view__item-action"
                              onClick={item.action}
                            >
                              →
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="seller-profile-view__empty">
                  <section.icon className="seller-profile-view__empty-icon" />
                  <p className="seller-profile-view__empty-text">No {section.title.toLowerCase()} yet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="seller-profile-view__logout">
        <button
          type="button"
          onClick={onLogout}
          className="seller-profile-view__logout-button"
        >
          Sign Out
        </button>
      </div>

      {/* Password Change Panel */}
      {showPasswordPanel && (
        <div
          className="seller-profile-view__panel"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordPanel(false)
              setPasswordForm({ current: '', new: '', confirm: '' })
            }
          }}
        >
          <div className="seller-profile-view__panel-content">
            <div className="seller-profile-view__panel-header">
              <h3 className="seller-profile-view__panel-title">Change Password</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordPanel(false)
                  setPasswordForm({ current: '', new: '', confirm: '' })
                }}
                className="seller-profile-view__panel-close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="seller-profile-view__panel-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b]"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSavePassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1b8f5b] text-white text-sm font-semibold hover:bg-[#2a9d61] transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Panel */}
      {showPrivacyPanel && (
        <div
          className="seller-profile-view__panel"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPrivacyPanel(false)
            }
          }}
        >
          <div className="seller-profile-view__panel-content">
            <div className="seller-profile-view__panel-header">
              <h3 className="seller-profile-view__panel-title">Privacy Settings</h3>
              <button
                type="button"
                onClick={() => setShowPrivacyPanel(false)}
                className="seller-profile-view__panel-close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="seller-profile-view__panel-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[rgba(34,94,65,0.15)]">
                  <div>
                    <h4 className="font-semibold text-[#172022] mb-1">Profile Visibility</h4>
                    <p className="text-sm text-[rgba(26,42,34,0.7)]">Control who can see your profile</p>
                  </div>
                  <label className="seller-profile-view__toggle">
                    <input type="checkbox" defaultChecked className="seller-profile-view__toggle-input" />
                    <span className="seller-profile-view__toggle-slider" />
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-[rgba(34,94,65,0.15)]">
                  <div>
                    <h4 className="font-semibold text-[#172022] mb-1">Data Sharing</h4>
                    <p className="text-sm text-[rgba(26,42,34,0.7)]">Allow data sharing for better experience</p>
                  </div>
                  <label className="seller-profile-view__toggle">
                    <input type="checkbox" defaultChecked className="seller-profile-view__toggle-input" />
                    <span className="seller-profile-view__toggle-slider" />
                  </label>
                </div>
                <p className="text-xs text-[rgba(26,42,34,0.6)]">
                  Your privacy is important to us. We never share your personal information with third parties without your consent.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Panel */}
      {showSupportPanel && (
        <div
          className="seller-profile-view__panel"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSupportPanel(false)
            }
          }}
        >
          <div className="seller-profile-view__panel-content">
            <div className="seller-profile-view__panel-header">
              <h3 className="seller-profile-view__panel-title">Support & Help</h3>
              <button
                type="button"
                onClick={() => setShowSupportPanel(false)}
                className="seller-profile-view__panel-close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="seller-profile-view__panel-body">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[rgba(240,245,242,0.4)] border border-[rgba(34,94,65,0.1)]">
                  <h4 className="font-semibold text-[#172022] mb-2">Help Center</h4>
                  <p className="text-sm text-[rgba(26,42,34,0.7)] mb-3">
                    Browse FAQs and guides to find answers to common questions.
                  </p>
                  <button
                    type="button"
                    className="text-sm text-[#1b8f5b] font-semibold hover:underline"
                  >
                    Visit Help Center →
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-[rgba(240,245,242,0.4)] border border-[rgba(34,94,65,0.1)]">
                  <h4 className="font-semibold text-[#172022] mb-2">Contact Support</h4>
                  <p className="text-sm text-[rgba(26,42,34,0.7)] mb-2">
                    <strong>Phone:</strong> +91 1800-XXX-XXXX
                  </p>
                  <p className="text-sm text-[rgba(26,42,34,0.7)] mb-3">
                    <strong>Email:</strong> support@irasathi.com
                  </p>
                  <p className="text-sm text-[rgba(26,42,34,0.7)] mb-3">
                    <strong>Hours:</strong> Mon-Sat, 9 AM - 6 PM
                  </p>
                  <button
                    type="button"
                    className="text-sm text-[#1b8f5b] font-semibold hover:underline"
                  >
                    Start Chat →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Panel */}
      {showReportPanel && (
        <div
          className="seller-profile-view__panel"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReportPanel(false)
              setReportForm({ subject: '', description: '', category: 'general' })
            }
          }}
        >
          <div className="seller-profile-view__panel-content">
            <div className="seller-profile-view__panel-header">
              <h3 className="seller-profile-view__panel-title">Report Issue</h3>
              <button
                type="button"
                onClick={() => {
                  setShowReportPanel(false)
                  setReportForm({ subject: '', description: '', category: 'general' })
                }}
                className="seller-profile-view__panel-close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="seller-profile-view__panel-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b]"
                  >
                    <option value="general">General Issue</option>
                    <option value="commission">Commission Issue</option>
                    <option value="vendor">Vendor Issue</option>
                    <option value="account">Account Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportForm.subject}
                    onChange={(e) => setReportForm({ ...reportForm, subject: e.target.value })}
                    placeholder="Brief description of the issue"
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    placeholder="Please provide detailed information about the issue"
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b] resize-none"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1b8f5b] text-white text-sm font-semibold hover:bg-[#2a9d61] transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

