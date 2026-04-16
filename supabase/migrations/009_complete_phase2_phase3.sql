-- Migration 009: Complete Phase 2 + Phase 3 schema
-- Run in Supabase Dashboard → SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS checks)

-- ─── 1. Extend existing units table ─────────────────────────
ALTER TABLE units ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_ssid TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_contact TEXT;

-- ─── 2. Add status column to contracts ──────────────────────
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_account_id UUID;

-- ─── 3. unit_photos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unit_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID REFERENCES units(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. unit_leases ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unit_leases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID REFERENCES units(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('landlord', 'client')),
  file_url    TEXT,
  lease_start DATE,
  lease_end   DATE,
  terms       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. client_accounts ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name  TEXT,
  contact_name  TEXT,
  contact_email TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. quote_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID REFERENCES client_accounts(id) ON DELETE CASCADE,
  units_needed     INTEGER,
  location         TEXT,
  start_date       DATE,
  duration_months  INTEGER,
  notes            TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'converted')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. RLS ─────────────────────────────────────────────────
ALTER TABLE unit_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_leases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests  ENABLE ROW LEVEL SECURITY;

-- unit_photos: authenticated users can read; service_role writes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_photos' AND policyname='auth_read_unit_photos') THEN
    CREATE POLICY auth_read_unit_photos ON unit_photos FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_photos' AND policyname='service_all_unit_photos') THEN
    CREATE POLICY service_all_unit_photos ON unit_photos FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- unit_leases
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_leases' AND policyname='auth_read_unit_leases') THEN
    CREATE POLICY auth_read_unit_leases ON unit_leases FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_leases' AND policyname='service_all_unit_leases') THEN
    CREATE POLICY service_all_unit_leases ON unit_leases FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- client_accounts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_accounts' AND policyname='auth_read_client_accounts') THEN
    CREATE POLICY auth_read_client_accounts ON client_accounts FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_accounts' AND policyname='service_all_client_accounts') THEN
    CREATE POLICY service_all_client_accounts ON client_accounts FOR ALL TO service_role USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_accounts' AND policyname='client_own_account') THEN
    CREATE POLICY client_own_account ON client_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- quote_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='auth_read_quotes') THEN
    CREATE POLICY auth_read_quotes ON quote_requests FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='service_all_quotes') THEN
    CREATE POLICY service_all_quotes ON quote_requests FOR ALL TO service_role USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='client_insert_quotes') THEN
    CREATE POLICY client_insert_quotes ON quote_requests FOR INSERT TO authenticated
      WITH CHECK (client_id IN (SELECT id FROM client_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── 8. Storage buckets (run via Supabase Dashboard → Storage) ──
-- Create bucket: unit-photos (public)
-- Create bucket: unit-leases (private)
-- OR use the Supabase JS client:
-- await supabase.storage.createBucket('unit-photos', { public: true })
-- await supabase.storage.createBucket('unit-leases', { public: false })
