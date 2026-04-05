import { Component, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}
interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <AlertCircle className="mb-3 h-12 w-12 text-red-400" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            오류가 발생했습니다
          </h3>
          <p className="mt-1 text-sm text-gray-400">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white"
          >
            다시 시도
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
