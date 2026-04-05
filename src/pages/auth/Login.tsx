import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, Languages } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { useT } from '@/lib/hooks/useT'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type Mode = 'signin' | 'signup' | 'forgot'

export default function Login() {
  const { user, loading } = useAuthStore()
  const { lang, setLang } = useUIStore()
  const t = useT()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<Mode>(() => searchParams.get('signup') === 'true' ? 'signup' : 'signin')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <LoadingSpinner fullScreen />
  if (user) return <Navigate to="/dashboard" replace />

  function getAuthErrorMessage(err: unknown): string {
    if (!(err instanceof Error)) return t('login_error')
    const msg = err.message.toLowerCase()
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) return t('login_error_credentials')
    if (msg.includes('email not confirmed')) return t('login_error_email_not_confirmed')
    if (msg.includes('user already registered')) return t('login_error_already_registered')
    if (msg.includes('password should be at least')) return t('login_error_weak_password')
    return t('login_error')
  }

  async function handleGoogle() {
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      console.error('Google OAuth error:', error)
      toast.error(t('login_error'))
      setSubmitting(false)
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success(t('login_success_signup'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      console.error('Email auth error:', err)
      toast.error(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      toast.success(t('login_forgot_success'))
      setMode('signin')
    } catch (err) {
      console.error('Password reset error:', err)
      toast.error(t('login_error'))
    } finally {
      setSubmitting(false)
    }
  }

  const heroItems = lang === 'ko'
    ? ['카테고리별 지출 분석', 'AI 영수증 자동 인식', '반복 지출 자동 기록', '실시간 멀티 기기 동기화']
    : ['Category expense analytics', 'AI receipt auto-scan', 'Auto-log recurring expenses', 'Real-time multi-device sync']

  return (
    <div className="flex min-h-svh bg-white dark:bg-slate-950">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-10 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <img src="/icons/logo512.png" alt="Budget Tracker" className="h-10 w-10 rounded-xl object-cover" />
          <span className="text-lg font-bold text-white">Budget Tracker</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white leading-tight whitespace-pre-line">
            {t('login_hero_title')}
          </h2>
          <p className="mt-4 text-indigo-200 text-sm leading-relaxed max-w-sm">
            {t('login_hero_desc')}
          </p>

          <div className="mt-8 space-y-3">
            {heroItems.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-white/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-indigo-300">
          © {new Date().getFullYear()} Budget Tracker
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Top bar */}
        <div className="mb-8 w-full max-w-sm flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('login_back')}
          </Link>
          <button
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === 'ko' ? 'English' : '한국어'}
          </button>
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden text-center">
            <img src="/icons/logo512.png" alt="Budget Tracker" className="mx-auto mb-3 h-14 w-14 rounded-2xl object-cover shadow-lg" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Budget Tracker</h1>
          </div>

          {/* ── Forgot password mode ── */}
          {mode === 'forgot' ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('login_forgot_title')}</h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{t('login_forgot_subtitle')}</p>

              <form onSubmit={handleForgot} className="mt-6 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('login_email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex w-full items-center justify-center gap-2 py-3"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : null}
                  {t('login_forgot_submit')}
                </button>
              </form>

              <p className="mt-5 text-center text-sm">
                <button
                  onClick={() => setMode('signin')}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  ← {t('login_forgot_back')}
                </button>
              </p>
            </>
          ) : (
            /* ── Sign in / Sign up mode ── */
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {mode === 'signup' ? t('login_title_signup') : t('login_title_signin')}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {mode === 'signup' ? t('login_subtitle_signup') : t('login_subtitle_signin')}
              </p>

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] transition disabled:opacity-60"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {mode === 'signup' ? t('login_google_signup') : t('login_google_signin')}
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-slate-950 px-3 text-xs text-slate-400">{t('login_or')}</span>
                </div>
              </div>

              {/* Email / Password */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t('login_email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {t('login_password')}
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        {t('login_forgot')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login_password_hint')}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-11 text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex w-full items-center justify-center gap-2 py-3"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : null}
                  {mode === 'signup' ? t('login_submit_signup') : t('login_submit_signin')}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                {mode === 'signup' ? t('login_has_account') : t('login_no_account')}{' '}
                <button
                  onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  {mode === 'signup' ? t('login_go_signin') : t('login_go_signup')}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
