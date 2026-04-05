import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  action?: ReactNode
  back?: boolean
  onBack?: () => void
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  )
}
