-- Migration 008: Units (contract-linked), unit photos, unit leases, client accounts
-- Run in Supabase SQL Editor

-- Add contract_id + new fields to existing units table (if units table already exists from 005)
ALTER TABLE units ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_ssid TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_contact TEXT;

-- If units table doesn't exist yet, create it fresh:
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  address TEXT,
  wifi_ssid TEXT,
  wifi_password TEXT,
  guest_name TEXT,
  guest_contact TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  type TEXT CHECK (type IN ('landlord', 'client')),
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

-- Add status to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add role_type to user_profiles (to distinguish internal vs client portal users)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'internal';
