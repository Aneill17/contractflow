-- Migration 003: CF-XXXXXX contract reference numbering
-- Replaces QT-YYYY-NNNN format
-- Run in Supabase SQL Editor

-- Create sequence for CF numbers
CREATE SEQUENCE IF NOT EXISTS contract_cf_seq START 1;

-- Auto-assign CF-XXXXXX reference on insert if not provided
CREATE OR REPLACE FUNCTION assign_cf_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'CF-' || LPAD(NEXTVAL('contract_cf_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cf_reference ON contracts;
CREATE TRIGGER set_cf_reference
  BEFORE INSERT ON contracts
  FOR EACH ROW EXECUTE FUNCTION assign_cf_reference();
