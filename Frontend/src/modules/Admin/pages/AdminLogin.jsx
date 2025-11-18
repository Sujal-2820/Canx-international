import { useState } from 'react'
import { useAdminDispatch } from '../context/AdminContext'
import { useAdminApi } from '../hooks/useAdminApi'

export function AdminLogin({ onSubmit }) {
  const dispatch = useAdminDispatch()
  const { login, loading, error } = useAdminApi()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await login(form)
    if (result.data) {
      // Store token
      if (result.data.token) {
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
      onSubmit?.(form)
    } else if (result.error) {
      // Error is handled by the hook and displayed via error state
      console.error('Login failed:', result.error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-muted/40 bg-surface-secondary p-6 shadow-card animate-scale-in">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin Access</p>
          <h1 className="mt-2 text-2xl font-semibold text-surface-foreground">Sign in to IRA Sathi</h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-xs font-semibold text-muted-foreground">
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-2xl border border-muted/40 bg-muted/10 px-4 py-3 text-sm text-surface-foreground transition-all duration-200 focus:border-brand focus:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-semibold text-muted-foreground">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-2xl border border-muted/40 bg-muted/10 px-4 py-3 text-sm text-surface-foreground transition-all duration-200 focus:border-brand focus:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error.message || 'An error occurred'}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-all duration-200 hover:bg-brand-light hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

