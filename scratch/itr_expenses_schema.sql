-- REHWAS ITR & EXPENSES SCHEMA
-- Purpose: Tracks landlord expenses for ITR Schedule HP calculation.

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  category TEXT NOT NULL
    CHECK (category IN ('maintenance', 'tax', 'insurance', 'repair', 'loan_interest', 'other')),
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Landlords CRUD own expenses" ON expenses;

-- Policies
CREATE POLICY "Landlords CRUD own expenses" 
  ON expenses FOR ALL 
  USING (landlord_id = auth.uid());
