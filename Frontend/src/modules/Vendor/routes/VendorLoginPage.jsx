import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { VendorLogin } from '../pages/vendor/VendorLogin'
import '../vendor.css'

export function VendorLoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('vendor_token')
    if (token) {
      navigate('/vendor/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <VendorLogin
      onSwitchToRegister={() => navigate('/vendor/register')}
      onSuccess={() => navigate('/vendor/dashboard')}
    />
  )
}

