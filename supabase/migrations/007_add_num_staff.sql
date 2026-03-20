-- Migration 007: Add num_staff to contracts
-- Number of staff required — drives pricing and bedroom count

alter table contracts
  add column if not exists num_staff integer;
