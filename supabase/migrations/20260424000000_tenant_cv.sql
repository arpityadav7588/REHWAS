-- Create tenant_cv table
CREATE TABLE IF NOT EXISTS tenant_cv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  on_time_payment_pct NUMERIC DEFAULT 0 CHECK (on_time_payment_pct BETWEEN 0 AND 100),
  total_months_tracked INTEGER DEFAULT 0,
  paid_on_time_count INTEGER DEFAULT 0,
  paid_late_count INTEGER DEFAULT 0,
  unpaid_count INTEGER DEFAULT 0,
  rent_health_grade TEXT DEFAULT 'N/A' CHECK (rent_health_grade IN ('A', 'B', 'C', 'N/A')),
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tenant_cv ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public CVs are readable by all" ON tenant_cv FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Tenants read own CV" ON tenant_cv FOR SELECT USING (tenant_profile_id = auth.uid());
CREATE POLICY "Service role manages CVs" ON tenant_cv FOR ALL USING (auth.role() = 'service_role');
