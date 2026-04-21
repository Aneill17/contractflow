-- Migration 011: Contract documents table for client contracts and landlord leases
CREATE TABLE IF NOT EXISTS contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('client_contract', 'landlord_lease', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by contract
CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON contract_documents(contract_id);
