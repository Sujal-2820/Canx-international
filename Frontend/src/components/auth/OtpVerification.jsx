import { useState, useRef, useEffect } from 'react'

export function OtpVerification({ phone, email, onVerify, onResend, onBack, loading = false, error = null }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit
        })
        setOtp(newOtp)
        const nextIndex = Math.min(digits.length, 5)
        inputRefs.current[nextIndex]?.focus()
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length === 6) {
      onVerify(otpString)
    }
  }

  const handleResend = () => {
    setOtp(['', '', '', '', '', ''])
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
    onResend?.()
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-surface-foreground">Enter Verification Code</h2>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit code to{' '}
          <span className="font-semibold text-surface-foreground">
            {phone || email}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-semibold rounded-2xl border-2 border-muted/60 bg-surface focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={otp.join('').length !== 6 || loading}
            className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-brand font-semibold hover:underline disabled:opacity-50"
            >
              Resend
            </button>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm text-muted-foreground hover:text-surface-foreground transition-colors"
            >
              ← Change {phone ? 'phone number' : 'email'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

