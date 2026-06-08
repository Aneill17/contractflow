-- ============================================================
-- ContractFlow CRM — Contacts & Conversations
-- Migration: 017_crm.sql
-- ============================================================

-- ── Contacts table ───────────────────────────────────────────
create table if not exists contacts (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  company       text,
  role          text,
  email         text,
  phone         text,
  source        text not null default 'direct'
                  check (source in ('direct', 'referral', 'event', 'cold')),
  referred_by   text,
  contract_id   uuid references contracts(id) on delete set null,
  quoted        boolean not null default false,
  status        text not null default 'prospect'
                  check (status in ('prospect', 'quoted', 'active', 'inactive')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Conversations table ──────────────────────────────────────
create table if not exists conversations (
  id              uuid primary key default uuid_generate_v4(),
  contact_id      uuid not null references contacts(id) on delete cascade,
  contract_id     uuid references contracts(id) on delete set null,
  type            text not null default 'call'
                    check (type in ('call', 'text', 'email', 'meeting', 'voicemail', 'other')),
  direction       text not null default 'outbound'
                    check (direction in ('outbound', 'inbound')),
  summary         text not null default '',
  next_action     text,
  follow_up_date  date,
  actor           text not null default 'Austin',
  created_at      timestamptz not null default now()
);

-- ── Triggers ─────────────────────────────────────────────────
create trigger contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at();

-- ── Row Level Security ───────────────────────────────────────
alter table contacts       enable row level security;
alter table conversations  enable row level security;

create policy "Service role full access - contacts"
  on contacts for all using (true);

create policy "Service role full access - conversations"
  on conversations for all using (true);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_contacts_contract      on contacts(contract_id);
create index if not exists idx_contacts_status        on contacts(status);
create index if not exists idx_conversations_contact  on conversations(contact_id);
create index if not exists idx_conversations_contract on conversations(contract_id);
create index if not exists idx_conversations_followup on conversations(follow_up_date);
create index if not exists idx_conversations_created  on conversations(created_at desc);
