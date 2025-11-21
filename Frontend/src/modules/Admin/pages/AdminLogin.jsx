import { useState } from 'react'
import { OtpVerification } from '../../../components/auth/OtpVerification'
import { useAdminDispatch } from '../context/AdminContext'
import * as adminApi from '../services/adminApi'

export function AdminLogin({ onSubmit }) {
  const dispatch = useAdminDispatch()
  const [step, setStep] = useState('credentials') // 'credentials' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmitCredentials = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!form.email.trim()) {
        setError('Email is required')
        setLoading(false)
        return
      }
      if (!form.password.trim()) {
        setError('Password is required')
        setLoading(false)
        return
      }

      // Step 1: Login with email/password (triggers OTP)
      const result = await adminApi.loginAdmin({ email: form.email, password: form.password })

      if (result.success || result.data) {
        // Request OTP to email
        await adminApi.requestAdminOTP({ email: form.email })
        setStep('otp')
      } else {
        setError(result.error?.message || 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otpCode) => {
    setError(null)
    setLoading(true)

    try {
      // Step 2: Verify OTP and complete login
      const result = await adminApi.verifyAdminOTP({ email: form.email, otp: otpCode })

      if (result.success || result.data) {
        // Store token
        if (result.data?.token) {
          localStorage.setItem('admin_token', result.data.token)
        }
        // Update context with admin profile
        dispatch({
          type: 'AUTH_LOGIN',
          payload: {
            id: result.data.admin.id,
            name: result.data.admin.name,
            email: result.data.admin.email,
            role: result.data.admin.role,
          },
        })
        onSubmit?.(result.data.admin)
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
      await adminApi.requestAdminOTP({ email: form.email })
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-3xl border border-gray-200/60 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
            <OtpVerification
              email={form.email}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => setStep('credentials')}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Admin Access</p>
          <h1 className="text-3xl font-bold text-gray-900">Sign in to IRA Sathi</h1>
          <p className="text-sm text-gray-600">Enter your credentials to access admin dashboard</p>
        </div>

        <div className="rounded-3xl border border-gray-200/60 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmitCredentials} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-xs font-semibold text-gray-700">
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@irasathi.com"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-semibold text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-gray-700 to-gray-800 px-5 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
