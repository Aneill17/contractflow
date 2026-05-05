-- Migration 014: Add contract_holder (second contact) to contracts table
alter table contracts add column if not exists contact_name_2 text default null;

comment on column contracts.contact_name_2 is 'Secondary contact / contract holder name (for tax write-off purposes)';
