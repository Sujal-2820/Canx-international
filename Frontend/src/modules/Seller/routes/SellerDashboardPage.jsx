import { useNavigate } from 'react-router-dom'
import { SellerDashboard } from '../pages/SellerDashboard'
import { SellerProvider, useSellerDispatch } from '../context/SellerContext'
import { ToastProvider } from '../components/ToastNotification'

function SellerDashboardContent() {
  const navigate = useNavigate()
  const dispatch = useSellerDispatch()

  return (
    <SellerDashboard
      onLogout={() => {
        dispatch({ type: 'AUTH_LOGOUT' })
        navigate('/seller/login')
      }}
    />
  )
}

export function SellerDashboardPage() {
  return (
    <SellerProvider>
      <ToastProvider>
        <SellerDashboardContent />
      </ToastProvider>
    </SellerProvider>
  )
}

