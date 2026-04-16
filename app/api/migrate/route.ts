import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// One-shot migration endpoint — protected by secret token
// Run via: POST /api/migrate  { "secret": "ers-migrate-2024" }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (body.secret !== 'ers-migrate-2024') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const migrations = [
    `ALTER TABLE units ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE`,
    `ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_ssid TEXT`,
    `ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_password TEXT`,
    `ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_name TEXT`,
    `ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_contact TEXT`,
    `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','active','completed'))`,
    `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_account_id UUID`,
    `CREATE TABLE IF NOT EXISTS unit_photos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unit_id UUID REFERENCES units(id) ON DELETE CASCADE, url TEXT NOT NULL, is_primary BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS unit_leases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unit_id UUID REFERENCES units(id) ON DELETE CASCADE, type TEXT CHECK (type IN ('landlord','client')), file_url TEXT, lease_start DATE, lease_end DATE, terms TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS client_accounts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, company_name TEXT, contact_name TEXT, contact_email TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS quote_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id UUID REFERENCES client_accounts(id) ON DELETE CASCADE, units_needed INTEGER, location TEXT, start_date DATE, duration_months INTEGER, notes TEXT, status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','converted')), created_at TIMESTAMPTZ DEFAULT NOW())`,
    `ALTER TABLE unit_photos ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE unit_leases ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_photos' AND policyname='auth_read_unit_photos') THEN CREATE POLICY auth_read_unit_photos ON unit_photos FOR SELECT TO authenticated USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_photos' AND policyname='service_all_unit_photos') THEN CREATE POLICY service_all_unit_photos ON unit_photos FOR ALL TO service_role USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_leases' AND policyname='auth_read_unit_leases') THEN CREATE POLICY auth_read_unit_leases ON unit_leases FOR SELECT TO authenticated USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_leases' AND policyname='service_all_unit_leases') THEN CREATE POLICY service_all_unit_leases ON unit_leases FOR ALL TO service_role USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_accounts' AND policyname='auth_read_client_accounts') THEN CREATE POLICY auth_read_client_accounts ON client_accounts FOR SELECT TO authenticated USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_accounts' AND policyname='service_all_client_accounts') THEN CREATE POLICY service_all_client_accounts ON client_accounts FOR ALL TO service_role USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_accounts' AND policyname='client_own_account') THEN CREATE POLICY client_own_account ON client_accounts FOR SELECT TO authenticated USING (user_id = auth.uid()); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='auth_read_quotes') THEN CREATE POLICY auth_read_quotes ON quote_requests FOR SELECT TO authenticated USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='service_all_quotes') THEN CREATE POLICY service_all_quotes ON quote_requests FOR ALL TO service_role USING (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='client_insert_quotes') THEN CREATE POLICY client_insert_quotes ON quote_requests FOR INSERT TO authenticated WITH CHECK (client_id IN (SELECT id FROM client_accounts WHERE user_id = auth.uid())); END IF; END $$`,
  ]

  const results: { step: number; sql: string; ok: boolean; error?: string }[] = []

  for (let i = 0; i < migrations.length; i++) {
    const sql = migrations[i]
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })
      // exec_sql may not exist; fall through and we'll document the SQL
      const text = await res.text()
      const ok = res.status < 400 || text.includes('already exists') || text.includes('duplicate')
      results.push({ step: i + 1, sql: sql.slice(0, 80), ok, error: ok ? undefined : text.slice(0, 200) })
    } catch (e: unknown) {
      results.push({ step: i + 1, sql: sql.slice(0, 80), ok: false, error: String(e) })
    }
  }

  return NextResponse.json({
    results,
    note: 'If any steps failed, run the SQL manually in Supabase Dashboard → SQL Editor. See /api/migrate?secret=ers-migrate-2024 for the full SQL.',
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== 'ers-migrate-2024') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Return the full migration SQL for manual execution
  const sql = `
-- ContractFlow Phase 2/3 Migration
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE units ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_ssid TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_contact TEXT;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','active','completed'));
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_account_id UUID;

CREATE TABLE IF NOT EXISTS unit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('landlord','client')),
  file_url TEXT,
  lease_start DATE,
  lease_end DATE,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_accounts(id) ON DELETE CASCADE,
  units_needed INTEGER,
  location TEXT,
  start_date DATE,
  duration_months INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','converted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE unit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_read_unit_photos ON unit_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY service_all_unit_photos ON unit_photos FOR ALL TO service_role USING (true);
CREATE POLICY auth_read_unit_leases ON unit_leases FOR SELECT TO authenticated USING (true);
CREATE POLICY service_all_unit_leases ON unit_leases FOR ALL TO service_role USING (true);
CREATE POLICY auth_read_client_accounts ON client_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY service_all_client_accounts ON client_accounts FOR ALL TO service_role USING (true);
CREATE POLICY client_own_account ON client_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY auth_read_quotes ON quote_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY service_all_quotes ON quote_requests FOR ALL TO service_role USING (true);
CREATE POLICY client_insert_quotes ON quote_requests FOR INSERT TO authenticated WITH CHECK (client_id IN (SELECT id FROM client_accounts WHERE user_id = auth.uid()));

-- Create storage buckets (run via Supabase dashboard or Storage tab)
-- Bucket: unit-photos (public)
-- Bucket: unit-leases (private)
  `.trim()

  return new NextResponse(sql, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
