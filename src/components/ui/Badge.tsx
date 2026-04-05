interface BadgeProps {
  color: string
  label: string
  icon?: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ color, label, size = 'md' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
