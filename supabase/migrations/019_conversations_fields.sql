-- Migration 019: Add how_met, where_met, business_card fields to conversations
-- Also update type check constraint to include 'in_person'

alter table conversations
  add column if not exists how_met text check (how_met in ('cold_outreach','in_person','referral_intro','event','existing_relationship','inbound_inquiry')),
  add column if not exists where_met text,
  add column if not exists business_card boolean not null default false;

-- Update the type check constraint to include in_person
alter table conversations drop constraint if exists conversations_type_check;
alter table conversations add constraint conversations_type_check
  check (type in ('call','text','email','meeting','in_person','voicemail','other'));
