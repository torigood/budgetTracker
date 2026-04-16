import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, PieChart, RefreshCw, Camera, ShieldCheck, Zap, ArrowRight, Check, Languages, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'

export default function Landing() {
  const { user, loading } = useAuthStore()
  const { lang, setLang, isDark, toggleDark } = useUIStore()
  const logoSrc = isDark ? '/icons/logo_dark_512.png' : '/icons/logo_light_512.png'
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.landing-reveal'))
    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -10% 0px' },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax-speed]'))
    if (!nodes.length) return

    let rafId: number | null = null

    const render = () => {
      const viewport = window.innerHeight || 1
      const width = window.innerWidth || 1
      const intensity = width < 768 ? 0.55 : 1

      nodes.forEach((node) => {
        const speed = Number(node.dataset.parallaxSpeed ?? '0.06')
        const rect = node.getBoundingClientRect()
        const center = rect.top + rect.height / 2
        const normalized = (center - viewport / 2) / (viewport / 2)
        const clamped = Math.max(-1, Math.min(1, normalized))

        const y = -clamped * speed * 24 * intensity
        const scale = 1 + (1 - Math.abs(clamped)) * speed * 0.025 * intensity

        node.style.setProperty('--parallax-y', `${y.toFixed(2)}px`)
        node.style.setProperty('--parallax-scale', scale.toFixed(4))
      })

      rafId = null
    }

    const queueRender = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(render)
    }

    render()
    window.addEventListener('scroll', queueRender, { passive: true })
    window.addEventListener('resize', queueRender)

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', queueRender)
      window.removeEventListener('resize', queueRender)
    }
  }, [])

  const ko = lang === 'ko'

  const features = ko ? [
    { icon: TrendingUp, title: '실시간 자산 현황', desc: '수입·지출을 한눈에 파악하고 월별 순손익을 즉시 확인하세요.' },
    { icon: PieChart, title: '카테고리 분석', desc: '카테고리별 지출 비중을 시각화하여 소비 패턴을 파악합니다.' },
    { icon: Camera, title: 'AI 영수증 인식', desc: '영수증 사진만 찍으면 자동으로 거래 내역이 입력됩니다.' },
    { icon: RefreshCw, title: '자동 지출 관리', desc: '정기 구독·공과금 등 반복 지출을 자동으로 기록합니다.' },
    { icon: ShieldCheck, title: '보안 & 동기화', desc: 'Supabase 기반 실시간 동기화로 모든 기기에서 안전하게.' },
    { icon: Zap, title: '빠른 거래 입력', desc: '단축키 N 하나로 어디서든 즉시 거래를 기록하세요.' },
  ] : [
    { icon: TrendingUp, title: 'Real-time overview', desc: 'See income and expenses at a glance and check monthly net instantly.' },
    { icon: PieChart, title: 'Category analytics', desc: 'Visualize spending by category and understand your habits.' },
    { icon: Camera, title: 'AI receipt scanning', desc: 'Just take a photo of your receipt — transactions are auto-filled.' },
    { icon: RefreshCw, title: 'Recurring expenses', desc: 'Auto-log subscriptions and bills without any manual entry.' },
    { icon: ShieldCheck, title: 'Secure & synced', desc: 'Real-time Supabase sync keeps your data safe across all devices.' },
    { icon: Zap, title: 'Quick entry', desc: 'Press N anywhere to instantly log a transaction.' },
  ]

  const highlights = ko
    ? ['무료로 시작', '카드 불필요', '광고 없음']
    : ['Free to start', 'No credit card', 'No ads']

  const featureCardTints = ['#12151f', '#0d1f3c', '#0f1a0f']

  return (
    <div className="min-h-svh flex flex-col bg-transparent text-[var(--color-text-primary)]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/80 backdrop-blur-sm dark:bg-[rgba(8,8,15,0.72)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <img src={logoSrc} alt="Budget Tracker" className="h-9 w-9 rounded-xl object-cover shrink-0 border border-white/10" />
            <span className="text-base font-semibold whitespace-nowrap text-[var(--color-text-primary)]">Budget Tracker</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleDark}
              className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/5"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setLang(ko ? 'en' : 'ko')}
              className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] dark:hover:bg-white/5"
              title={ko ? 'English' : '한국어'}
            >
              <Languages className="h-4 w-4" />
            </button>
            <Link
              to="/login"
              className="btn btn-primary shrink-0 text-sm px-3.5 py-2 whitespace-nowrap"
            >
              {ko ? '로그인' : 'Sign in'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="landing-reveal landing-parallax relative mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24" data-parallax-speed="0.09">
            <div className="landing-parallax-inner">
              <div className="inline-flex items-center gap-2 border border-white/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                {ko ? '지금 바로 시작해보세요' : 'Start tracking today'}
              </div>

              <h1 className="mx-auto mt-8 max-w-4xl text-5xl sm:text-6xl md:text-7xl font-display">
                {ko ? '돈의 흐름을 한눈에 파악하세요' : 'Track your finances at a glance'}
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base leading-8 text-[var(--color-text-secondary)]">
                {ko
                  ? <>수입·지출 기록부터 AI 영수증 인식, 카테고리 분석까지.<br className="hidden sm:block" />스마트한 가계부로 재정 목표를 달성하세요.</>
                  : <>From income tracking to AI receipt scanning and category analytics.<br className="hidden sm:block" />Manage your money smarter.</>
                }
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  to="/login?signup=true"
                  className="btn btn-primary inline-flex gap-2 px-7 py-3.5 text-base"
                >
                  {ko ? '무료로 시작하기' : 'Get started free'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {highlights.map((h) => (
                    <span key={h} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="landing-reveal landing-parallax mb-8 max-w-2xl" data-parallax-speed="0.07">
              <div className="landing-parallax-inner">
                <h2 className="text-2xl sm:text-3xl font-display">
                  {ko ? '필요한 기능, 전부 담았습니다' : 'Everything you need'}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[var(--color-text-secondary)]">
                  {ko ? '복잡하지 않고, 꼭 필요한 것만 모았습니다.' : 'Simple, focused, and just right.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }, index) => (
                <article
                  key={title}
                  className="landing-reveal landing-parallax rounded-[16px] border-[0.5px] border-[rgba(255,255,255,0.06)] p-7 transition-colors duration-200 hover:border-[#1a56db]"
                  data-parallax-speed={(0.05 + (index % 3) * 0.015).toFixed(3)}
                  style={{
                    backgroundColor: featureCardTints[index % featureCardTints.length],
                    transitionDelay: `${index * 70}ms`,
                  }}
                >
                  <div className="landing-parallax-inner">
                    <h3 className="flex items-center gap-2 text-[15px] font-medium text-white">
                      <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                      <span>{title}</span>
                    </h3>
                    <p className="mt-3 text-[13px] leading-[1.7] text-[#6b7280]">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="landing-reveal landing-parallax mx-auto max-w-2xl px-6 text-center" data-parallax-speed="0.08">
            <div className="landing-parallax-inner">
              <div className="mx-auto mb-6 h-px w-24 bg-white/15" />
              <img src={logoSrc} alt="Budget Tracker" className="mx-auto mb-5 h-14 w-14 rounded-xl object-cover border border-white/10" />
              <h2 className="text-2xl sm:text-3xl font-display">
                {ko ? '지금 바로 시작하세요' : 'Start today'}
              </h2>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                {ko ? '가입 후 즉시 사용 가능. 신용카드 불필요.' : 'Ready to use after signup. No credit card.'}
              </p>
              <Link
                to="/login?signup=true"
                className="btn btn-primary mt-7 inline-flex gap-2 px-7 py-3.5 text-base"
              >
                {ko ? '무료로 시작하기' : 'Get started free'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-[var(--color-text-muted)]">
        © {new Date().getFullYear()} Budget Tracker · Made with React + Supabase
      </footer>
    </div>
  )
}
