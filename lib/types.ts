export type Stage =
  | 0  // Request
  | 1  // Quote Sent
  | 2  // Quote Approved
  | 3  // Confirmed
  | 4  // Signed
  | 5  // Operations
  | 6  // Logistics
  | 7  // Guest Services
  | 8  // Complete

export const STAGE_LABELS: Record<number, string> = {
  0: 'Request',
  1: 'Quote Sent',
  2: 'Quote Approved',
  3: 'Confirmed',
  4: 'Signed',
  5: 'Operations',
  6: 'Logistics',
  7: 'Guest Services',
  8: 'Complete',
}

export const STAGE_COLORS: Record<number, string> = {
  0: '#888888',
  1: '#C9A84C',
  2: '#E2A830',
  3: '#4C7BC9',
  4: '#4CAF93',
  5: '#9B59B6',
  6: '#E67E22',
  7: '#27AE60',
  8: '#4CAF93',
}

export interface Occupant {
  id: string
  contract_id: string
  name: string
  created_at: string
}

export interface AuditLog {
  id: string
  contract_id: string
  actor: string
  action: string
  created_at: string
}

export interface QuoteLineItem {
  description: string
  amount: number
}

export interface Contract {
  id: string
  reference: string
  client_name: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  location: string
  units: number
  price_per_unit: number
  damage_deposit?: number
  payment_schedule?: string
  inclusions?: string
  exclusions?: string
  quote_notes?: string
  quote_line_items?: QuoteLineItem[]
  start_date: string
  end_date: string
  payment_due: string
  payment_method: string
  notes: string
  stage: number
  client_token: string
  client_sig: string | null
  provider_sig: string | null
  contract_file_url: string | null
  docuseal_submission_id?: string
  created_at: string
  updated_at: string
  occupants?: Occupant[]
  audit_logs?: AuditLog[]
}

export const calcTotal = (c: Contract) => {
  const months = Math.max(1, Math.round(
    (new Date(c.end_date).getTime() - new Date(c.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))
  return c.units * c.price_per_unit * months
}

export const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
