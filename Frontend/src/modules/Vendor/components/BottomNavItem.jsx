import { cn } from '../../../lib/cn'

export function BottomNavItem({ label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-xs font-medium transition-colors',
        active ? 'text-brand' : 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-all',
          active ? 'bg-brand-soft shadow-card text-brand' : 'bg-surface text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span className={cn('text-[11px]', active ? 'font-semibold text-brand' : 'text-muted-foreground')}>{label}</span>
    </button>
  )
}

