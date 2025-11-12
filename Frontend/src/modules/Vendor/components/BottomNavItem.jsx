import { cn } from '../../../lib/cn'

export function BottomNavItem({ label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center rounded-2xl px-0 py-1 transition-colors',
        active ? 'text-brand' : 'text-muted-foreground',
      )}
      aria-label={label}
    >
      <span
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full transition-all',
          active ? 'bg-[#e4f2ea] text-brand shadow-[0_6px_14px_-12px_rgba(15,23,42,0.5)]' : 'bg-transparent text-muted-foreground',
        )}
      >
        {active ? <span className="absolute inset-0 rounded-full bg-brand/8" /> : null}
        {icon}
      </span>
    </button>
  )
}

