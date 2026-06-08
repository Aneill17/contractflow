-- ============================================================
-- ContractFlow Client Portal
-- Migration: 018_client_portal.sql
-- ============================================================

-- ── client_companies ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── client_users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('admin', 'member')),
  invited_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── client_company_contracts (junction) ──────────────────────
CREATE TABLE IF NOT EXISTS client_company_contracts (
  company_id   UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  contract_id  UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, contract_id)
);

-- ── magic_tokens ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS magic_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Extend occupants ─────────────────────────────────────────
ALTER TABLE occupants
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'departing', 'incoming')),
  ADD COLUMN IF NOT EXISTS departure_date  DATE,
  ADD COLUMN IF NOT EXISTS arrival_date    DATE;

-- ── Extend units (cleanliness + occupancy) ───────────────────
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS cleanliness TEXT NOT NULL DEFAULT 'clean'
    CHECK (cleanliness IN ('clean', 'dirty', 'cleaning_requested')),
  ADD COLUMN IF NOT EXISTS occupancy_status TEXT NOT NULL DEFAULT 'vacant'
    CHECK (occupancy_status IN ('occupied', 'vacant'));

-- ── cleaning_requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cleaning_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id               UUID REFERENCES units(id) ON DELETE CASCADE,
  contract_id           UUID REFERENCES contracts(id) ON DELETE CASCADE,
  requested_by_email    TEXT NOT NULL,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_date        DATE,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'assigned', 'completed')),
  notes                 TEXT,
  completed_at          TIMESTAMPTZ,
  completed_by          TEXT
);

-- ── staff_changes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_changes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id           UUID REFERENCES units(id) ON DELETE CASCADE,
  contract_id       UUID REFERENCES contracts(id) ON DELETE CASCADE,
  outgoing_name     TEXT NOT NULL,
  outgoing_date     DATE NOT NULL,
  incoming_name     TEXT,
  incoming_date     DATE,
  notes             TEXT,
  requested_by_email TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE client_companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_company_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_tokens            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_changes           ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all portal tables (API routes use service role)
CREATE POLICY "service_role_client_companies"
  ON client_companies FOR ALL USING (true);

CREATE POLICY "service_role_client_users"
  ON client_users FOR ALL USING (true);

CREATE POLICY "service_role_client_company_contracts"
  ON client_company_contracts FOR ALL USING (true);

CREATE POLICY "service_role_magic_tokens"
  ON magic_tokens FOR ALL USING (true);

CREATE POLICY "service_role_cleaning_requests"
  ON cleaning_requests FOR ALL USING (true);

CREATE POLICY "service_role_staff_changes"
  ON staff_changes FOR ALL USING (true);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_client_users_email        ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_company      ON client_users(company_id);
CREATE INDEX IF NOT EXISTS idx_ccc_company               ON client_company_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_ccc_contract              ON client_company_contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_token        ON magic_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_email        ON magic_tokens(email);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_unit    ON cleaning_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_status  ON cleaning_requests(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_date    ON cleaning_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_staff_changes_unit        ON staff_changes(unit_id);
CREATE INDEX IF NOT EXISTS idx_staff_changes_contract    ON staff_changes(contract_id);
