# Budget Auto Distribution Recommendation Design

Status: product and technical design only. Do not implement from this document without a separate implementation task.

## Goal

Give the user a recommended category budget split based on past spending, then let them preview, edit, and apply it. The first version should work without AI and should avoid sending sensitive transaction data to any model provider.

## Current Baseline

The app already has a simple auto-distribution action in `SettingsBudget.tsx`:

- Requires a monthly budget.
- Reads the last 6 months of expense transactions.
- Converts spending into the monthly budget currency.
- Calculates each category's share of total historical spending.
- Writes category budget percentages directly through `setGoal`.

This is useful, but it has product gaps:

- It applies immediately instead of showing a preview.
- It only uses total 6-month share, not 3-month trend or fixed/variable behavior.
- It does not account for savings goals.
- It does not explain why a category received a recommendation.
- It can overweight one-off purchases.

## MVP Without AI

### Inputs

Required:

- Target month: selected month in the Budget screen.
- Monthly budget amount and currency.
- Existing categories.
- Expense transactions from recent months.
- Exchange rates from the existing `useExchangeRates` flow.

Optional:

- Lookback window: 3 months or 6 months.
- Savings goal: percent or amount reserved before distributing spendable budget.
- Category type override: fixed, variable, savings, ignore.

### Output

A draft recommendation, not immediately saved:

```ts
type BudgetRecommendation = {
  targetMonth: string
  budgetCurrency: string
  monthlyBudgetAmount: number
  savingsGoalAmount: number
  spendableAmount: number
  lookbackMonths: 3 | 6
  categories: BudgetRecommendationCategory[]
  summary: {
    assignedAmount: number
    unassignedAmount: number
    assignedPercent: number
    confidence: 'low' | 'medium' | 'high'
  }
}

type BudgetRecommendationCategory = {
  categoryId: string
  categoryName: string
  kind: 'fixed' | 'variable' | 'savings' | 'uncategorized'
  recommendedAmount: number
  recommendedPercent: number
  recent3MonthAverage: number
  recent6MonthAverage: number
  fixedEstimate: number | null
  confidence: 'low' | 'medium' | 'high'
  reason: string
  userEdited?: boolean
}
```

## Screen Flow

### Entry Point

Budget screen:

- Button label: `추천 예산 만들기` / `Create recommended budget`
- Secondary text: `최근 지출과 고정비를 기준으로 미리보기 생성`

### Recommendation Setup Sheet

Before generating:

- Select lookback:
  - Recent 3 months: reacts faster to current habits.
  - Recent 6 months: smoother, less sensitive to one-off spending.
- Set savings goal:
  - None
  - Percent of monthly budget, for example 10%
  - Fixed amount
- Include/exclude categories:
  - Default: include active expense categories.
  - Optional: ignore categories with no recent spending.

### Preview Screen

Show a draft before saving:

- Top summary:
  - Monthly budget
  - Savings reserved
  - Spendable amount
  - Assigned amount
  - Unassigned amount
- Category rows:
  - Recommended amount
  - Recommended percent
  - 3-month average
  - 6-month average
  - Fixed/variable label
  - Reason text
- Controls:
  - Edit amount
  - Edit percent
  - Lock category
  - Reset category to recommendation
  - Apply all
  - Cancel

### Apply Behavior

Only when the user taps Apply:

- Convert edited draft rows into existing `BudgetGoal` records.
- Save through existing `setGoal`.
- Keep monthly budget unchanged unless the user explicitly edits it.
- Toast success after all rows save.

## Recommendation Algorithm

### 1. Fetch History

For target month `YYYY-MM`:

- 3-month window: previous 3 complete months before target month.
- 6-month window: previous 6 complete months before target month.
- Exclude current target month by default so an in-progress month does not distort recommendations.
- Fetch only expenses:
  - `category_id`
  - `amount`
  - `currency`
  - `date`
  - optionally `description` only for local fixed-cost detection, not for AI.

All amounts should be converted to the monthly budget currency using existing exchange-rate utilities.

### 2. Build Category Stats

For each category:

- Monthly totals for each month in the window.
- 3-month average.
- 6-month average.
- Median monthly spend.
- Count of months with spending.
- Standard deviation or simple variability score.
- Latest month spend.

Suggested stats shape:

```ts
type CategorySpendStats = {
  categoryId: string
  monthlyTotals: Record<string, number>
  avg3: number
  avg6: number
  median6: number
  activeMonths3: number
  activeMonths6: number
  variability: number
}
```

### 3. Detect Fixed Costs

Without AI, use simple rules:

Fixed cost candidate if:

- Spending appears in at least 4 of the last 6 months, or at least 2 of the last 3 months.
- Variability is low, for example monthly total is within +/- 20% of the median.
- Category is known to be fixed by user override or common categories such as rent, subscription, insurance, phone, internet.

Fixed cost recommendation:

- Use median of the last 6 months if 6-month confidence is high.
- Use 3-month average if recent trend is materially higher than 6-month median.
- Mark confidence based on active month count and variability.

### 4. Estimate Variable Costs

Variable categories should use a blended average:

```text
base = (recent3MonthAverage * 0.6) + (recent6MonthAverage * 0.4)
```

Adjustments:

- If 3-month average is more than 30% above 6-month average, flag as rising trend.
- If 3-month average is more than 30% below 6-month average, flag as falling trend.
- Cap one-off spikes by comparing to median. A practical MVP cap is:
  - `base = min(base, median6 * 1.5)` when median exists.

### 5. Apply Savings Goal

Savings goal is reserved first:

```text
spendableAmount = monthlyBudgetAmount - savingsGoalAmount
```

If savings goal is a category:

- Create or use a savings category row.
- Mark it as `kind: 'savings'`.
- Do not include savings in expense-history weighting.

If no savings category exists:

- Show savings as reserved/unassigned amount in the preview.
- Do not write a category budget until the user chooses a category.

### 6. Normalize To Budget

Calculate raw recommendations:

```text
rawTotal = sum(categoryRawRecommendation)
scale = spendableAmount / rawTotal
recommendedAmount = rawRecommendation * scale
recommendedPercent = recommendedAmount / monthlyBudgetAmount * 100
```

Rules:

- Never assign negative amounts.
- Round amounts to currency-friendly increments:
  - KRW/JPY: whole units, optionally nearest 100 or 1,000 for UI.
  - CAD/USD/EUR/GBP: 2 decimals, but UI may round to whole dollars for budget readability.
- Final row absorbs rounding drift so total equals spendable amount.
- If rawTotal is zero, show an empty-state preview instead of applying.

### 7. Confidence And Reasons

Confidence examples:

- High: active in most months and low variability.
- Medium: enough history but variable.
- Low: sparse history, new category, or high volatility.

Reason examples:

- `지난 6개월 대부분 매달 비슷하게 지출되어 고정비로 분류했어요.`
- `최근 3개월 평균이 6개월 평균보다 높아 최근 흐름을 더 반영했어요.`
- `지출 기록이 적어 낮은 신뢰도로 추천했어요.`

## Data Structure And Storage

Do not add a persisted recommendation table for MVP unless needed. Generate draft state in memory:

- `recommendationDraft`
- `editedRows`
- `lockedCategoryIds`
- `savingsGoal`
- `lookbackMonths`

Persist only after Apply:

- Existing `budget_limits` rows through `setGoal`.
- Existing `monthly_budgets` row only if the user explicitly changes the monthly budget.

Optional future table:

```sql
budget_recommendation_events (
  id uuid primary key,
  user_id uuid not null,
  target_month text not null,
  lookback_months int not null,
  created_at timestamptz not null,
  applied_at timestamptz,
  metadata jsonb
)
```

If added, keep metadata aggregated only. Do not store raw transaction descriptions.

## AI Option Later

AI should be optional and should not be needed for MVP.

### Safe Data To Send

Only send aggregated, minimized data:

- Category names or stable category labels.
- Monthly totals by category.
- 3-month average.
- 6-month average.
- Variability score.
- Current monthly budget amount.
- User-selected savings goal.
- Currency code.

Example payload:

```json
{
  "currency": "CAD",
  "monthlyBudget": 3000,
  "savingsGoal": 300,
  "categories": [
    {
      "name": "Groceries",
      "avg3": 520,
      "avg6": 480,
      "median6": 500,
      "activeMonths6": 6,
      "variability": 0.18
    }
  ]
}
```

### Data Not To Send

Avoid:

- User email, name, auth ID.
- Full transaction descriptions.
- Store names.
- Receipt images.
- Exact timestamps.
- Payment methods, card details, bank names.
- Free-form memo text.

### AI Role

AI can help with:

- Explaining why a distribution makes sense.
- Suggesting category type labels.
- Flagging unusual changes.
- Producing a user-friendly summary.

AI should not directly save budgets. The user must preview and apply.

## Risk Areas

### Bad Recommendations From Sparse Data

Risk:

- New users or users with only one month of data get misleading recommendations.

Mitigation:

- Require a minimum data threshold.
- Show low-confidence labels.
- Offer a simple equal split or manual setup fallback.

### One-Off Large Purchases

Risk:

- Travel, furniture, medical, or annual fees can distort averages.

Mitigation:

- Use median and spike caps.
- Allow category exclusion in preview.
- Flag high-volatility categories.

### Fixed Cost Misclassification

Risk:

- A category may look fixed but actually varies.

Mitigation:

- Let users override fixed/variable labels.
- Persist category type preferences later if useful.

### Multi-Currency Drift

Risk:

- Historical rates are not necessarily the same as current rates.

MVP approach:

- Use the same current exchange-rate flow as the rest of the app for consistency.

Future:

- Store historical conversion snapshots if accuracy matters.

### User Trust

Risk:

- Applying recommendations without explanation feels opaque.

Mitigation:

- Always show preview.
- Always show reasons and confidence.
- Never auto-save without user confirmation.

## Suggested Implementation Phases

### Phase 1: Local Rule-Based Preview

- Extract current `applyAutoDistribution` into a pure recommendation utility.
- Add tests for 3-month, 6-month, fixed-cost, variable-cost, and savings-goal cases.
- Add a preview sheet with editable rows.
- Apply only after confirmation.

### Phase 2: User Controls

- Add lookback selector.
- Add savings goal input.
- Add lock/exclude category controls.
- Add reason and confidence labels.

### Phase 3: Refinement

- Remember user category type overrides.
- Add volatility/spike warnings.
- Add better empty states for low data.

### Phase 4: Optional AI Summary

- Send aggregated category stats only.
- Ask AI for explanation and suggested labels, not raw budget writes.
- Keep all saving user-confirmed.

## MVP Acceptance Criteria

- User can generate a budget recommendation without AI.
- User can preview every recommended category budget before saving.
- User can edit recommended amounts or percentages.
- Recommendation considers 3-month and 6-month averages.
- Fixed-cost-like categories are labeled and treated differently from variable categories.
- Savings goal can reserve part of the monthly budget.
- Applying writes through existing budget hooks.
- Tests cover the calculation utility.
