import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'fab'
type ButtonSize = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  text: 'btn-text',
  fab: 'btn-fab',
}

const sizeClass: Record<ButtonSize, string> = {
  md: '',
  lg: 'min-h-[58px] rounded-[1.45rem] px-6 text-base',
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'btn',
        variantClass[variant],
        variant !== 'fab' && sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {icon}
      {variant !== 'fab' && children}
      {variant === 'fab' && (icon ?? children)}
    </button>
  )
}

