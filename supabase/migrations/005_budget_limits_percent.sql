-- Add percent-based budget limits
ALTER TABLE budget_limits
  ADD COLUMN IF NOT EXISTS limit_percent NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS limit_type TEXT NOT NULL DEFAULT 'amount';
