interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-500`}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80">
        {spinner}
      </div>
    )
  }

  return spinner
}
