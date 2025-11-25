import { useState } from 'react'
import { OtpVerification } from '../../../components/auth/OtpVerification'
import * as sellerApi from '../services/sellerApi'

export function SellerLogin({ onSuccess, onSubmit, onSwitchToRegister }) {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [form, setForm] = useState({ phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!form.phone.trim()) {
        setError('Contact number is required')
        setLoading(false)
        return
      }
      if (form.phone.length < 10) {
        setError('Please enter a valid contact number')
        setLoading(false)
        return
      }

      const result = await sellerApi.requestSellerOTP({ phone: form.phone })
      
      if (result.success || result.data) {
        setStep('otp')
      } else {
        setError(result.error?.message || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otpCode) => {
    setError(null)
    setLoading(true)

    try {
      const result = await sellerApi.loginSellerWithOtp({ phone: form.phone, otp: otpCode })

      if (result.success || result.data) {
        // Check if seller requires approval (pending status)
        if (result.data?.requiresApproval || result.data?.seller?.status === 'pending') {
          setError('Your account is pending admin approval. You will be able to access your dashboard once approved.')
          setLoading(false)
          return
        }

        // Check if seller is rejected
        if (result.data?.seller?.status === 'rejected') {
          setError('Your account has been rejected by the admin. Please contact support.')
          setLoading(false)
          return
        }

        // If approved, proceed with login
        if (result.data?.token) {
          localStorage.setItem('seller_token', result.data.token)
        }
        // Call both onSuccess and onSubmit for backward compatibility
        onSuccess?.(result.data?.seller || { phone: form.phone })
        onSubmit?.(result.data?.seller || { phone: form.phone })
      } else {
        setError(result.error?.message || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    try {
      await sellerApi.requestSellerOTP({ phone: form.phone })
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-3xl border border-green-200/60 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
            <OtpVerification
              phone={form.phone}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => setStep('phone')}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">IRA Partner Access</p>
          <h1 className="text-3xl font-bold text-gray-900">Sign in to IRA Partner Dashboard</h1>
          <p className="text-sm text-gray-600">Enter your contact number to continue</p>
        </div>

        <div className="rounded-3xl border border-green-200/60 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleRequestOtp} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="seller-login-phone" className="text-xs font-semibold text-gray-700">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                id="seller-login-phone"
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 90000 00000"
                maxLength={15}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-green-600 to-green-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-green-600 font-semibold hover:underline"
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
