-- recurring_items에 currency 컬럼 추가
ALTER TABLE recurring_items
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD';
