# Fintra Budget Tracker

Fintra는 거래, 예산, 캘린더, 리포트, 멀티 통화를 모바일 기준으로 관리하는 개인 재정 관리 앱입니다.

앱 바로가기: https://budget-tracker-f3nf.vercel.app<br>
English README: [README.md](README.md)

## 핵심 기능

### 대시보드

- 월별 수입, 지출, 순이익을 한 화면에서 확인합니다.
- 수입은 양수, 지출은 음수, 순이익/순손실은 라벨과 부호로 명확하게 표시합니다.
- 월 예산 카드에서 사용 금액, 남은 금액, 남은 비율을 함께 보여줍니다.
- 최근 거래와 거래 추가, 영수증 스캔, 캘린더, 반복 거래 바로가기를 제공합니다.

### 거래 관리

- 수입과 지출 거래를 추가하고 수정할 수 있습니다.
- 날짜, 카테고리, 설명, 금액, 통화, 결제 수단, 메모를 기록합니다.
- 거래 목록에서 검색, 필터, 정렬, 상세 확인을 할 수 있습니다.
- 금액 입력은 화면에 3자리 콤마를 표시하면서 저장 값은 기존 숫자/raw 형식을 유지합니다.

### 캘린더

- 페이지에 진입하면 현재 날짜가 포함된 월을 기본으로 보여줍니다.
- 날짜별 지출과 수입 합계를 확인할 수 있습니다.
- 날짜를 누르면 모바일 화면 중앙에 상세 카드가 열리고, 카테고리 요약과 거래 타임라인을 볼 수 있습니다.
- 캘린더 합계는 시스템 통화 기준으로 환산되어 일관되게 표시됩니다.

### 리포트

- 월별 지출 흐름, 수입 대비 지출, 카테고리 분석, 카테고리 순위를 제공합니다.
- 연간 리포트에서 월별 수입/지출 흐름을 확인할 수 있습니다.
- 여러 통화로 기록된 거래도 시스템 통화 기준 합계로 비교할 수 있습니다.
- 모바일에서 좌우로 밀리지 않도록 리포트 헤더와 컨트롤 폭을 제한했습니다.

### 예산

- 월 전체 예산의 사용 금액, 남은 금액, 사용률, 남은 비율을 보여줍니다.
- 카테고리별 예산은 금액 기반 또는 퍼센트 기반으로 설정할 수 있습니다.
- 퍼센트 예산에서는 배정된 비율과 아직 배정되지 않은 비율/금액을 확인할 수 있습니다.
- 새 월에 예산 row가 아직 없으면 가장 최근 이전 월 예산을 기준으로 읽어올 수 있습니다.

### 멀티 통화와 시스템 통화

- 거래는 원래 입력한 통화로 저장할 수 있습니다.
- 대시보드, 캘린더, 예산, 리포트의 합계 비교는 시스템 통화 기준으로 계산됩니다.
- 환율은 기존 Supabase Edge Function 흐름을 사용하고 `exchange_rates_v1_${base}` 캐시 키를 재사용합니다.

### 인증과 법적 문서

- 인증은 Supabase Auth를 사용합니다.
- 이메일/비밀번호, Google OAuth, Apple OAuth 진입점이 로그인 화면에 준비되어 있습니다.
- Apple Sign In은 Apple Developer와 Supabase provider 설정이 필요합니다.
- Passkey/WebAuthn 기반 기기 인증은 `VITE_ENABLE_PASSKEYS` 플래그 뒤에 준비되어 있습니다.
- `/privacy`, `/terms` 경로에서 개인정보 처리방침과 이용약관 초안을 볼 수 있습니다. 현재 문구는 임시 초안이며 정식 배포 전 법무 검토가 필요합니다.

### 라이트 모드와 모바일 UX

- 앱 기본 테마는 라이트 모드입니다.
- 모바일 앱 캔버스, 하단 내비게이션, 터치 친화적인 컨트롤을 중심으로 구성되어 있습니다.
- 주요 화면은 모바일에서 가로 overflow가 생기지 않도록 조정되어 있습니다.
- Vite PWA 설정을 통해 설치형 앱 경험을 준비했습니다.

## 스크린샷

스크린샷 파일은 `docs/screenshots/`에 두는 것을 기준으로 합니다.

권장 파일명:

- `docs/screenshots/01-dashboard-mobile.png`
- `docs/screenshots/02-transactions-mobile.png`
- `docs/screenshots/03-calendar-mobile.png`
- `docs/screenshots/04-reports-mobile.png`
- `docs/screenshots/05-budget-mobile.png`
- `docs/screenshots/06-settings-mobile.png`

현재 상태: 스크린샷 폴더 구조만 준비되어 있으며 실제 이미지 파일은 아직 추가되지 않았습니다.

## 영상 데모

추후 짧은 제품 데모 영상을 이 섹션에 추가할 수 있습니다.

권장 파일 또는 링크:

- `docs/demo/fintra-mobile-demo.mp4`
- 배포된 데모 영상 URL
- README에서 바로 볼 수 있는 짧은 GIF

권장 흐름:

1. 대시보드에서 월별 합계를 확인합니다.
2. 콤마가 적용된 금액 입력으로 거래를 추가합니다.
3. 같은 월을 캘린더에서 확인합니다.
4. 리포트에서 시스템 통화 기준 합계를 확인합니다.
5. 예산 화면에서 남은 금액과 남은 비율을 확인합니다.

## 기술 스택

- React 19
- TypeScript
- Vite 8
- Supabase Auth, Database, Edge Functions, Storage
- TanStack Query
- Zustand
- Tailwind CSS 4
- Recharts
- Vite PWA
- Vitest

## 시작하기

### 요구사항

- 현재 Vite/React 도구 체인과 호환되는 Node.js
- npm
- Supabase 프로젝트

### 설치

```bash
npm install
```

### 환경 변수

예시 파일을 복사해 로컬 env 파일을 만듭니다.

```bash
cp .env.example .env.local
```

필수:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

선택:

```bash
VITE_ENABLE_PASSKEYS=false
EXCHANGERATES_API_KEY=your_exchangerates_api_key
```

참고:

- `VITE_ENABLE_PASSKEYS=true`는 Supabase Passkeys/WebAuthn 설정을 완료하고 테스트한 뒤 사용하세요.
- Apple Sign In provider secret은 프론트엔드 env가 아니라 Apple Developer와 Supabase provider 설정에 넣어야 합니다.
- 환율 조회는 Supabase Edge Function에서 처리합니다.

## 개발

개발 서버 실행:

```bash
npm run dev
```

테스트 실행:

```bash
npm test
```

린트 실행:

```bash
npm run lint
```

프로덕션 빌드:

```bash
npm run build
```

빌드 결과 미리보기:

```bash
npm run preview
```

## 인증 설정

Apple Sign In, Passkeys/WebAuthn, redirect URL, provider 설정은 [docs/auth-setup.md](docs/auth-setup.md)를 참고하세요.

## 프로젝트 구조

```text
src/
  components/      공통 UI와 기능 컴포넌트
  lib/             Supabase client, hooks, stores, utilities
  pages/           라우트 단위 화면
  types/           앱 및 데이터베이스 타입
  utils/           포맷팅 헬퍼
supabase/
  functions/       Edge Functions
  migrations/      데이터베이스 마이그레이션
docs/
  auth-setup.md    인증 provider 설정 체크리스트
  screenshots/     README 스크린샷 파일
```

## 라이선스

MIT
