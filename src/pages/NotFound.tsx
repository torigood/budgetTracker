import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-4 p-6 text-center bg-white dark:bg-slate-950">
      <span className="text-6xl">🤔</span>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">페이지를 찾을 수 없어요</h1>
      <p className="text-slate-500">요청하신 페이지가 존재하지 않습니다</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-primary px-6 py-3 text-sm"
      >
        홈으로 돌아가기
      </button>
    </div>
  )
}
