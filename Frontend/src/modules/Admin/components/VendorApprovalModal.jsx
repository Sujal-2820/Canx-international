import { Building2, CheckCircle, XCircle, FileText, MapPin, Phone, Mail, AlertTriangle, ExternalLink, Eye, User, Briefcase, FileCheck, ShieldCheck, ClipboardList } from 'lucide-react'
import { Modal } from './Modal'
import { StatusBadge } from './StatusBadge'
import { cn } from '../../../lib/cn'

export function VendorApprovalModal({ isOpen, onClose, vendor, onApprove, onReject, loading }) {
  if (!vendor) return null

  const hasCoverageConflict = vendor.coverageConflicts?.length > 0
  const hasLocation = vendor.location?.coordinates?.lat && vendor.location?.coordinates?.lng
  const firstConflict = hasCoverageConflict ? vendor.coverageConflicts[0] : null
  const conflictingVendorName = firstConflict
    ? firstConflict.vendorA.id === vendor.id
      ? firstConflict.vendorB.name
      : firstConflict.vendorA.name
    : null

  const handleApprove = () => {
    onApprove(vendor.id)
  }

  const handleReject = () => {
    const reason = window.prompt('Please provide a reason for rejection:')
    if (reason) {
      onReject(vendor.id, { reason })
    }
  }

  const DocumentPreview = ({ label, doc, icon: Icon = FileText }) => {
    if (!doc || !doc.url) {
      return (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-red-400" />
              <p className="text-xs font-semibold text-red-700">{label}</p>
            </div>
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-[0.7rem] text-red-600">Missing</p>
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-700">{label}</p>
          </div>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
        <div className="space-y-2">
          {doc.format === 'pdf' ? (
            <div className="flex items-center gap-2 h-24 justify-center bg-white border border-gray-200 rounded-lg">
              <FileText className="h-8 w-8 text-red-500" />
              <span className="text-xs font-bold text-gray-500">PDF Document</span>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-gray-300 bg-white">
              <img
                src={doc.url}
                alt={label}
                className="w-full h-24 object-contain transition-transform hover:scale-110 cursor-zoom-in"
                onClick={() => window.open(doc.url, '_blank')}
              />
            </div>
          )}
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-[0.7rem] text-blue-600 hover:text-blue-800 font-bold bg-white py-1.5 rounded-md shadow-sm border border-gray-100"
          >
            <Eye className="h-3 w-3" />
            View Full
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vendor Application Review" size="xl">
      <div className="space-y-6">
        {/* Vendor Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{vendor.shopName || vendor.name}</h3>
                <p className="text-sm font-medium text-gray-500">ID: {vendor.vendorId || vendor.id}</p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span>{vendor.firstName} {vendor.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{vendor.location?.address || vendor.shopAddress || 'No Address'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge tone={vendor.status === 'pending' ? 'warning' : 'neutral'}>
                {vendor.status?.toUpperCase() || 'PENDING'}
              </StatusBadge>
              <p className="text-[0.7rem] text-gray-400 font-medium">Applied: {new Date(vendor.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-gray-700">{vendor.phone}</span>
            </div>
            {vendor.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 truncate">{vendor.email}</span>
              </div>
            )}
            {vendor.agentName && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-purple-400" />
                <span className="text-gray-600">Agent: <span className="font-semibold">{vendor.agentName}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* KYC Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KYCBadge label="GST Number" value={vendor.gstNumber} icon={FileCheck} />
          <KYCBadge label="PAN Number" value={vendor.panNumber} icon={FileText} />
          <KYCBadge label="Aadhaar Number" value={vendor.aadhaarNumber} icon={ShieldCheck} />
        </div>

        {/* Geo Validation */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-blue-900">Coverage Compliance</h4>
              <p className="mt-1 text-xs text-blue-700">Vendor Exclusivity Check (20km radius rule)</p>
            </div>
            <StatusBadge tone={hasCoverageConflict ? 'warning' : 'success'}>
              {hasCoverageConflict ? 'Conflict Detected' : 'Compliant'}
            </StatusBadge>
          </div>

          {hasCoverageConflict && firstConflict ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-100 p-4 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
                <div>
                  <p className="font-bold text-red-900">Overlapping Coverage Warning</p>
                  <p className="mt-1 text-red-800">
                    <strong>{conflictingVendorName}</strong> is located only <strong>{firstConflict.distanceKm} km</strong> away.
                    Satpura Bio policy strictly limits one vendor per 20km radius.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-blue-800">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Geospatial Rule Validated</span>
              </div>
              <span>•</span>
              <span>Radius: {vendor.coverageRadius || 20} km</span>
              <span>•</span>
              <span>Coords: {hasLocation ? `${vendor.location.coordinates.lat.toFixed(4)}, ${vendor.location.coordinates.lng.toFixed(4)}` : 'N/A'}</span>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">Verification Documents (5 Required)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentPreview label="Aadhaar Front" doc={vendor.aadhaarFront} icon={ShieldCheck} />
            <DocumentPreview label="Aadhaar Back" doc={vendor.aadhaarBack} icon={ShieldCheck} />
            <DocumentPreview label="Pesticide License" doc={vendor.pesticideLicense} icon={FileCheck} />
            <DocumentPreview label="Security Checks" doc={vendor.securityChecks} icon={ClipboardList} />
            <DocumentPreview label="Dealership Form" doc={vendor.dealershipForm} icon={Briefcase} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-6 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading || hasCoverageConflict}
              className={cn(
                'flex items-center gap-2 rounded-xl px-10 py-3 text-sm font-black text-white transition-all',
                loading || hasCoverageConflict
                  ? 'bg-gray-300 shadow-none cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 shadow-lg hover:shadow-green-200'
              )}
            >
              <CheckCircle className="h-4 w-4" />
              {loading ? 'Approving...' : 'Approve & Activate'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function KYCBadge({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-tighter">{label}</p>
      </div>
      <p className="text-sm font-black text-gray-800 font-mono tracking-tight">{value || 'N/A'}</p>
    </div>
  )
}

