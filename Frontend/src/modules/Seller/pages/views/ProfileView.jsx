import { useState, useEffect } from 'react'
import { useSellerState, useSellerDispatch } from '../../context/SellerContext'
import { useSellerApi } from '../../hooks/useSellerApi'
import { sellerSnapshot } from '../../services/sellerData'
import {
  UserIcon,
  HelpCircleIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  BuildingIcon,
  MapPinIcon,
} from '../../components/icons'
import { cn } from '../../../../lib/cn'
import { useToast } from '../../components/ToastNotification'

export function ProfileView({ onLogout, onNavigate }) {
  const { profile } = useSellerState()
  const dispatch = useSellerDispatch()
  const { requestNameChange, requestPhoneChange, reportIssue, fetchDashboardOverview } = useSellerApi()
  const { success, warning, error: showError } = useToast()
  const [showNameChangePanel, setShowNameChangePanel] = useState(false)
  const [showPhoneChangePanel, setShowPhoneChangePanel] = useState(false)
  const [showSupportPanel, setShowSupportPanel] = useState(false)
  const [showReportPanel, setShowReportPanel] = useState(false)

  // Name change request form
  const [nameChangeForm, setNameChangeForm] = useState({
    requestedName: '',
    confirmName: '',
  })

  // Phone change request form
  const [phoneChangeForm, setPhoneChangeForm] = useState({
    requestedPhone: '',
    confirmPhone: '',
  })

  // Report issue form
  const [reportForm, setReportForm] = useState({
    subject: '',
    description: '',
    category: 'general',
  })

  const handleRequestNameChange = async () => {
    if (!nameChangeForm.requestedName.trim()) {
      warning('Please enter the new name')
      return
    }
    if (nameChangeForm.requestedName.trim() !== nameChangeForm.confirmName.trim()) {
      warning('Name confirmation does not match. Please enter the same name in both fields.')
      return
    }
    try {
      const result = await requestNameChange({
        requestedName: nameChangeForm.requestedName.trim(),
        description: '',
      })
      // Check for success
      if (result && (result.success || (result.data && !result.error))) {
        success('Your request has been sent to Admin. Necessary action shall be taken within 24 hours.')
        setNameChangeForm({ requestedName: '', confirmName: '' })
        setShowNameChangePanel(false)
      } else if (result && result.error) {
        showError(result.error.message || 'Failed to submit name change request')
      } else {
        showError('Failed to submit name change request. Please try again.')
      }
    } catch (err) {
      showError(err.message || 'Failed to submit name change request')
    }
  }

  const handleRequestPhoneChange = async () => {
    if (!phoneChangeForm.requestedPhone.trim()) {
      warning('Please enter the new phone number')
      return
    }
    // Basic phone validation
    const phoneRegex = /^[+]?[1-9]\d{9,14}$/
    if (!phoneRegex.test(phoneChangeForm.requestedPhone.trim())) {
      warning('Please enter a valid phone number')
      return
    }
    if (phoneChangeForm.requestedPhone.trim() !== phoneChangeForm.confirmPhone.trim()) {
      warning('Phone confirmation does not match. Please enter the same phone number in both fields.')
      return
    }
    try {
      const result = await requestPhoneChange({
        requestedPhone: phoneChangeForm.requestedPhone.trim(),
        description: '',
      })
      // Check for success
      if (result && result.success) {
        success('Your request has been sent to Admin. Necessary action shall be taken within 24 hours.')
        setPhoneChangeForm({ requestedPhone: '', confirmPhone: '' })
        setShowPhoneChangePanel(false)
      } else if (result && result.error) {
        // Show the specific error message from the backend
        const errorMessage = result.error.message || 'Failed to submit phone change request'
        showError(errorMessage)
      } else {
        showError('Failed to submit phone change request. Please try again.')
      }
    } catch (err) {
      showError(err.message || 'Failed to submit phone change request')
    }
  }

  const handleSubmitReport = async () => {
    if (!reportForm.subject || !reportForm.description) {
      warning('Please fill in all fields')
      return
    }
    const result = await reportIssue({
      subject: reportForm.subject,
      description: reportForm.description,
      category: reportForm.category,
    })
    if (result.data) {
      success('Issue reported successfully! We will get back to you soon.')
      setReportForm({ subject: '', description: '', category: 'general' })
      setShowReportPanel(false)
    } else if (result.error) {
      showError(result.error.message || 'Failed to submit report')
    }
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
          onEdit: () => setShowNameChangePanel(true),
        },
        {
          id: 'seller-id',
          label: 'Seller ID',
          value: sellerProfile.sellerId || sellerSnapshot.profile.sellerId,
          editable: false,
        },
        {
          id: 'phone',
          label: 'Phone',
          value: sellerProfile.phone || sellerSnapshot.profile.phone || 'Not set',
          editable: true,
          onEdit: () => setShowPhoneChangePanel(true),
        },
      ],
    },
    {
      id: 'business',
      title: 'Business Details',
      icon: BuildingIcon,
      items: [
        {
          id: 'location',
          label: 'Location',
          value: sellerProfile.area || sellerSnapshot.profile.area || sellerProfile.location?.city || sellerProfile.location?.state || 'Not set',
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
          <p className="seller-profile-view__header-location">
            <MapPinIcon className="h-4 w-4 inline mr-1" />
            {sellerProfile.area || sellerSnapshot.profile.area || sellerProfile.location?.city || sellerProfile.location?.state || 'Location not set'}
          </p>
        </div>
      </div>

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

      {/* Name Change Request Panel */}
      {showNameChangePanel && (
        <div
          className="seller-profile-view__panel"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNameChangePanel(false)
              setNameChangeForm({ requestedName: '', confirmName: '' })
            }
          }}
        >
          <div className="seller-profile-view__panel-content">
            <div className="seller-profile-view__panel-header">
              <h3 className="seller-profile-view__panel-title">Request Name Change</h3>
              <button
                type="button"
                onClick={() => {
                  setShowNameChangePanel(false)
                  setNameChangeForm({ requestedName: '', confirmName: '' })
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
                    Current Name
                  </label>
                  <input
                    type="text"
                    value={sellerProfile.name}
                    disabled
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-gray-50 text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    New Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameChangeForm.requestedName}
                    onChange={(e) => setNameChangeForm({ ...nameChangeForm, requestedName: e.target.value })}
                    placeholder="Write your suggested name"
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    Confirm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameChangeForm.confirmName}
                    onChange={(e) => setNameChangeForm({ ...nameChangeForm, confirmName: e.target.value })}
                    placeholder="Enter the name again to confirm"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none ${
                      nameChangeForm.confirmName && nameChangeForm.requestedName.trim() !== nameChangeForm.confirmName.trim()
                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                        : 'border-[rgba(34,94,65,0.15)] bg-white focus:border-[#1b8f5b]'
                    }`}
                  />
                  {nameChangeForm.confirmName && nameChangeForm.requestedName.trim() !== nameChangeForm.confirmName.trim() && (
                    <p className="mt-1 text-xs text-red-600">Name does not match. Please enter the same name.</p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRequestNameChange}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1b8f5b] text-white text-sm font-semibold hover:bg-[#2a9d61] transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Change Request Panel */}
      {showPhoneChangePanel && (
        <div
          className="seller-profile-view__panel"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPhoneChangePanel(false)
              setPhoneChangeForm({ requestedPhone: '', confirmPhone: '' })
            }
          }}
        >
          <div className="seller-profile-view__panel-content">
            <div className="seller-profile-view__panel-header">
              <h3 className="seller-profile-view__panel-title">Request Phone Change</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPhoneChangePanel(false)
                  setPhoneChangeForm({ requestedPhone: '', confirmPhone: '' })
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
                    Current Phone
                  </label>
                  <input
                    type="text"
                    value={sellerProfile.phone || 'Not set'}
                    disabled
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-gray-50 text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    New Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneChangeForm.requestedPhone}
                    onChange={(e) => setPhoneChangeForm({ ...phoneChangeForm, requestedPhone: e.target.value })}
                    placeholder="Write your suggested phone number to change"
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(34,94,65,0.15)] bg-white text-sm focus:outline-none focus:border-[#1b8f5b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#172022] mb-1.5">
                    Confirm Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneChangeForm.confirmPhone}
                    onChange={(e) => setPhoneChangeForm({ ...phoneChangeForm, confirmPhone: e.target.value })}
                    placeholder="Enter the phone number again to confirm"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none ${
                      phoneChangeForm.confirmPhone && phoneChangeForm.requestedPhone.trim() !== phoneChangeForm.confirmPhone.trim()
                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                        : 'border-[rgba(34,94,65,0.15)] bg-white focus:border-[#1b8f5b]'
                    }`}
                  />
                  {phoneChangeForm.confirmPhone && phoneChangeForm.requestedPhone.trim() !== phoneChangeForm.confirmPhone.trim() && (
                    <p className="mt-1 text-xs text-red-600">Phone number does not match. Please enter the same phone number.</p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRequestPhoneChange}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1b8f5b] text-white text-sm font-semibold hover:bg-[#2a9d61] transition-colors"
                >
                  Submit Request
                </button>
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

