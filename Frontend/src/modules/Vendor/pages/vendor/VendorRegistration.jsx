import { useState } from 'react'

export function VendorRegistration({ onBack, onRegistered }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    document: null,
  })

  const handleChange = (event) => {
    const { name, value, files } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // Future API request placeholder
    onRegistered?.(form)
  }

  return (
    <div className="min-h-screen bg-white px-5 py-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 rounded-full border border-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground"
      >
        Back to login
      </button>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-muted/60 bg-white/80 p-5 shadow-card">
        <h1 className="text-2xl font-semibold text-surface-foreground">Vendor Registration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Provide your details to register as a vendor. Admin will verify your documents before activation.
        </p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm text-surface-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
              Email
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
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="phone">
              Mobile Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm text-surface-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="+91 90000 00000"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="addressLine1">
                Address Line 1
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                required
                value={form.addressLine1}
                onChange={handleChange}
                className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="addressLine2">
                Address Line 2
              </label>
              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                value={form.addressLine2}
                onChange={handleChange}
                className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="city">
                City / District
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="state">
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                required
                value={form.state}
                onChange={handleChange}
                className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="pincode">
                Pincode
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                required
                value={form.pincode}
                onChange={handleChange}
                className="w-full rounded-2xl border border-muted/60 bg-surface px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="document">
              Aadhaar (PDF or Image)
            </label>
            <input
              id="document"
              name="document"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              onChange={handleChange}
              className="w-full rounded-2xl border border-dashed border-muted/60 bg-white/70 px-4 py-4 text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-card"
          >
            Submit Registration
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already registered?{' '}
          <button type="button" onClick={onBack} className="font-semibold text-brand underline-offset-2">
            Login here
          </button>
        </p>
      </div>
    </div>
  )
}

