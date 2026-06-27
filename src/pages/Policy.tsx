import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import { useUIStore } from '@/lib/stores/ui.store'

export default function Policy() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const lang = useUIStore((state) => state.lang)
  const isPrivacy = pathname.includes('privacy')
  const title = isPrivacy
    ? (lang === 'ko' ? '개인정보 처리방침' : 'Privacy Policy')
    : (lang === 'ko' ? '이용약관' : 'Terms of Service')

  const sections = isPrivacy
    ? [
      lang === 'ko' ? 'Fintra는 거래 내역, 예산, 통화 설정처럼 서비스 제공에 필요한 정보만 저장합니다.' : 'Fintra stores only the information needed to provide the service, such as transactions, budgets, and currency settings.',
      lang === 'ko' ? '인증은 Supabase Auth를 통해 처리되며, 비밀번호는 앱에서 직접 보관하지 않습니다.' : 'Authentication is handled through Supabase Auth, and passwords are not stored directly by the app.',
      lang === 'ko' ? '영수증 분석, 환율 조회, 알림 전송 등 선택 기능을 사용할 때 필요한 범위의 데이터가 처리될 수 있습니다.' : 'Optional features such as receipt parsing, exchange rates, and notifications may process the data required for that feature.',
      lang === 'ko' ? '사용자는 설정 또는 문의를 통해 데이터 내보내기와 삭제를 요청할 수 있습니다.' : 'Users may request data export or deletion through settings or support.',
    ]
    : [
      lang === 'ko' ? 'Fintra는 개인 예산 관리를 돕는 도구이며 금융 자문이나 투자 조언을 제공하지 않습니다.' : 'Fintra is a personal budgeting tool and does not provide financial or investment advice.',
      lang === 'ko' ? '사용자는 입력한 거래와 예산 정보의 정확성을 직접 확인해야 합니다.' : 'Users are responsible for checking the accuracy of transactions and budget information they enter.',
      lang === 'ko' ? '서비스 안정성과 보안을 위해 비정상적인 사용, 자동화 남용, 타인의 계정 접근을 제한할 수 있습니다.' : 'Abnormal use, automation abuse, and unauthorized account access may be restricted for service stability and security.',
      lang === 'ko' ? '본 문서는 출시 전 기본 고지이며, 정식 배포 전 법무 검토를 거쳐 업데이트해야 합니다.' : 'This is a pre-launch notice and should be updated after legal review before production release.',
    ]

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-[#f6f5f1] px-5 py-5 text-[#141716] dark:bg-[#080a08] dark:text-white">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => navigate(-1)} className="auth-icon-button" aria-label={lang === 'ko' ? '뒤로' : 'Back'}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dceee9] text-[#0b6f61]">
          <ShieldCheck className="h-4 w-4" />
        </span>
      </header>

      <section className="pt-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b9390]">Fintra</p>
        <h1 className="mt-2 text-[2rem] font-semibold leading-tight">{title}</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#7d8582] dark:text-slate-400">
          {lang === 'ko' ? '초안 작성일: 2026년 6월 28일' : 'Draft date: June 28, 2026'}
        </p>
        <div className="mt-4 rounded-[1.35rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {lang === 'ko'
            ? '이 문서는 제품 화면 준비를 위한 임시 초안입니다. 정식 배포 전 개인정보/소비자 약관에 대한 법무 검토가 필요합니다.'
            : 'This document is draft copy for product readiness. Legal review is required before production release.'}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        {sections.map((text, index) => (
          <div key={text} className="rounded-[1.35rem] bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:bg-slate-900">
            <p className="text-xs font-bold text-[#0b6f61]">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#5f6868] dark:text-slate-300">{text}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
