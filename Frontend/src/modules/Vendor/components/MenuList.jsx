import { cn } from '../../../lib/cn'

export function MenuList({ items = [], active }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => item.onSelect?.(item.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-medium transition',
              active === item.id
                ? 'border-brand bg-brand-soft/80 text-brand shadow-card'
                : 'bg-surface text-muted-foreground hover:border-brand/40 hover:text-brand',
            )}
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-white/80 text-brand">
              {item.icon}
            </span>
            <div className="flex-1">
              <p className="font-semibold leading-tight text-surface-foreground">{item.label}</p>
              {item.description ? (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

