import { useEffect, useState } from 'react'
import { ArrowRight, Check, Languages, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'

export default function Landing() {
  const { user, loading } = useAuthStore()
  const { lang, setLang, isDark, toggleDark } = useUIStore()
  const navigate = useNavigate()
  const ko = lang === 'ko'
  const [page, setPage] = useState(0)

  const pages = [
    {
      eyebrow: ko ? '돈의 흐름' : 'Money flow',
      title: ko ? '돈 관리를\n가볍게 시작해요' : 'Track your money\neffortlessly',
      body: ko
        ? '수입과 지출을 차분하게 기록하고, 오늘의 흐름을 한눈에 확인하세요.'
        : "Log income and expenses calmly, then see today's flow at a glance.",
      tone: 'flow',
    },
    {
      eyebrow: ko ? '소비 인사이트' : 'Spending insight',
      title: ko ? '소비 습관을\n부드럽게 이해해요' : 'Understand your\nspending habits',
      body: ko
        ? '카테고리별 지출과 월간 변화를 미니멀한 리포트로 정리해드려요.'
        : 'Review categories and monthly changes through quiet, elegant reports.',
      tone: 'insight',
    },
    {
      eyebrow: ko ? '건강한 루틴' : 'Healthy routine',
      title: ko ? '더 건강한\n금융 루틴을 만들어요' : 'Build healthier\nfinancial routines',
      body: ko
        ? '예산 목표와 남은 금액을 자연스럽게 확인하며 꾸준한 습관을 만들어가요.'
        : 'Follow budgets and remaining balances naturally, one calm habit at a time.',
      tone: 'routine',
    },
  ] as const

  const current = pages[page]
  const isLast = page === pages.length - 1

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="flex min-h-svh justify-center bg-[#f2f2ef] px-0 dark:bg-[#0a0c0a] md:px-4 md:py-4">
      <main className="relative flex min-h-svh w-full max-w-[430px] flex-col overflow-hidden bg-[#fbfbfa] dark:bg-[#111410] md:min-h-[calc(100svh-2rem)] md:rounded-[2.7rem] md:border md:border-white/70 md:shadow-[0_34px_100px_rgba(20,23,22,0.16)] dark:md:border-slate-700/50">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))] text-xs font-semibold text-[#141716] dark:text-slate-200">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-[var(--fintra-shadow-soft)] dark:bg-slate-700 dark:text-slate-300"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setLang(ko ? 'en' : 'ko')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-[var(--fintra-shadow-soft)] dark:bg-slate-700 dark:text-slate-300"
            >
              <Languages className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="flex flex-1 flex-col justify-between px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-9">
          <div>
            {/* App header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-11 w-11 grid-cols-2 overflow-hidden rounded-[1rem] shadow-[var(--fintra-shadow-soft)]">
                  <span className="bg-[#006b5b]" />
                  <span className="bg-[#c9ddd2]" />
                  <span className="bg-[#eee5d8]" />
                  <span className="bg-[#8aa79a]" />
                </div>
                <div>
                  <h1 className="font-display text-[1.35rem] font-semibold leading-none text-[#141716] dark:text-white">Fintra</h1>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9390] dark:text-slate-400">
                    {current.eyebrow}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login?signup=true')}
                className="rounded-full px-3 py-2 text-xs font-bold text-[#006b5b] transition active:scale-95 dark:text-emerald-400"
              >
                {ko ? '건너뛰기' : 'Skip'}
              </button>
            </div>

            {/* Illustration card */}
            <div className="relative mt-8 h-[330px] overflow-hidden rounded-[2.2rem] bg-[linear-gradient(180deg,#fffaf2_0%,#f4f8f5_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)] dark:bg-[linear-gradient(180deg,#1c231e_0%,#161c17_100%)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(242,228,212,0.95),rgba(242,228,212,0))] dark:bg-[linear-gradient(180deg,rgba(30,20,14,0.8),rgba(22,28,23,0))]" />
              <div className="absolute left-6 top-6 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold text-[#006b5b] shadow-[var(--fintra-shadow-soft)] dark:bg-slate-700/80 dark:text-emerald-400">
                {ko ? '오늘의 흐름' : 'Today'}
              </div>

              {current.tone === 'flow' && (
                <>
                  <div className="absolute left-8 top-20 h-36 w-36 rounded-full bg-[#dbeee8] dark:bg-[#0d2f26]" />
                  <div className="absolute right-[-2.5rem] top-12 h-48 w-48 rounded-full bg-[#f2dfca] dark:bg-[#2a1e12]" />
                  <div className="absolute bottom-10 left-7 right-7 rounded-[1.7rem] bg-white p-4 shadow-[0_18px_45px_rgba(20,23,22,0.1)] dark:bg-slate-800 dark:shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#8b9390] dark:text-slate-400">
                      <span>{ko ? '총 잔액' : 'Total balance'}</span>
                      <span className="rounded-full bg-[#e8f4ef] px-2.5 py-1 text-[#006b5b] dark:bg-emerald-900/40 dark:text-emerald-400">+12%</span>
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#141716] dark:text-white">₩1,586,489</p>
                    <div className="mt-5 flex h-16 items-end gap-2">
                      {[34, 48, 38, 62, 54, 78, 68].map((height, index) => (
                        <span
                          key={height}
                          className={`flex-1 rounded-full ${index === 5 ? 'bg-[#006b5b]' : 'bg-[#c9ddd2] dark:bg-slate-600'}`}
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {current.tone === 'insight' && (
                <>
                  <div className="absolute left-[-2rem] top-12 h-44 w-44 rounded-full bg-[#e9f1ec] dark:bg-[#0d2018]" />
                  <div className="absolute bottom-[-3rem] right-[-2rem] h-52 w-52 rounded-full bg-[#f5dcc7] dark:bg-[#261a0e]" />
                  <div className="absolute left-1/2 top-20 h-38 w-38 -translate-x-1/2 rounded-full bg-[conic-gradient(#006b5b_0_34%,#8aa79a_34%_56%,#f2a43c_56%_75%,#f26d4f_75%_88%,#e7ece9_88%_100%)] p-5 shadow-[0_20px_50px_rgba(20,23,22,0.12)]">
                    <div className="h-full w-full rounded-full bg-[#fbfbfa] dark:bg-[#161c17]" />
                  </div>
                  <div className="absolute bottom-9 left-7 right-7 grid grid-cols-2 gap-3">
                    {[
                      ['식비', '33%', '#006b5b'],
                      ['교통', '18%', '#8aa79a'],
                      ['생활', '16%', '#f2a43c'],
                      ['여가', '12%', '#f26d4f'],
                    ].map(([label, value, color]) => (
                      <div key={label} className="rounded-[1.2rem] bg-white/88 p-3 shadow-[var(--fintra-shadow-soft)] dark:bg-slate-800/90">
                        <span className="block h-2 w-8 rounded-full" style={{ backgroundColor: color }} />
                        <p className="mt-2 text-xs font-bold text-[#6f7775] dark:text-slate-400">{label}</p>
                        <p className="text-lg font-semibold text-[#141716] dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {current.tone === 'routine' && (
                <>
                  <div className="absolute inset-x-[-2rem] bottom-0 h-40 rounded-[55%_45%_0_0] bg-[#f3dfc8] dark:bg-[#1e1208]" />
                  <div className="absolute inset-x-[-2rem] bottom-0 h-32 rounded-[52%_48%_0_0] bg-[#cadbd1] dark:bg-[#0d2820]" />
                  <div className="absolute right-12 top-16 h-8 w-8 rounded-full bg-[#f7a43a] shadow-[0_12px_25px_rgba(247,164,58,0.24)]" />
                  <div className="absolute bottom-11 left-1/2 h-30 w-px -translate-x-1/2 bg-[#006b5b] dark:bg-emerald-600" />
                  <div className="absolute bottom-23 left-[51%] h-14 w-8 rotate-[-35deg] rounded-full bg-[#6f9788] dark:bg-[#2a5e4e]" />
                  <div className="absolute bottom-18 left-[43%] h-12 w-7 rotate-[38deg] rounded-full bg-[#8aa79a] dark:bg-[#355e52]" />
                  <div className="absolute bottom-34 left-[52%] h-12 w-7 rotate-[36deg] rounded-full bg-[#356f61] dark:bg-[#1a4a3c]" />
                  <div className="absolute left-7 top-20 rounded-[1.35rem] bg-white/90 p-3.5 shadow-[var(--fintra-shadow-soft)] dark:bg-slate-800/90">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f4ef] text-[#006b5b] dark:bg-emerald-900/40 dark:text-emerald-400">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-bold text-[#141716] dark:text-white">{ko ? '예산 78%' : 'Budget 78%'}</span>
                    </div>
                    <div className="mt-3 h-2 w-28 rounded-full bg-[#edf1ef] dark:bg-slate-700">
                      <div className="h-full w-[78%] rounded-full bg-[#006b5b]" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom text + navigation */}
          <div className="pt-8 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#006b5b] dark:text-emerald-400">
              {String(page + 1).padStart(2, '0')} / 03
            </p>
            <h2 className="mt-3 whitespace-pre-line text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.01em] text-[#141716] dark:text-white">
              {current.title}
            </h2>
            <p className="mt-4 max-w-[19.5rem] text-[14px] font-medium leading-6 text-[#7d8582] dark:text-slate-400">
              {current.body}
            </p>

            <div className="mt-7 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {pages.map((item, index) => (
                  <button
                    key={item.tone}
                    onClick={() => setPage(index)}
                    aria-label={`${ko ? '온보딩' : 'Onboarding'} ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      index === page ? 'w-7 bg-[#006b5b] dark:bg-emerald-500' : 'w-2 bg-[#d5dad7] dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  if (isLast) {
                    navigate('/login?signup=true')
                    return
                  }
                  setPage((value) => value + 1)
                }}
                className="flex h-14 min-w-36 items-center justify-center gap-2 rounded-full bg-[#006b5b] px-6 text-sm font-bold text-white shadow-[0_18px_36px_rgba(0,107,91,0.22)] active:scale-[0.99]"
              >
                {isLast ? (ko ? '시작하기' : 'Get started') : (ko ? '다음' : 'Next')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
