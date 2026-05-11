-- Add currency to category budget limits
ALTER TABLE budget_limits
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD';

-- Monthly budgets (overall)
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_budgets_select" ON monthly_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monthly_budgets_insert" ON monthly_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_budgets_update" ON monthly_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "monthly_budgets_delete" ON monthly_budgets FOR DELETE USING (auth.uid() = user_id);
