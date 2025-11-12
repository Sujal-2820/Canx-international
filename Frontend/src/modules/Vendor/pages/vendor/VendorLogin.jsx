import { useState } from 'react'
import { useVendorDispatch } from '../../context/VendorContext'

export function VendorLogin({ onBack, onRegister, onSuccess }) {
  const dispatch = useVendorDispatch()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // Stubbed auth success
    dispatch({ type: 'AUTH_LOGIN', payload: { name: 'Suresh Patel', email: form.email } })
    onSuccess?.()
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-5 py-10">
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-full border border-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground"
      >
        Back
      </button>
      <div className="mx-auto mt-8 w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-surface-foreground">Vendor Login</h1>
          <p className="text-sm text-muted-foreground">
            Enter your registered email and password to access the vendor dashboard.
          </p>
        </div>
        <form className="rounded-3xl border border-muted/60 bg-white/80 p-5 shadow-card" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
                Email ID
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm text-surface-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="vendor@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm text-surface-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-muted/60 text-brand focus:ring-brand/60"
                />
                Remember me
              </label>
              <button type="button" className="text-xs font-semibold text-brand">
                Forgot?
              </button>
            </div>
            <button type="submit" className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground">
              Sign In
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          New to AgroCart?{' '}
          <button type="button" className="font-semibold text-brand underline-offset-2" onClick={onRegister}>
            Register here
          </button>
        </p>
      </div>
    </div>
  )
}

