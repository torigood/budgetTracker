import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, PieChart, RefreshCw, Camera, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'

const features = [
  {
    icon: TrendingUp,
    title: '실시간 자산 현황',
    desc: '수입·지출을 한눈에 파악하고 월별 순손익을 즉시 확인하세요.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: PieChart,
    title: '카테고리 분석',
    desc: '카테고리별 지출 비중을 시각화하여 소비 패턴을 파악합니다.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Camera,
    title: 'AI 영수증 인식',
    desc: '영수증 사진만 찍으면 자동으로 거래 내역이 입력됩니다.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: RefreshCw,
    title: '자동 지출 관리',
    desc: '정기 구독·공과금 등 반복 지출을 자동으로 기록합니다.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: ShieldCheck,
    title: '보안 & 동기화',
    desc: 'Supabase 기반 실시간 동기화로 모든 기기에서 안전하게.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Zap,
    title: '빠른 거래 입력',
    desc: '단축키 N 하나로 어디서든 즉시 거래를 기록하세요.',
    color: 'bg-purple-50 text-purple-600',
  },
]

const highlights = ['무료로 시작', '카드 불필요', '광고 없음']

export default function Landing() {
  const { user, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="min-h-svh flex flex-col bg-white dark:bg-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/icons/logo128.png" alt="Budget Tracker" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
            <span className="text-base font-bold text-slate-900 dark:text-white">Budget Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              로그인
            </Link>
            <Link
              to="/login"
              className="btn btn-primary text-sm px-4 py-2"
            >
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background gradient blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-100 dark:bg-indigo-900/20 blur-3xl opacity-60" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-purple-100 dark:bg-purple-900/20 blur-3xl opacity-40" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              지금 바로 시작해보세요
            </div>

            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
              돈의 흐름을{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                한눈에
              </span>{' '}
              파악하세요
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base text-slate-500 dark:text-slate-400 sm:text-lg leading-relaxed">
              수입·지출 기록부터 AI 영수증 인식, 카테고리 분석까지.
              <br className="hidden sm:block" />
              스마트한 가계부로 재정 목표를 달성하세요.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                className="btn btn-primary inline-flex gap-2 px-7 py-3.5 text-base"
              >
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-3">
                {highlights.map((h) => (
                  <span key={h} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Mock screenshot card */}
            <div className="mx-auto mt-14 max-w-2xl">
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-xl overflow-hidden">
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="mx-auto h-5 w-48 rounded-full bg-slate-100 dark:bg-slate-700" />
                </div>
                {/* Dashboard preview (simplified) */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3">
                      <div className="h-3 w-10 rounded bg-rose-200 dark:bg-rose-700 mb-2" />
                      <div className="h-5 w-16 rounded bg-rose-300 dark:bg-rose-600" />
                    </div>
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                      <div className="h-3 w-10 rounded bg-emerald-200 dark:bg-emerald-700 mb-2" />
                      <div className="h-5 w-16 rounded bg-emerald-300 dark:bg-emerald-600" />
                    </div>
                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
                      <div className="h-3 w-10 rounded bg-indigo-200 dark:bg-indigo-700 mb-2" />
                      <div className="h-5 w-16 rounded bg-indigo-300 dark:bg-indigo-600" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="h-2 w-16 rounded bg-slate-100 dark:bg-slate-600" />
                        </div>
                        <div className={`h-3 w-14 rounded ${i % 2 === 0 ? 'bg-rose-200 dark:bg-rose-800' : 'bg-emerald-200 dark:bg-emerald-800'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-slate-50 dark:bg-slate-900 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                필요한 기능, 전부 담았습니다
              </h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm sm:text-base">
                복잡하지 않고, 꼭 필요한 것만 모았습니다.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-xl px-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-lg">
              <img src="/icons/logo512.png" alt="Budget Tracker" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              지금 바로 시작하세요
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              가입 후 즉시 사용 가능. 신용카드 불필요.
            </p>
            <Link
              to="/login"
              className="btn btn-primary mt-7 inline-flex gap-2 px-7 py-3.5 text-base"
            >
              무료로 시작하기 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Budget Tracker · Made with React + Supabase
      </footer>
    </div>
  )
}
