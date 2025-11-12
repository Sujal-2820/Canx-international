export function HomeIcon({ active = false, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : 'currentColor'}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3 10.5 11.469 3a1 1 0 0 1 1.333 0L21 10.5M5.5 9.5V20a1 1 0 0 0 1 1H10v-5a2 2 0 0 1 4 0v5h3.5a1 1 0 0 0 1-1V9.5"
      />
    </svg>
  )
}

export function BoxIcon({ active = false, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M4.5 7.5 12 3l7.5 4.5M4.5 7.5V16.5L12 21l7.5-4.5V7.5M4.5 12 12 16.5 19.5 12"
      />
    </svg>
  )
}

export function CartIcon({ active = false, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3 4h2l1.6 9.6A2 2 0 0 0 8.57 15h7.86a2 2 0 0 0 1.97-1.4L20 7H6"
      />
      <circle cx="9" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </svg>
  )
}

export function CreditIcon({ active = false, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="5" width="18" height="14" rx="3" ry="3" strokeWidth="1.5" />
      <path strokeWidth="1.5" strokeLinecap="round" d="M3 10h18" />
      <circle cx="8" cy="15" r="1" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  )
}

export function ReportIcon({ active = false, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
      />
      <path strokeLinecap="round" strokeWidth="1.5" d="M9 12h6M9 16h4M14 3v4h4" />
    </svg>
  )
}

export function MenuIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  )
}

export function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeWidth="1.5" d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function SparkIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 9.4 9.4 3 12l6.4 2.6L12 21l2.6-6.4L21 12l-6.4-2.6L12 3Z"
        fill="currentColor"
        fillOpacity=".9"
      />
    </svg>
  )
}

export function TruckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M3 7h11v8H3zM14 9h4l3 3v3h-4"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  )
}

export function WalletIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="6" width="18" height="12" rx="3" strokeWidth="1.5" />
      <path d="M16 12h3" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export function ChartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 19V5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 19V9" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 19v-6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 19v-3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

