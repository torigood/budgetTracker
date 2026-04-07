interface BadgeProps {
  color: string
  label: string
  icon?: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ color, label, size = 'md' }: BadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border font-semibold shadow-sm backdrop-blur-sm ${
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-sm'
      }`}
      style={{ backgroundColor: `${color}14`, color, borderColor: `${color}24` }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
