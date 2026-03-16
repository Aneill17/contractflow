-- Migration 004: Wipe all test data
-- ⚠️  DESTRUCTIVE — run only when Austin confirms
-- This deletes ALL contracts, occupants, and audit logs
-- and resets the CF sequence to 1

-- Run this ONLY when you are ready to go live with real contracts

DELETE FROM audit_logs;
DELETE FROM occupants;
DELETE FROM contracts;

ALTER SEQUENCE contract_cf_seq RESTART WITH 1;

-- After running this, the next contract created will be CF-000001
