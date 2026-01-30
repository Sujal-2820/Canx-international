import { useState, useEffect } from 'react'
import { CreditCard, Calendar, AlertCircle, IndianRupee, Settings, Plus, Trash2 } from 'lucide-react'
import { cn } from '../../../lib/cn'

export function CreditPolicyForm({ vendor, onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState({
    repaymentDays: '',
    repaymentDays: '',
    creditLimit: '',
    overrideGlobalTiers: false,
    customDiscountTiers: [],
    customInterestTiers: [],
    specialAgreement: {
      active: false,
      agreedAmount: '',
      notes: ''
    }
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (vendor) {
      const repaymentDays = typeof vendor.repaymentDays === 'number'
        ? vendor.repaymentDays
        : vendor.creditPolicy?.repaymentDays || 30

      const penaltyRate = typeof vendor.penaltyRate === 'number'
        ? vendor.penaltyRate
        : vendor.creditPolicy?.penaltyRate || 2

      setFormData({
        repaymentDays: repaymentDays || 30,
        creditLimit: vendor.creditLimit || 100000,
        overrideGlobalTiers: vendor.creditPolicy?.overrideGlobalTiers || false,
        customDiscountTiers: vendor.creditPolicy?.customDiscountTiers || [],
        customInterestTiers: vendor.creditPolicy?.customInterestTiers || [],
        specialAgreement: {
          active: vendor.creditPolicy?.specialAgreement?.active || false,
          agreedAmount: vendor.creditPolicy?.specialAgreement?.agreedAmount || '',
          notes: vendor.creditPolicy?.specialAgreement?.notes || ''
        }
      })
    }
  }, [vendor])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSpecialAgreementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specialAgreement: {
        ...prev.specialAgreement,
        [field]: value
      }
    }));
  }

  const handleToggleOverride = () => {
    setFormData(prev => ({ ...prev, overrideGlobalTiers: !prev.overrideGlobalTiers }));
  }

  const addDiscountTier = () => {
    setFormData(prev => ({
      ...prev,
      customDiscountTiers: [...prev.customDiscountTiers, { periodStart: 0, periodEnd: 0, discountRate: 0, tierName: '' }]
    }));
  }

  const removeDiscountTier = (index) => {
    setFormData(prev => ({
      ...prev,
      customDiscountTiers: prev.customDiscountTiers.filter((_, i) => i !== index)
    }));
  }

  const updateDiscountTier = (index, field, value) => {
    const newTiers = [...formData.customDiscountTiers];
    newTiers[index][field] = field === 'tierName' ? value : parseFloat(value);
    setFormData(prev => ({ ...prev, customDiscountTiers: newTiers }));
  }

  const addInterestTier = () => {
    setFormData(prev => ({
      ...prev,
      customInterestTiers: [...prev.customInterestTiers, { periodStart: 0, periodEnd: 0, interestRate: 0, tierName: '' }]
    }));
  }

  const removeInterestTier = (index) => {
    setFormData(prev => ({
      ...prev,
      customInterestTiers: prev.customInterestTiers.filter((_, i) => i !== index)
    }));
  }

  const updateInterestTier = (index, field, value) => {
    const newTiers = [...formData.customInterestTiers];
    newTiers[index][field] = field === 'tierName' ? value : parseFloat(value);
    setFormData(prev => ({ ...prev, customInterestTiers: newTiers }));
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.repaymentDays || parseInt(formData.repaymentDays) <= 0) {
      newErrors.repaymentDays = 'Repayment days must be greater than 0'
    }


    if (formData.creditLimit === '' || parseFloat(formData.creditLimit) < 0) {
      newErrors.creditLimit = 'Credit limit must be a valid number'
    }

    if (formData.specialAgreement.active) {
      if (formData.specialAgreement.agreedAmount === '' || parseFloat(formData.specialAgreement.agreedAmount) < 0) {
        newErrors.agreedAmount = 'Agreed amount must be a valid non-negative number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const submitData = {
      repaymentDays: parseInt(formData.repaymentDays),
      creditLimit: parseFloat(formData.creditLimit),
      overrideGlobalTiers: formData.overrideGlobalTiers,
      customDiscountTiers: formData.customDiscountTiers,
      customInterestTiers: formData.customInterestTiers,
      specialAgreement: {
        active: formData.specialAgreement.active,
        agreedAmount: formData.specialAgreement.active ? parseFloat(formData.specialAgreement.agreedAmount || 0) : 0,
        notes: formData.specialAgreement.active ? formData.specialAgreement.notes : ''
      }
    }

    onSubmit(submitData)
  }

  const formatCurrency = (value) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} L`
    }
    return `₹${num.toLocaleString('en-IN')}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Credit Limit */}
      <div>
        <label htmlFor="creditLimit" className="mb-2 block text-sm font-bold text-gray-900">
          <IndianRupee className="mr-1 inline h-4 w-4" />
          Credit Limit <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="creditLimit"
            name="creditLimit"
            value={formData.creditLimit}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className={cn(
              'w-full rounded-xl border px-4 py-3 pl-10 text-sm transition-all focus:outline-none focus:ring-2',
              errors.creditLimit
                ? 'border-red-300 bg-red-50 focus:ring-red-500/50'
                : 'border-gray-300 bg-white focus:border-green-500 focus:ring-green-500/50',
            )}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</div>
        </div>
        {errors.creditLimit && <p className="mt-1 text-xs text-red-600">{errors.creditLimit}</p>}
        <p className="mt-1 text-xs text-gray-500">Maximum outstanding credit allowed for this vendor</p>
      </div>

      {/* Repayment Days */}
      <div>
        <label htmlFor="repaymentDays" className="mb-2 block text-sm font-bold text-gray-900">
          <Calendar className="mr-1 inline h-4 w-4" />
          Repayment Days <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="repaymentDays"
          name="repaymentDays"
          value={formData.repaymentDays}
          onChange={handleChange}
          placeholder="0"
          min="1"
          max="90"
          className={cn(
            'w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2',
            errors.repaymentDays
              ? 'border-red-300 bg-red-50 focus:ring-red-500/50'
              : 'border-gray-300 bg-white focus:border-green-500 focus:ring-green-500/50',
          )}
        />
        {errors.repaymentDays && <p className="mt-1 text-xs text-red-600">{errors.repaymentDays}</p>}
        <p className="mt-1 text-xs text-gray-500">Number of days vendor has to repay after purchase</p>
      </div>


      {/* Override Global Tiers Toggle */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-bold text-gray-900">Custom Discount & Interest Tiers</p>
              <p className="text-xs text-gray-500">Override system-wide tiers for this vendor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleOverride}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
              formData.overrideGlobalTiers ? "bg-green-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                formData.overrideGlobalTiers ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {formData.overrideGlobalTiers && (
          <div className="mt-6 space-y-6">
            {/* Custom Discount Tiers */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">Discount Tiers</h4>
                <button
                  type="button"
                  onClick={addDiscountTier}
                  className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700"
                >
                  <Plus className="h-3 w-3" /> Add Tier
                </button>
              </div>
              <div className="space-y-2">
                {formData.customDiscountTiers.map((tier, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="number" placeholder="Start Day" value={tier.periodStart}
                      onChange={(e) => updateDiscountTier(idx, 'periodStart', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number" placeholder="End Day" value={tier.periodEnd}
                      onChange={(e) => updateDiscountTier(idx, 'periodEnd', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="number" placeholder="Rate %" value={tier.discountRate}
                      onChange={(e) => updateDiscountTier(idx, 'discountRate', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text" placeholder="Tier Name (e.g. Early Bird)" value={tier.tierName}
                      onChange={(e) => updateDiscountTier(idx, 'tierName', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <button type="button" onClick={() => removeDiscountTier(idx)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {formData.customDiscountTiers.length === 0 && (
                  <p className="text-center text-xs text-gray-400 italic py-2">No custom discount tiers defined.</p>
                )}
              </div>
            </div>

            {/* Custom Interest Tiers */}
            <div className="border-t border-gray-200 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">Interest Tiers</h4>
                <button
                  type="button"
                  onClick={addInterestTier}
                  className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  <Plus className="h-3 w-3" /> Add Tier
                </button>
              </div>
              <div className="space-y-2">
                {formData.customInterestTiers.map((tier, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="number" placeholder="Start Day" value={tier.periodStart}
                      onChange={(e) => updateInterestTier(idx, 'periodStart', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number" placeholder="End Day" value={tier.periodEnd}
                      onChange={(e) => updateInterestTier(idx, 'periodEnd', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="number" placeholder="Rate %" value={tier.interestRate}
                      onChange={(e) => updateInterestTier(idx, 'interestRate', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text" placeholder="Tier Name (e.g. Late Fee)" value={tier.tierName}
                      onChange={(e) => updateInterestTier(idx, 'tierName', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    <button type="button" onClick={() => removeInterestTier(idx)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {formData.customInterestTiers.length === 0 && (
                  <p className="text-center text-xs text-gray-400 italic py-2">No custom interest tiers defined.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Special Agreement Section (Offline Settlement) */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-gray-900">Offline Settlement Agreement</p>
              <p className="text-xs text-gray-500">Enable fixed total repayment amount (overrides all calculations)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSpecialAgreementChange('active', !formData.specialAgreement.active)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
              formData.specialAgreement.active ? "bg-purple-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                formData.specialAgreement.active ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {formData.specialAgreement.active && (
          <div className="mt-4 space-y-4 border-t border-purple-200 pt-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Agreed Total Repayment Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.specialAgreement.agreedAmount}
                  onChange={(e) => handleSpecialAgreementChange('agreedAmount', e.target.value)}
                  placeholder="0"
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2",
                    errors.agreedAmount
                      ? "border-red-300 focus:ring-red-500"
                      : "border-purple-300 focus:ring-purple-500"
                  )}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              </div>
              {errors.agreedAmount && <p className="mt-1 text-xs text-red-600">{errors.agreedAmount}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Agreement Notes (Internal)</label>
              <textarea
                value={formData.specialAgreement.notes}
                onChange={(e) => handleSpecialAgreementChange('notes', e.target.value)}
                placeholder="e.g. Agreed with owner via phone on 25th Jan..."
                rows="2"
                className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-xs text-blue-900">
            <p className="font-bold">Credit Policy Guidelines</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Default credit limit is ₹1,00,000 for new vendors</li>
              <li>Standard repayment period is 30 days</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgba(34,197,94,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:shadow-[0_6px_20px_rgba(34,197,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Credit Policy'}
        </button>
      </div>
    </form>
  )
}

