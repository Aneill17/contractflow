-- Migration 006: Ground Team, Tasks, Contractors

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'ground_team',
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  type TEXT DEFAULT 'individual',
  status TEXT DEFAULT 'active',
  specialty TEXT,
  notes TEXT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  direction TEXT DEFAULT 'outbound',
  channel TEXT DEFAULT 'email',
  subject TEXT,
  body TEXT NOT NULL,
  sent_by TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_staff" ON staff FOR ALL TO authenticated USING (true);
CREATE POLICY "service_staff" ON staff FOR ALL TO service_role USING (true);
CREATE POLICY "auth_tasks" ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "service_tasks" ON tasks FOR ALL TO service_role USING (true);
CREATE POLICY "auth_contractors" ON contractors FOR ALL TO authenticated USING (true);
CREATE POLICY "service_contractors" ON contractors FOR ALL TO service_role USING (true);
CREATE POLICY "auth_contractor_messages" ON contractor_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "service_contractor_messages" ON contractor_messages FOR ALL TO service_role USING (true);
