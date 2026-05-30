CREATE TABLE IF NOT EXISTS franchise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  city TEXT NOT NULL,
  current_business TEXT,
  investment_budget TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
