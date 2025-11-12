import { useMemo, useState } from 'react'
import { VendorProvider, useVendorDispatch, useVendorState } from './context/VendorContext'
import { LanguageSelect } from './pages/common/LanguageSelect'
import { RoleSelect } from './pages/common/RoleSelect'
import { VendorRegistration } from './pages/vendor/VendorRegistration'
import { VendorLogin } from './pages/vendor/VendorLogin'
import { VendorDashboard } from './pages/vendor/VendorDashboard'
import './vendor.css'

const steps = {
  LANGUAGE: 'language',
  ROLE: 'role',
  VENDOR_REGISTER: 'vendor-register',
  VENDOR_LOGIN: 'vendor-login',
  VENDOR_DASHBOARD: 'vendor-dashboard',
  SELLER_FLOW: 'seller-flow',
}

function VendorFlow() {
  const { authenticated, role } = useVendorState()
  const dispatch = useVendorDispatch()
  const [step, setStep] = useState(steps.LANGUAGE)

  const goToRole = () => setStep(steps.ROLE)
  const goToVendorRegister = () => setStep(steps.VENDOR_REGISTER)
  const goToVendorLogin = () => setStep(steps.VENDOR_LOGIN)
  const goToVendorDashboard = () => setStep(steps.VENDOR_DASHBOARD)

  const view = useMemo(() => {
    if (step === steps.LANGUAGE) {
      return <LanguageSelect onContinue={goToRole} />
    }

    if (step === steps.ROLE) {
      return (
        <RoleSelect
          onSelect={(selectedRole) => {
            dispatch({ type: 'SET_ROLE', payload: selectedRole })
            if (selectedRole === 'vendor') {
              setStep(steps.VENDOR_LOGIN)
            } else {
              setStep(steps.SELLER_FLOW)
            }
          }}
          onBack={() => setStep(steps.LANGUAGE)}
        />
      )
    }

    if (role === 'vendor') {
      if (step === steps.VENDOR_REGISTER) {
        return <VendorRegistration onBack={goToVendorLogin} onRegistered={goToVendorLogin} />
      }
      if (step === steps.VENDOR_LOGIN && !authenticated) {
        return <VendorLogin onBack={goToRole} onRegister={goToVendorRegister} onSuccess={goToVendorDashboard} />
      }
      return <VendorDashboard onLogout={() => setStep(steps.VENDOR_LOGIN)} />
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
        <h1 className="text-2xl font-semibold text-surface-foreground">Seller flow coming soon</h1>
        <button
          type="button"
          className="mt-6 inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
          onClick={() => setStep(steps.ROLE)}
        >
          Back to role selection
        </button>
      </div>
    )
  }, [authenticated, dispatch, role, step])

  return view
}

export function VendorApp() {
  return (
    <VendorProvider>
      <div className="vendor-app">
        <VendorFlow />
      </div>
    </VendorProvider>
  )
}

export default VendorApp

