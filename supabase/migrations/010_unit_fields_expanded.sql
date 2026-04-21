-- Migration 010: Expand unit fields for lease, landlord, and concierge info
ALTER TABLE units ADD COLUMN IF NOT EXISTS lease_type TEXT DEFAULT 'month-to-month';
ALTER TABLE units ADD COLUMN IF NOT EXISTS lease_start DATE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS lease_end DATE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS landlord_name TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS landlord_email TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS landlord_phone TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS concierge_name TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS concierge_phone TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS concierge_notes TEXT;
