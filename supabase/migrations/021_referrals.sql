-- 021_referrals.sql
-- Referral tracking system

create table if not exists referrals (
  id                  uuid primary key default uuid_generate_v4(),
  -- who sent it
  client_user_email   text not null,
  client_company_id   uuid references client_companies(id) on delete set null,
  client_company_name text not null,
  referring_name      text not null,
  -- who received it
  referee_name        text not null,
  referee_email       text not null,
  referee_company     text not null,
  referee_need        text,
  personal_note       text,
  -- tracking
  referral_code       text unique not null default encode(gen_random_bytes(8), 'hex'),
  status              text not null default 'pending'
                        check (status in ('pending', 'contacted', 'converted', 'dead')),
  contact_id          uuid references contacts(id) on delete set null,
  contract_id         uuid references contracts(id) on delete set null,
  -- metadata
  sent_at             timestamptz not null default now(),
  contacted_at        timestamptz,
  converted_at        timestamptz,
  notes               text
);

create index if not exists idx_referrals_client_email on referrals(client_user_email);
create index if not exists idx_referrals_status       on referrals(status);
create index if not exists idx_referrals_code         on referrals(referral_code);
create index if not exists idx_referrals_contact      on referrals(contact_id);

alter table referrals enable row level security;
create policy "service_role_referrals" on referrals for all using (true);
