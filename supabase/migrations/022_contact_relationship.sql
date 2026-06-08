-- 022_contact_relationship.sql
-- Adds relationship context fields to contacts table

alter table contacts
  add column if not exists relationship_start_date   date,
  add column if not exists first_meeting_location    text,
  add column if not exists first_meeting_event       text,
  add column if not exists first_meeting_context     text;
