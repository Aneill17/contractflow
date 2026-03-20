export type Stage = 0 | 1 | 2 | 3 | 4 | 5

// 0: Request received
// 1: Quote Sent (awaiting client approval)
// 2: Contract (quote approved - build & review contract internally)
// 3: Contract Sent (sent to DocuSeal for signing)
// 4: Signed (fully executed by both parties)
// 5: Complete (team handoff done)

export const STAGE_LABELS: Record<number, string> = {
  0: 'Request',
  1: 'Quote Sent',
  2: 'Contract',
  3: 'Contract Sent',
  4: 'Signed',
  5: 'Complete',
}

export const STAGE_COLORS: Record<number, string> = {
  0: '#94a3b8',   // Request — gray
  1: '#C4793A',   // Quote Sent — amber
  2: '#C4793A',   // Contract — amber
  3: '#C4793A',   // Contract Sent — amber
  4: '#00BFA6',   // Signed — teal
  5: '#4F87A0',   // Complete — steel blue (readable on light bg)
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
  generated_contract?: string
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
  docuseal_client_slug?: string
  docuseal_provider_slug?: string
  // Sprint 2: worksite + benchmark fields
  work_site_address?: string
  work_site_lat?: number
  work_site_lng?: number
  current_housing_rate?: number
  current_housing_location?: string
  created_at: string
  updated_at: string
  occupants?: Occupant[]
  audit_logs?: AuditLog[]
}

export const calcMonths = (c: Contract): number =>
  Math.max(1, Math.round(
    (new Date(c.end_date).getTime() - new Date(c.start_date).getTime())
    / (1000 * 60 * 60 * 24 * 30)
  ))

export const calcTotal = (c: Contract): number => {
  const months = calcMonths(c)
  const base = c.units * (c.price_per_unit || 0) * months
  const lineItems = (c.quote_line_items || []).reduce((s, li) => s + (li.amount || 0), 0)
  const deposit = c.damage_deposit || 0
  return base + lineItems + deposit
}

export const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export const formatDateLong = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

export interface Staff {
  id: string
  name: string
  role: 'ground_team' | 'manager' | 'admin'
  email?: string
  phone?: string
  status: 'active' | 'inactive'
  notes?: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  assigned_to?: string
  staff?: { name: string }
  contract_id?: string
  unit_id?: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'open' | 'in_progress' | 'done' | 'cancelled'
  due_date?: string
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Contractor {
  id: string
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  type: 'individual' | 'company'
  status: 'active' | 'inactive' | 'onboarding'
  specialty?: string
  notes?: string
  onboarded_at?: string
  created_at: string
}

export interface ContractorMessage {
  id: string
  contractor_id: string
  direction: 'outbound' | 'inbound'
  channel: 'email' | 'sms' | 'whatsapp' | 'manual'
  subject?: string
  body: string
  sent_by?: string
  sent_at: string
}
