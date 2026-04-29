-- Add payment_due_day field to contracts
-- Stores the day of month payment is due (1–28, stored as TEXT so it can be "1st", "15", etc.)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_due_day TEXT;
