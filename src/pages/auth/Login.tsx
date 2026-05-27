import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Check, Eye, EyeOff, Fingerprint, Languages, Mail, Moon, ShieldCheck, Sun } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { useT } from '@/lib/hooks/useT'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type Mode = 'signin' | 'signup' | 'forgot' | 'verify'

export default function Login() {
  const { user, loading } = useAuthStore()
  const { lang, setLang, isDark, toggleDark } = useUIStore()
  const t = useT()
  const [searchParams] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(29)
  const [otpVerified, setOtpVerified] = useState(false)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])
  const [mode, setMode] = useState<Mode>(() => {
    if (searchParams.get('verify') === 'true') return 'verify'
    return searchParams.get('signup') === 'true' ? 'signup' : 'signin'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (mode !== 'verify' || otpVerified || resendTimer <= 0) return undefined
    const timer = window.setTimeout(() => setResendTimer((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [mode, otpVerified, resendTimer])

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

  async function handleApple() {
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      console.error('Apple OAuth error:', error)
      toast.error(t('login_error'))
      setSubmitting(false)
    }
  }

  function handleBiometric() {
    toast.message(lang === 'ko' ? '기기 인증은 로그인 후 사용할 수 있어요' : 'Biometric unlock is available after sign in')
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          toast.error(lang === 'ko' ? '이름을 입력해주세요' : 'Please enter your name')
          return
        }
        if (password !== confirmPassword) {
          toast.error(lang === 'ko' ? '비밀번호가 일치하지 않아요' : 'Passwords do not match')
          return
        }
        if (!agreeTerms) {
          toast.error(lang === 'ko' ? '약관 동의가 필요해요' : 'Please agree to the terms')
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() },
          },
        })
        if (error) throw error
        toast.success(t('login_success_signup'))
        setMode('verify')
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

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = digit
    setOtp(nextOtp)
    setOtpVerified(false)

    if (digit && index < nextOtp.length - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const nextOtp = [...otp]
    pasted.split('').forEach((digit, index) => {
      nextOtp[index] = digit
    })
    setOtp(nextOtp)
    setOtpVerified(false)
    otpRefs.current[Math.min(pasted.length, 6) - 1]?.focus()
  }

  function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (otp.join('').length !== 6) {
      toast.error(lang === 'ko' ? '6자리 인증번호를 입력해주세요' : 'Enter the 6-digit code')
      return
    }

    setOtpVerified(true)
    toast.success(lang === 'ko' ? '인증이 완료되었어요' : 'Verification complete')
  }

  function handleResendCode() {
    setOtp(['', '', '', '', '', ''])
    setOtpVerified(false)
    setResendTimer(29)
    otpRefs.current[0]?.focus()
    toast.success(lang === 'ko' ? '인증번호를 다시 보냈어요' : 'Verification code resent')
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
      setRecoverySent(true)
    } catch (err) {
      console.error('Password reset error:', err)
      toast.error(t('login_error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh justify-center bg-[linear-gradient(180deg,#eeeae2_0%,#f6f5f1_100%)] px-0 text-[var(--color-text-primary)] dark:bg-[linear-gradient(180deg,#080a08_0%,#0a0c0a_100%)] md:px-4 md:py-4">
      <main className="auth-phone relative flex min-h-svh w-full max-w-[430px] flex-col overflow-x-hidden overflow-y-auto md:min-h-[calc(100svh-2rem)] md:rounded-[2.7rem] md:border md:border-white/70 md:shadow-[0_34px_100px_rgba(20,23,22,0.16)] dark:md:border-slate-700/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,#f2e4d4_0%,rgba(251,251,250,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(14,10,6,0.9)_0%,rgba(17,20,16,0)_100%)]" />
        <div className="pointer-events-none absolute right-[-4rem] top-20 h-40 w-40 rounded-full bg-[#dceee9]/70 blur-3xl dark:bg-[#006b5b]/10" />
        <div className="relative flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Link
            to="/"
            className="auth-icon-button"
            aria-label={t('login_back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="auth-icon-button"
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="auth-icon-button gap-1.5 px-3 text-xs font-bold"
            >
              <Languages className="h-4 w-4" />
              {lang === 'ko' ? 'English' : '한국어'}
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 grid-cols-2 overflow-hidden rounded-[1.25rem] shadow-[var(--fintra-shadow-soft)]">
              <span className="bg-[#006b5b]" />
              <span className="bg-[#c9ddd2]" />
              <span className="bg-[#eee5d8]" />
              <span className="bg-[#8aa79a]" />
            </div>
            <h1 className="font-display text-[2.05rem] font-semibold leading-none text-[#141716] dark:text-white">Fintra</h1>
            <p className="mx-auto mt-3 max-w-[16.5rem] text-[13px] font-medium leading-6 text-[#7d8582] dark:text-slate-400">
              {mode === 'signup'
                ? (lang === 'ko' ? '차분한 돈 관리의 시작' : 'Start calm money management')
                : mode === 'verify'
                  ? (lang === 'ko' ? '안전하게 계정을 확인해요' : 'Securely verify your account')
                : mode === 'forgot'
                  ? (lang === 'ko' ? '계정에 다시 접근해요' : 'Recover your account calmly')
                  : (lang === 'ko' ? '오늘의 돈 흐름을 이어가요' : 'Continue your money flow')}
            </p>
            <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-[11px] font-bold text-[#006b5b] shadow-[var(--fintra-shadow-soft)] dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {lang === 'ko' ? '은행 수준의 안전한 인증' : 'Bank-grade secure access'}
            </div>
          </div>

          <div className="auth-panel p-5">
          {/* ── Forgot password mode ── */}
          {mode === 'verify' ? (
            <div className="text-center">
              <div className={`auth-icon-surface mx-auto h-16 w-16 rounded-[1.45rem] transition ${
                otpVerified ? 'bg-[#006b5b] text-white' : 'bg-[#e8f4ef] text-[#006b5b] dark:bg-[#0d2f26] dark:text-emerald-400'
              }`}>
                {otpVerified ? <Check className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
              </div>
              <h2 className="mt-5 text-[1.55rem] font-semibold leading-tight text-[#141716] dark:text-white">
                {otpVerified
                  ? (lang === 'ko' ? '확인이 완료되었어요' : 'You are verified')
                  : (lang === 'ko' ? '인증번호를 입력해주세요' : 'Enter verification code')}
              </h2>
              <p className="mx-auto mt-2 max-w-[19rem] text-sm font-medium leading-6 text-[#7d8582] dark:text-slate-400">
                {lang === 'ko'
                  ? `${email || '이메일'}로 보낸 6자리 코드를 입력하면 Fintra 계정을 안전하게 보호할 수 있어요.`
                  : `Enter the 6-digit code sent to ${email || 'your email'} to keep your Fintra account secure.`}
              </p>

              <form onSubmit={handleVerifyCode} className="mt-7">
                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onPaste={handleOtpPaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          otpRefs.current[index - 1]?.focus()
                        }
                      }}
                      aria-label={`${lang === 'ko' ? '인증번호' : 'Verification digit'} ${index + 1}`}
                      className={`h-13 rounded-[1rem] border text-center text-xl font-semibold tabular-nums text-[#141716] outline-none transition dark:text-white ${
                        otpVerified
                          ? 'border-[#006b5b]/30 bg-[#e8f4ef] dark:bg-[#0d2f26] dark:border-[#006b5b]/40'
                          : 'border-transparent bg-[#f5f6f8] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] focus:bg-white focus:ring-4 focus:ring-[#006b5b]/10 dark:bg-[#1e2620] dark:focus:bg-[#242e26]'
                      }`}
                    />
                  ))}
                </div>

                <div className={`mt-5 rounded-[1.35rem] p-3.5 text-left transition ${
                  otpVerified ? 'bg-[#e8f4ef] dark:bg-[#0d2f26]' : 'bg-[#f7f6f3] dark:bg-[#1a2220]'
                }`}>
                  <div className="flex gap-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      otpVerified ? 'bg-[#006b5b] text-white' : 'bg-white text-[#8b9390] dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <p className={`text-xs font-semibold leading-5 ${
                      otpVerified ? 'text-[#006b5b] dark:text-emerald-400' : 'text-[#7d8582] dark:text-slate-400'
                    }`}>
                      {otpVerified
                        ? (lang === 'ko' ? '계정 확인이 완료되었습니다. Fintra를 시작할 준비가 되었어요.' : 'Your account has been verified. Fintra is ready for you.')
                        : (lang === 'ko' ? '코드는 잠시 후 만료됩니다. 보안을 위해 다른 사람에게 공유하지 마세요.' : 'This code expires soon. Keep it private for your security.')}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otp.join('').length !== 6}
                  className="btn btn-primary mt-6 flex h-14 w-full items-center justify-center rounded-[1.35rem] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {otpVerified
                    ? (lang === 'ko' ? '인증 완료' : 'Verified')
                    : (lang === 'ko' ? '계정 확인하기' : 'Verify account')}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-sm">
                <span className="font-medium text-[#8b9390] dark:text-slate-500">
                  {resendTimer > 0
                    ? (lang === 'ko' ? `${resendTimer}초 후 재전송` : `Resend in ${resendTimer}s`)
                    : (lang === 'ko' ? '코드를 받지 못했나요?' : 'Didn’t receive it?')}
                </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendTimer > 0}
                  className="font-bold text-[#006b5b] transition disabled:text-[#b8bfbc] dark:text-emerald-400 dark:disabled:text-slate-600"
                >
                  {lang === 'ko' ? '다시 보내기' : 'Resend'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMode('signin')}
                className="mt-5 h-11 w-full rounded-[1.15rem] text-sm font-bold text-[#006b5b] transition active:scale-[0.98] dark:text-emerald-400"
              >
                {lang === 'ko' ? '로그인으로 돌아가기' : 'Back to sign in'}
              </button>
            </div>
          ) : mode === 'forgot' ? (
            <>
              {recoverySent ? (
                <div className="text-center">
                  <div className="auth-icon-surface mx-auto h-16 w-16 rounded-[1.45rem]">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-[1.55rem] font-semibold leading-tight text-[#141716] dark:text-white">
                    {lang === 'ko' ? '확인 메일을 보냈어요' : 'Check your email'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[19rem] text-sm font-medium leading-6 text-[#7d8582] dark:text-slate-400">
                    {lang === 'ko'
                      ? `${email || '입력한 이메일'}로 비밀번호 재설정 링크를 보냈습니다.`
                      : `We sent a secure reset link to ${email || 'your email'}.`}
                  </p>

                  <div className="mt-6 rounded-[1.5rem] border border-[#edf1ef] bg-[#fbfbfa] p-4 text-left dark:border-slate-700/50 dark:bg-slate-800/60">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f1e8] text-[#006b5b] dark:bg-[#1a2c28] dark:text-emerald-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#141716] dark:text-white">
                          {lang === 'ko' ? '인증 링크를 열어주세요' : 'Open the verification link'}
                        </p>
                        <p className="mt-1 text-xs font-medium leading-5 text-[#8b9390] dark:text-slate-400">
                          {lang === 'ko'
                            ? '메일함의 Fintra 메시지에서 링크를 누르면 새 비밀번호를 설정할 수 있어요.'
                            : 'Use the Fintra email link to set a new password safely.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="btn btn-primary mt-6 flex h-14 w-full items-center justify-center rounded-[1.35rem]"
                  >
                    {lang === 'ko' ? '로그인으로 돌아가기' : 'Back to sign in'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoverySent(false)}
                    className="mt-3 h-12 w-full rounded-[1.15rem] text-sm font-bold text-[#006b5b] transition active:scale-[0.98]"
                  >
                    {lang === 'ko' ? '다른 이메일로 다시 보내기' : 'Send to another email'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="auth-icon-surface h-12 w-12 rounded-[1.15rem] bg-[#f7f1e8] dark:bg-[#1a2c28]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-[1.55rem] font-semibold leading-tight text-[#141716] dark:text-white">
                    {t('login_forgot_title')}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#7d8582] dark:text-slate-400">{t('login_forgot_subtitle')}</p>

                  <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 rounded-[1.5rem] bg-[#f7f6f3] p-4 dark:bg-[#1a2220]">
                    {[
                      lang === 'ko' ? '이메일 입력' : 'Enter email',
                      lang === 'ko' ? '인증 링크 확인' : 'Verify link',
                      lang === 'ko' ? '새 비밀번호 설정' : 'Reset password',
                    ].map((step, index) => (
                      <div key={step} className="contents">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                          index === 0 ? 'bg-[#006b5b] text-white' : 'bg-white text-[#8b9390] dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="self-center text-xs font-semibold text-[#5f6868] dark:text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleForgot} className="mt-6 space-y-4">
                    <div>
                      <label className="auth-label">
                        {t('login_email')}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="auth-control px-4"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-[1.35rem]"
                    >
                      {submitting ? <LoadingSpinner size="sm" /> : null}
                      {lang === 'ko' ? '재설정 링크 받기' : 'Send reset link'}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-sm">
                    <button
                      onClick={() => setMode('signin')}
                      className="font-semibold text-[#006b5b] transition-colors hover:text-[#005247] dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      ← {t('login_forgot_back')}
                    </button>
                  </p>
                </>
              )}
            </>
          ) : (
            /* ── Sign in / Sign up mode ── */
            <>
              <h2 className="text-[1.55rem] font-semibold leading-tight text-[#141716] dark:text-white">
                {mode === 'signup' ? t('login_title_signup') : t('login_title_signin')}
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#7d8582] dark:text-slate-400">
                {mode === 'signup' ? t('login_subtitle_signup') : t('login_subtitle_signin')}
              </p>

              {/* Google OAuth */}
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleGoogle}
                  disabled={submitting}
                  className="auth-social-button disabled:opacity-60"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleApple}
                  disabled={submitting}
                  className="auth-social-button disabled:opacity-60"
                >
                  <span className="text-lg leading-none"></span>
                  Apple
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#edf1ef] dark:border-slate-700/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-medium text-[#9aa19e] dark:bg-[#181e19] dark:text-slate-500">{t('login_or')}</span>
                </div>
              </div>

              {/* Email / Password */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="auth-label">
                      {lang === 'ko' ? '이름' : 'Name'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'ko' ? '김핀트라' : 'Your name'}
                      required
                      autoComplete="name"
                      className="auth-control px-4"
                    />
                  </div>
                )}

                <div>
                  <label className="auth-label">
                    {t('login_email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="auth-control px-4"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold text-[#6f7775] dark:text-slate-400">
                      {t('login_password')}
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecoverySent(false)
                          setMode('forgot')
                        }}
                        className="text-xs font-semibold text-[#006b5b] transition-colors hover:text-[#005247]"
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
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      className="auth-control px-4 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa19e] transition-colors hover:text-[#141716] dark:text-slate-500 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="auth-label">
                        {lang === 'ko' ? '비밀번호 확인' : 'Confirm password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={lang === 'ko' ? '한 번 더 입력' : 'Enter it again'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          className="auth-control px-4 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa19e] transition-colors hover:text-[#141716] dark:text-slate-500 dark:hover:text-slate-200"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 rounded-[1.25rem] bg-[#f7f6f3] p-3.5 text-left dark:bg-[#1a2220]">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.45rem] border transition ${
                          agreeTerms
                            ? 'border-[#006b5b] bg-[#006b5b] text-white'
                            : 'border-[#d9dfdd] bg-white text-transparent dark:border-slate-600 dark:bg-slate-700'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[12px] font-medium leading-5 text-[#7d8582] dark:text-slate-400">
                        {lang === 'ko'
                          ? 'Fintra 이용약관과 개인정보 처리방침에 동의합니다.'
                          : 'I agree to Fintra’s terms and privacy policy.'}{' '}
                        <Link to="/terms" className="font-bold text-[#006b5b]">{lang === 'ko' ? '약관' : 'Terms'}</Link>
                        {' / '}
                        <Link to="/privacy" className="font-bold text-[#006b5b]">{lang === 'ko' ? '개인정보' : 'Privacy'}</Link>
                      </span>
                    </label>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-[1.35rem]"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : null}
                  {mode === 'signup' ? t('login_submit_signup') : t('login_submit_signin')}
                </button>
              </form>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={handleBiometric}
                  className="auth-secondary-action mt-3"
                >
                  <Fingerprint className="h-4 w-4" />
                  {lang === 'ko' ? '생체 인증으로 로그인' : 'Use biometric unlock'}
                </button>
              )}

              <p className="mt-5 text-center text-sm text-[#7d8582] dark:text-slate-400">
                {mode === 'signup' ? t('login_has_account') : t('login_no_account')}{' '}
                <button
                  onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="font-bold text-[#006b5b] transition-colors hover:text-[#005247] dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {mode === 'signup' ? t('login_go_signin') : t('login_go_signup')}
                </button>
              </p>
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  )
}
