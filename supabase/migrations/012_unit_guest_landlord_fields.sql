-- Migration 012: Additional guest and landlord fields on units
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest2_name TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest2_email TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS guest2_phone TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS landlord_additional_contact TEXT;
