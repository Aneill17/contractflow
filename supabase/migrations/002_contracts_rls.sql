-- Migration 002: Tighten contracts RLS
-- Replaces the open "using (true)" policies with auth-gated ones
-- Run in Supabase SQL Editor

-- Drop existing open policies
DROP POLICY IF EXISTS "Service role full access - contracts" ON contracts;
DROP POLICY IF EXISTS "Service role full access - occupants" ON occupants;
DROP POLICY IF EXISTS "Service role full access - audit_logs" ON audit_logs;

-- Contracts: any authenticated user can SELECT/INSERT/UPDATE
-- DELETE is blocked here — enforced at API layer (owner check before DELETE call)
CREATE POLICY "Authenticated read contracts"
  ON contracts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update contracts"
  ON contracts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- DELETE: only service role (API enforces owner check before calling DELETE with service client)
CREATE POLICY "Service role delete contracts"
  ON contracts FOR DELETE
  USING (auth.role() = 'service_role');

-- Occupants: same pattern
CREATE POLICY "Authenticated read occupants"
  ON occupants FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write occupants"
  ON occupants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role manage occupants"
  ON occupants FOR ALL
  USING (auth.role() = 'service_role');

-- Audit logs: readable by authenticated, write by service role
CREATE POLICY "Authenticated read audit_logs"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role write audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Also allow service role to delete (for contract cascades)
CREATE POLICY "Service role delete audit_logs"
  ON audit_logs FOR DELETE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role delete occupants"
  ON occupants FOR DELETE
  USING (auth.role() = 'service_role');

-- user_profiles: service role can insert/update (for seeding)
CREATE POLICY "Service role manage profiles"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');
