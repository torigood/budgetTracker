import type { HTMLAttributes, ReactNode } from 'react'

type CardVariant = 'default' | 'balance' | 'analytics' | 'transaction' | 'budget' | 'settings' | 'soft'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  interactive?: boolean
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  action?: ReactNode
}

const variantClass: Record<CardVariant, string> = {
  default: 'fintra-card',
  balance: 'fintra-card-balance',
  analytics: 'fintra-card-analytics',
  transaction: 'fintra-card-transaction',
  budget: 'fintra-card-budget',
  settings: 'fintra-card-settings',
  soft: 'fintra-card-soft',
}

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Card({
  variant = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cx(
        variantClass[variant],
        paddingClass[padding],
        interactive && 'fintra-card-interactive',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ action, className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cx('fintra-card-header', className)} {...props}>
      <div className="min-w-0">{children}</div>
      {action}
    </div>
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx('fintra-card-title', className)} {...props} />
}

export function CardSubtitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx('fintra-card-subtitle', className)} {...props} />
}

