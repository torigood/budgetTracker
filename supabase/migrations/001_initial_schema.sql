-- ============================================================
-- Budget Tracker - Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: linked to auth.users
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  currency TEXT NOT NULL DEFAULT 'CAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  icon TEXT NOT NULL DEFAULT 'tag',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, name)
);

-- receipts (before transactions so we can FK to it)
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  store_name TEXT,
  parsed_date DATE,
  parsed_amount NUMERIC(12, 2),
  parsed_items JSONB,
  raw_response TEXT,
  confidence_score NUMERIC(4, 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('지출', '수입')),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CAD',
  payment_method TEXT NOT NULL,
  memo TEXT,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- recurring_items
CREATE TABLE recurring_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  day_of_month INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- monthly_summaries (캐시용)
CREATE TABLE monthly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- budget_limits
CREATE TABLE budget_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_categories_user ON categories(user_id, sort_order);
CREATE INDEX idx_recurring_user ON recurring_items(user_id, is_active);
CREATE INDEX idx_receipts_user ON receipts(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;

-- profiles RLS
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- categories RLS
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- transactions RLS
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- recurring_items RLS
CREATE POLICY "recurring_select" ON recurring_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_insert" ON recurring_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_update" ON recurring_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_delete" ON recurring_items FOR DELETE USING (auth.uid() = user_id);

-- receipts RLS
CREATE POLICY "receipts_select" ON receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "receipts_insert" ON receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "receipts_update" ON receipts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "receipts_delete" ON receipts FOR DELETE USING (auth.uid() = user_id);

-- monthly_summaries RLS
CREATE POLICY "summaries_select" ON monthly_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "summaries_insert" ON monthly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "summaries_update" ON monthly_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "summaries_delete" ON monthly_summaries FOR DELETE USING (auth.uid() = user_id);

-- budget_limits RLS
CREATE POLICY "budgets_select" ON budget_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON budget_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON budget_limits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON budget_limits FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AUTO-CREATE DEFAULT CATEGORIES ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon, is_default, sort_order) VALUES
    (NEW.user_id, '식비',      '#ef4444', 'utensils',       TRUE, 1),
    (NEW.user_id, '생활비',    '#f97316', 'shopping-bag',   TRUE, 2),
    (NEW.user_id, '교통',      '#3b82f6', 'car',            TRUE, 3),
    (NEW.user_id, '통신비',    '#8b5cf6', 'smartphone',     TRUE, 4),
    (NEW.user_id, '주거',      '#10b981', 'home',           TRUE, 5),
    (NEW.user_id, '취미/여가', '#f59e0b', 'music',          TRUE, 6),
    (NEW.user_id, '기타',      '#6b7280', 'tag',            TRUE, 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categories();
