import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { VendorRegister } from '../pages/VendorRegister'

export function VendorRegisterPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('vendor_token')
    if (token) {
      navigate('/vendor/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <VendorRegister
      onSwitchToLogin={() => navigate('/vendor/login')}
      onSuccess={() => navigate('/vendor/dashboard')}
    />
  )
}

