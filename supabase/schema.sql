-- ============================================================
-- ContractFlow — Supabase Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Contracts ────────────────────────────────────────────────
create table contracts (
  id              uuid primary key default uuid_generate_v4(),
  reference       text unique not null,
  client_name     text not null,
  contact_name    text not null,
  contact_email   text not null,
  location        text not null,
  units           integer not null default 1,
  price_per_unit  integer not null,
  start_date      date not null,
  end_date        date not null,
  payment_due     date,
  payment_method  text default 'EFT',
  notes           text default '',
  stage           integer not null default 0,
  client_token    text unique not null default encode(gen_random_bytes(32), 'hex'),
  client_sig      text,
  provider_sig    text,
  contract_file_url text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── Occupants ────────────────────────────────────────────────
create table occupants (
  id              uuid primary key default uuid_generate_v4(),
  contract_id     uuid references contracts(id) on delete cascade,
  name            text not null,
  created_at      timestamptz default now()
);

-- ── Audit Logs ───────────────────────────────────────────────
create table audit_logs (
  id              uuid primary key default uuid_generate_v4(),
  contract_id     uuid references contracts(id) on delete cascade,
  actor           text not null,
  action          text not null,
  created_at      timestamptz default now()
);

-- ── Auto-update updated_at ───────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contracts_updated_at
  before update on contracts
  for each row execute function update_updated_at();

-- ── Row Level Security ───────────────────────────────────────
alter table contracts    enable row level security;
alter table occupants    enable row level security;
alter table audit_logs   enable row level security;

-- Internal team: full access (service role key used in API routes)
create policy "Service role full access - contracts"
  on contracts for all using (true);

create policy "Service role full access - occupants"
  on occupants for all using (true);

create policy "Service role full access - audit_logs"
  on audit_logs for all using (true);

-- ── Indexes ──────────────────────────────────────────────────
create index idx_contracts_stage        on contracts(stage);
create index idx_contracts_client_token on contracts(client_token);
create index idx_occupants_contract     on occupants(contract_id);
create index idx_audit_contract         on audit_logs(contract_id);

-- ── Sample Data ──────────────────────────────────────────────
insert into contracts (reference, client_name, contact_name, contact_email, location, units, price_per_unit, start_date, end_date, payment_due, payment_method, notes, stage, client_sig)
values (
  'QT-2024-0089',
  'Meridian Construction Group',
  'Sandra Leigh',
  's.leigh@meridiancg.com',
  'Whistler, BC — Alpine Lodges',
  3, 3200,
  '2025-05-01', '2025-07-31',
  '2025-04-15', 'EFT',
  'Ground floor units preferred. Parking for 2 vehicles.',
  4,
  'Sandra Leigh'
);

insert into occupants (contract_id, name)
select id, unnest(array['James Holt', 'Marcus Reyes', 'Priya Anand'])
from contracts where reference = 'QT-2024-0089';

insert into audit_logs (contract_id, actor, action)
select id, unnest(array['System', 'Alex T.', 'Sandra Leigh', 'System', 'Sandra Leigh']),
       unnest(array['Request received', 'Quote generated and sent', 'Quote approved', 'Confirmation package sent', 'Contract signed by client'])
from contracts where reference = 'QT-2024-0089';
