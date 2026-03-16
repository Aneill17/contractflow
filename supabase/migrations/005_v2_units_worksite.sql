-- Migration 005: V2 — Units table + work site fields on contracts

-- Add work site + benchmark fields to contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS work_site_address TEXT,
  ADD COLUMN IF NOT EXISTS work_site_lat DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS work_site_lng DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS current_housing_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS current_housing_location TEXT;

-- Units table: ERS-managed properties
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT,
  province TEXT DEFAULT 'BC',
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  monthly_cost DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  bedrooms INT DEFAULT 1,
  status TEXT DEFAULT 'vacant', -- vacant, occupied, maintenance, reserved
  landlord_name TEXT,
  landlord_email TEXT,
  landlord_phone TEXT,
  lease_start DATE,
  lease_end DATE,
  damage_deposit DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract-unit assignments (supports multi-unit contracts)
CREATE TABLE IF NOT EXISTS contract_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  unit_address TEXT, -- denormalized for display even if unit deleted
  occupant_name TEXT,
  monthly_cost DECIMAL(10,2),
  move_in DATE,
  move_out DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for units (owner/staff read, service_role write)
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_units" ON units FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_write_units" ON units FOR ALL TO service_role USING (true);

CREATE POLICY "auth_read_contract_units" ON contract_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_write_contract_units" ON contract_units FOR ALL TO service_role USING (true);
