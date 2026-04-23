export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6

// 0: Request received
// 1: Quote Sent (awaiting client approval)
// 2: Contract (quote approved - build & review contract internally)
// 3: Contract Sent (sent to DocuSeal for signing)
// 4: Signed (fully executed by both parties)
// 5: Operational (housing active, team handed off)
// 6: Complete (contract closed)

export const STAGE_LABELS: Record<number, string> = {
  0: 'Request',
  1: 'Quote Sent',
  2: 'Contract',
  3: 'Contract Sent',
  4: 'Signed',
  5: 'Operational',
  6: 'Complete',
}

export const STAGE_COLORS: Record<number, string> = {
  0: '#94a3b8',   // Request — gray
  1: '#C4793A',   // Quote Sent — amber
  2: '#C4793A',   // Contract — amber
  3: '#C4793A',   // Contract Sent — amber
  4: '#00BFA6',   // Signed — teal
  5: '#00BFA6',   // Operational — teal
  6: '#4F87A0',   // Complete — steel blue
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

// ── Phase 2/3 Types ─────────────────────────────────────────

export interface UnitPhoto {
  id: string
  unit_id: string
  url: string
  is_primary: boolean
  created_at: string
}

export interface UnitLease {
  id: string
  unit_id: string
  lease_type: 'landlord' | 'client'
  file_url: string | null
  lease_start: string | null
  lease_end: string | null
  terms: string | null
  created_at: string
}

export interface ContractUnit {
  id: string
  contract_id: string | null
  address: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  guest_name: string | null
  guest_contact: string | null
  status: string
  notes: string | null
  lease_type: string | null
  lease_start: string | null
  lease_end: string | null
  landlord_name: string | null
  landlord_email: string | null
  landlord_phone: string | null
  landlord_additional_contact: string | null
  lease_monthly_price: number | null
  monthly_cost: number | null
  damage_deposit: number | null
  guest_email: string | null
  guest_phone: string | null
  guest2_name: string | null
  guest2_email: string | null
  guest2_phone: string | null
  created_at: string
  unit_photos?: UnitPhoto[]
  unit_leases?: UnitLease[]
}

export interface ClientAccount {
  id: string
  user_id: string
  company_name: string | null
  contact_name: string | null
  contact_email: string | null
  created_at: string
}

export interface QuoteRequest {
  id: string
  client_id: string
  units_needed: number | null
  location: string | null
  start_date: string | null
  duration_months: number | null
  notes: string | null
  status: 'pending' | 'reviewed' | 'converted'
  created_at: string
}
