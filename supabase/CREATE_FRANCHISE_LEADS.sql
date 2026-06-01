CREATE TABLE IF NOT EXISTS franchise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  city TEXT NOT NULL,
  current_business TEXT,
  investment_budget TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_franchise_leads_created_at ON franchise_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_franchise_leads_status ON franchise_leads(status);
