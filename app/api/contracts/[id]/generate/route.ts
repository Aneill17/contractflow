import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, occupants(*)')
    .eq('id', params.id)
    .single()

  if (error || !contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  // Build a natural language description of lease term
  const startDate = new Date(contract.start_date)
  const endDate = new Date(contract.end_date)
  const formatDateLong = (d: Date) => d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  const monthlyRate = contract.units * contract.price_per_unit
  const nightlyRate = Math.round(contract.price_per_unit / 30)
  const damageDeposit = contract.damage_deposit || Math.round(monthlyRate * 0.5)

  // Infer location region from city
  const locationCity = contract.location.split(',')[0]?.trim() || contract.location
  const locationRegion = inferRegion(locationCity)

  const inclusions = contract.inclusions || '- Furniture and furnishings\n- Electricity\n- Water\n- Heat\n- High-speed internet\n- Property maintenance\n- Basic property management services'

  const prompt = `You are generating a professional lease agreement for Elias Range Stays, a workforce housing company in British Columbia, Canada.

Fill in the following lease agreement template exactly — replace every {{variable}} with the correct value from the contract details below. Do not change the structure, headings, or legal language. Only fill in the variables.

CONTRACT DETAILS:
- Reference: ${contract.reference}
- Effective Date: ${formatDateLong(startDate)}
- Client Company: ${contract.client_name}
- Contact Name: ${contract.contact_name}
- Client Address: ${contract.contact_email} (use "Address on file" if no address provided)
- Location Area: ${locationCity}
- Location City: ${locationCity.split('—')[0]?.trim() || locationCity}
- Location Region: ${locationRegion}
- Unit Configuration: ${contract.units === 1 ? '1 Bedroom / 1 Bathroom' : `${contract.units} furnished residential units`}
- Start Date: ${formatDateLong(startDate)}
- End Date: ${formatDateLong(endDate)}
- Nightly Rate: $${nightlyRate.toFixed(2)}
- Monthly Rate: $${monthlyRate.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Damage Deposit: $${damageDeposit.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Inclusions: ${inclusions}

TEMPLATE TO FILL:

# LEASE AGREEMENT

**Effective Date: ${formatDateLong(startDate)}**

---

**THE LANDLORD**

**Elias Range Stays**
Contract Manager: Austin Neill
103-1504 Scott Crescent
Squamish, BC V8B 1G7, Canada

**AND**

**THE TENANT**

**${contract.client_name}**
Attention: ${contract.contact_name}
[Client address on file]

---

## BACKGROUND

**A.** The Landlord is engaged in the business of providing furnished housing accommodations suitable for short-term and mid-term stays.

**B.** The Tenant requires furnished accommodation for temporary housing purposes in ${locationRegion}.

**C.** The Landlord has agreed to provide ${contract.units === 1 ? 'a furnished residential unit' : `${contract.units} furnished residential units`} located in ${locationCity}, British Columbia, fully furnished and including utilities.

**D.** The Parties wish to set out the terms and conditions governing the rental of the Unit${contract.units > 1 ? 's' : ''}.

---

## LEASE TERM

1. The Lease Term shall commence on **${formatDateLong(startDate)}** and shall expire on **${formatDateLong(endDate)}** (the "Initial Lease Term").

2. Upon expiration of the Initial Lease Term, the Tenant shall have the option to extend the lease on a month-to-month basis, subject to mutual agreement between the parties.

3. Any month-to-month extension may be terminated by either party with one (1) clear calendar month's written notice.

---

## PREMISES

The Landlord agrees to lease to the Tenant the following premises:

| | |
|---|---|
| **Location** | ${locationCity}, British Columbia |
| **Unit Type** | Furnished Residential ${contract.units > 1 ? 'Apartments' : 'Apartment'} |
| **Number of Units** | ${contract.units} |
| **Condition** | Fully furnished and move-in ready |

---

## INCLUSIONS

The following are included in the monthly rent:

${inclusions}

---

## RENT

| | **Rate** |
|---|---|
| **Nightly Rate** | $${nightlyRate.toFixed(2)} per night |
| **Monthly Rate** | $${monthlyRate.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per month |

The monthly rate applies to any full calendar month during the Lease Term. Partial months may be prorated based on the nightly rate.

---

## PAYMENT TERMS

1. Rent shall be invoiced monthly at the beginning of each month.

2. Payment shall be due upon receipt of invoice unless otherwise agreed in writing.

3. Preferred payment method: ${contract.payment_method || 'EFT (Electronic Funds Transfer)'}.

4. Partial months may be prorated based on the nightly rate.

---

## DAMAGE DEPOSIT

Prior to the commencement of the Lease Term, the Tenant shall pay a refundable damage deposit of **$${damageDeposit.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**.

The deposit will be returned within **30 days** after the end of the Lease Term, provided the unit${contract.units > 1 ? 's are' : ' is'} returned in reasonable condition, normal wear and tear excepted.

---

## USE OF PREMISES

The Unit${contract.units > 1 ? 's' : ''} shall be used solely for residential accommodation purposes by the Tenant's authorized occupants. The Tenant agrees:

- Not to conduct business operations from the premises
- Not to sublease without written permission
- To comply with all applicable laws and building regulations

---

## MAINTENANCE AND CARE

The Tenant agrees to:

- Maintain the unit${contract.units > 1 ? 's' : ''} in a clean condition
- Report any maintenance issues promptly
- Be responsible for damages beyond normal wear and tear

---

## TERMINATION

Either party may terminate a month-to-month extension with one (1) clear calendar month's written notice.

---

## GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the Province of British Columbia, Canada.

---

## SIGNATURES

By signing below, the parties acknowledge that they have read, understood, and agree to be bound by the terms of this Lease Agreement.

**LANDLORD**
**Elias Range Stays**
Austin Neill — Contract Manager

________________________________
Signature

________________________________
Date

**TENANT**
**${contract.client_name}**
${contract.contact_name} — Authorized Signatory

________________________________
Signature

________________________________
Date

---

*This document was prepared for the parties named herein. Governed by the laws of British Columbia, Canada.*

Output ONLY the completed lease agreement text. No preamble, no explanation, no markdown code fences. Start with "# LEASE AGREEMENT".`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const contractText = message.content[0].type === 'text' ? message.content[0].text : ''

  if (!contractText) {
    return NextResponse.json({ success: false, error: 'Claude returned empty response' }, { status: 500 })
  }

  // Save to DB
  await supabase.from('contracts').update({ generated_contract: contractText }).eq('id', params.id)

  await supabase.from('audit_logs').insert({
    contract_id: params.id,
    actor: user.name,
    action: 'Contract generated with AI',
  })

  return NextResponse.json({ success: true, contract: contractText })
}

function inferRegion(city: string): string {
  const c = city.toLowerCase()
  if (c.includes('burnaby') || c.includes('surrey') || c.includes('richmond') || c.includes('delta') || c.includes('langley') || c.includes('coquitlam') || c.includes('new westminster') || c.includes('metrotown') || c.includes('metro van') || c.includes('vancouver')) return 'the Greater Vancouver area'
  if (c.includes('whistler') || c.includes('squamish') || c.includes('pemberton')) return 'the Sea-to-Sky Corridor'
  if (c.includes('kelowna') || c.includes('penticton') || c.includes('vernon')) return 'the Okanagan'
  if (c.includes('victoria') || c.includes('saanich') || c.includes('langford') || c.includes('esquimalt')) return 'Greater Victoria'
  if (c.includes('prince george')) return 'Northern British Columbia'
  if (c.includes('kamloops')) return 'the Thompson-Nicola region'
  if (c.includes('abbotsford') || c.includes('chilliwack') || c.includes('mission')) return 'the Fraser Valley'
  if (c.includes('nanaimo') || c.includes('campbell river') || c.includes('courtenay')) return 'Vancouver Island'
  return 'British Columbia'
}
