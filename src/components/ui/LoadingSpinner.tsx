interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200/80 border-t-indigo-500 shadow-sm dark:border-slate-700/80`}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-md dark:bg-slate-950/70">
        {spinner}
      </div>
    )
  }

  return spinner
}
