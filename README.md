# Fintra Budget Tracker

Fintra is a mobile-first personal finance app for tracking transactions, budgets, calendar activity, and reports across multiple currencies.

Live app: https://budget-tracker-f3nf.vercel.app<br>
Korean README: [README.ko.md](README.ko.md)

## Core Features

### Dashboard

- Monthly overview for income, expenses, and net result.
- Clear signed totals: income is shown as positive, expenses as negative, and net is labeled as surplus or deficit.
- Monthly budget card with spent amount, remaining amount, and remaining percentage.
- Recent transactions and quick actions for adding transactions, scanning receipts, calendar, and recurring items.

### Transaction Management

- Add and edit income or expense transactions.
- Track date, category, description, amount, currency, payment method, and memo.
- Search, filter, sort, and inspect transaction details from the transaction list.
- Amount inputs use comma formatting while preserving raw numeric values for saving.

### Calendar

- Month view defaults to the current month when entering the page.
- Each day can show spending and income totals.
- Tapping a date opens a centered mobile-friendly detail card with category summary and transaction timeline.
- Calendar totals use the configured system currency for consistent comparison.

### Reports

- Monthly report with spending trend, income vs. expense comparison, category breakdown, and ranking.
- Annual report with month-by-month totals.
- Multi-currency totals can be converted into the system currency for comparable income, expense, and net values.
- Report layout is constrained for mobile so controls and settings actions stay inside the viewport.

### Budgets

- Monthly budget with spent amount, remaining amount, used percentage, and remaining percentage.
- Category budgets support amount-based and percentage-based limits.
- Percentage budgets show assigned percentage and unassigned remaining percentage/amount.
- If a new month does not have a saved budget row yet, the app can read the most recent previous budget as the active reference.

### Multi-Currency And System Currency

- Transactions can be stored with their original currency.
- System currency is used for dashboard, calendar, budget, and total-report comparisons.
- Exchange rates are fetched through the existing Supabase edge function flow and cached with `exchange_rates_v1_${base}`.

### Authentication And Legal Pages

- Supabase Auth is used for email/password and OAuth.
- Google OAuth and Apple OAuth entry points are available in the login screen.
- Apple Sign In still requires external Apple Developer and Supabase provider configuration.
- Passkey/WebAuthn support is prepared behind `VITE_ENABLE_PASSKEYS`.
- Privacy Policy and Terms routes are available at `/privacy` and `/terms`; both currently contain draft copy that requires legal review before production use.

### Mobile UX And Theme

- Default theme is light mode.
- The app uses a mobile-first layout with a constrained app canvas, bottom navigation, and touch-friendly controls.
- Key screens are tuned to avoid horizontal overflow on mobile.
- PWA install support is configured through Vite PWA.

## Screenshots

Screenshot assets should live in `docs/screenshots/`.

Suggested file names:

- `docs/screenshots/01-dashboard-mobile.png`
- `docs/screenshots/02-transactions-mobile.png`
- `docs/screenshots/03-calendar-mobile.png`
- `docs/screenshots/04-reports-mobile.png`
- `docs/screenshots/05-budget-mobile.png`
- `docs/screenshots/06-settings-mobile.png`

Current status: screenshot placeholders are prepared, but actual screenshot images have not been added yet.

## Video Demo

Add a short product walkthrough here when available.

Suggested files or links:

- `docs/demo/fintra-mobile-demo.mp4`
- Deployed demo video URL
- Short GIF preview for README rendering

Suggested flow:

1. Open dashboard and review monthly totals.
2. Add a transaction with formatted amount input.
3. Check the same month in Calendar.
4. Review Reports with system-currency totals.
5. Inspect Budget remaining amount and percentage.

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Supabase Auth, Database, Edge Functions, and Storage
- TanStack Query
- Zustand
- Tailwind CSS 4
- Recharts
- Vite PWA
- Vitest

## Getting Started

### Requirements

- Node.js compatible with the current Vite and React toolchain
- npm
- Supabase project

### Install

```bash
npm install
```

### Environment Variables

Create a local env file from the example:

```bash
cp .env.example .env.local
```

Required:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional:

```bash
VITE_ENABLE_PASSKEYS=false
EXCHANGERATES_API_KEY=your_exchangerates_api_key
```

Notes:

- `VITE_ENABLE_PASSKEYS=true` should only be used after Supabase Passkeys/WebAuthn support is enabled and tested.
- Apple Sign In provider secrets belong in Apple Developer and Supabase provider settings, not in frontend env files.
- Exchange rate fetching is handled by the Supabase edge function.

## Development

Start the dev server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Auth Setup

See [docs/auth-setup.md](docs/auth-setup.md) for Apple Sign In, Passkeys/WebAuthn, redirect URLs, and provider setup notes.

## Project Structure

```text
src/
  components/      Shared UI and feature components
  lib/             Supabase client, hooks, stores, utilities
  pages/           Route-level screens
  types/           App and database types
  utils/           Formatting helpers
supabase/
  functions/       Edge functions
  migrations/      Database migrations
docs/
  auth-setup.md    Auth provider setup checklist
  screenshots/     README screenshot assets
```

## License

MIT
