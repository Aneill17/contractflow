# CRM Build Summary
**Built:** 2026-06-08  
**Feature:** Contacts & Conversations CRM for ContractFlow

---

## Files Created

### Database / Schema

| File | Description |
|------|-------------|
| `supabase/migrations/017_crm.sql` | New migration — creates `contacts` and `conversations` tables, triggers, RLS, and indexes |
| `supabase/schema.sql` | Appended both tables to the canonical schema file |

#### `contacts` table
- `id`, `name`, `company`, `role`, `email`, `phone`
- `source` — `'direct' | 'referral' | 'event' | 'cold'`
- `referred_by` — free text
- `contract_id` — nullable FK → `contracts.id`
- `quoted` — boolean
- `status` — `'prospect' | 'quoted' | 'active' | 'inactive'`
- `notes`, `created_at`, `updated_at`

#### `conversations` table
- `id`, `contact_id` (FK → contacts), `contract_id` (nullable FK → contracts)
- `type` — `'call' | 'text' | 'email' | 'meeting' | 'voicemail' | 'other'`
- `direction` — `'outbound' | 'inbound'`
- `summary`, `next_action`, `follow_up_date`, `actor`, `created_at`

Indexes: `contact_id`, `contract_id`, `follow_up_date`, `created_at DESC`

---

### API Routes

| File | Methods | Description |
|------|---------|-------------|
| `app/api/contacts/route.ts` | GET, POST | List all contacts (with latest conversation + contract info joined). Create new contact. |
| `app/api/contacts/[id]/route.ts` | GET, PATCH, DELETE | Get single contact with full conversation history. Update or delete. DELETE is owner-only. |
| `app/api/conversations/route.ts` | GET, POST | List conversations, filterable by `contact_id`, `contract_id`, `type`, `from`, `to`. Create new conversation entry. |
| `app/api/conversations/[id]/route.ts` | PATCH, DELETE | Update or delete a specific conversation entry. |

All routes use `getAuthUser()` from `@/lib/auth` and `createServerClient()` from `@/lib/supabase` — consistent with existing patterns.

---

### Dashboard Pages

| File | Description |
|------|-------------|
| `app/dashboard/contacts/page.tsx` | Full CRM page — see feature list below |

#### CRM Page Features (`/dashboard/contacts`)
- **Own sidebar** matching the main dashboard nav, with CRM highlighted, back-links to other sections
- **Follow-up banner** — amber warning at top showing X follow-ups due/overdue today; click to filter to those contacts
- **Tab 1: Contacts**
  - Search bar (name/company/email)
  - Status filter buttons: All · Prospect (amber) · Quoted (blue) · Active (teal) · Inactive (grey)
  - Card grid — name, company, role, status badge, email/phone links, referred-by, latest conversation snippet, follow-up date, contract link
  - Click a card → contact detail panel opens alongside the card grid (sticky)
  - Per-card: Edit button (opens ContactModal) + Log button (opens ConversationModal pre-filled)
- **Tab 2: Conversations**
  - Chronological feed of all conversations across all contacts
  - Filters: by contact, contract, type, from/to date range
  - Rows show: date, type icon, contact name + company, type label, direction, summary, next action, follow-up date (amber if overdue), contract reference
- **Add Contact modal** — all fields including source, referred_by, contract link, quoted checkbox, status
- **Log Conversation modal**
  - 🎤 Voice-to-text button using browser Web Speech API (`webkitSpeechRecognition`)
  - Red pulsing dot indicator while recording
  - Transcribes speech into Summary field in real-time
  - Auto-parses transcript: infers `type` from keywords ("called", "texted", "met with", "email"), extracts `next_action` from "follow up / call back / send" patterns
  - Searchable contact dropdown with company shown
  - Type, direction, summary, next action, follow-up date, contract link fields

---

### Modified Files

| File | Change |
|------|--------|
| `components/ContractDetail.tsx` | Added `ContractConversationsTab` component + `💬 Conversations` tab in the contract detail view |
| `app/page.tsx` | Added `🗒️ CRM / Contacts` nav item in the main dashboard sidebar linking to `/dashboard/contacts` |

#### `ContractConversationsTab` (inside ContractDetail)
- New tab in every contract: **💬 Conversations**
- Shows all conversations with `contract_id` matching this contract
- "+ Log Conversation" button opens an inline modal pre-filled with this contract
- Modal has: contact selector (from all CRM contacts), type, direction, summary, next action, follow-up date
- Renders conversation feed: type icon, contact name, summary, next action, follow-up alert

---

## How to Deploy the Schema

Run the migration in Supabase SQL Editor:

```sql
-- Copy and run supabase/migrations/017_crm.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

---

## Style Notes
All UI matches ContractFlow conventions:
- Colors: Navy `#0B2540`, Teal `#00BFA6`, Amber `#F59E0B`
- Font: IBM Plex Mono for labels/badges, Segoe UI for body
- Dark navy sidebar, white cards, `#f8f9fb` page background
- Status badges: prospect=amber, quoted=blue, active=teal, inactive=grey
- Same card/input/button patterns as all other dashboard pages

---

## Notes for Austin
1. **Run migration 017_crm.sql** in your Supabase SQL Editor to create the tables before using the CRM
2. The voice-to-text button requires Chrome or Edge (uses `webkitSpeechRecognition`) — Safari and Firefox may not support it; the button will show an alert if unsupported
3. The auto-parse of transcripts is best-effort (keyword matching) — always review before saving
4. Contacts can exist independently of contracts, or be linked to a contract once a deal closes
5. Every contract now has a **💬 Conversations** tab where you can log touchpoints specific to that deal
