# Client Portal Build — Complete Reference

**Build Date:** 2026-06-08  
**Build Status:** ✅ TypeScript clean, Next.js build passes

---

## Overview

A full client portal system built into ContractFlow. Clients (e.g. Maxwell Floors) can manage their contracts, units, and staff via a dedicated passwordless portal at `/client/portal`. ERS ops team receives Slack notifications on all changes. Cleaning workflow flows from client request → ERS cleaning queue → mark complete.

---

## Files Created / Modified

### 🗄️ Database Migration

| File | Description |
|------|-------------|
| `supabase/migrations/018_client_portal.sql` | All new tables + column additions. Run in Supabase SQL Editor. |

### 🔐 Auth Library

| File | Description |
|------|-------------|
| `lib/clientAuth.ts` | HMAC-SHA256 signed session tokens, magic link token generation, cookie helpers |
| `lib/clientApiAuth.ts` | `requireClientSession()` helper for API routes |

### 🔔 Slack Library

| File | Description |
|------|-------------|
| `lib/slack.ts` | `sendSlackNotification()` + typed helpers: `notifyStaffChange`, `notifyCleaningRequest`, `notifyContractExtension`, `notifyNoticeToEnd`, `notifyUnitCleaned`, `notifyAddNote` |

### 🌐 Client Portal Auth API Routes

| File | Description |
|------|-------------|
| `app/api/client/auth/send-magic-link/route.ts` | POST — checks `client_users`, generates token, stores in `magic_tokens`, sends Resend email |
| `app/api/client/auth/verify/route.ts` | GET — validates token, marks used, sets `client_session` cookie, redirects to portal |
| `app/api/client/auth/logout/route.ts` | POST — clears `client_session` cookie |

### 📡 Client Portal API Routes

| File | Description |
|------|-------------|
| `app/api/client/me/route.ts` | GET — returns current session info (email, company_name, role) |
| `app/api/client/contracts/route.ts` | GET — all contracts for authenticated client company |
| `app/api/client/contracts/[id]/route.ts` | GET detail + PATCH (extension request / notice to end / add note) |
| `app/api/client/units/[id]/route.ts` | GET unit detail + PATCH (staff_change / cleaning_request) |
| `app/api/client/staff-changes/route.ts` | POST — create staff change record |
| `app/api/client/cleaning-requests/route.ts` | POST — create cleaning request |
| `app/api/client/team/route.ts` | GET/POST/DELETE — team member management |

### 🧹 Internal Cleaning API Routes

| File | Description |
|------|-------------|
| `app/api/cleaning-requests/route.ts` | GET — all cleaning requests (internal ERS dashboard), supports `?unit_id=` filter |
| `app/api/cleaning-requests/[id]/complete/route.ts` | POST — mark cleaning complete, update unit cleanliness to 'clean', send Slack |

### 🖥️ Client Portal UI Pages

| File | Description |
|------|-------------|
| `app/client/portal/login/page.tsx` | Passwordless magic link login (NEW — replaces old password login) |
| `app/client/portal/layout.tsx` | Minimal layout wrapper |
| `app/client/portal/page.tsx` | Overview dashboard — company header, summary cards, contracts list |
| `app/client/portal/contracts/page.tsx` | Contracts list page |
| `app/client/portal/contracts/[id]/page.tsx` | Contract detail — action buttons, units grid, unit management panel with staff swap + cleaning request |
| `app/client/portal/team/page.tsx` | Team management — invite/remove members (admin only) |
| `app/client/auth/verify/page.tsx` | Token verification redirect handler |

### 🏠 Internal ERS Dashboard Updates

| File | Description |
|------|-------------|
| `app/dashboard/units/page.tsx` | **MODIFIED** — added `cleanliness` + `occupancy_status` to interface, cleanliness badge column (🟢/🔴/🟡), "Mark Clean ✓" button |
| `app/dashboard/cleaning/page.tsx` | **NEW** — cleaning requests queue: list all pending/assigned, sortable, "Mark Complete" per request |
| `app/page.tsx` | **MODIFIED** — added "🧹 Cleaning" nav item to sidebar → `/dashboard/cleaning` |

### 🔧 Existing File Updates

| File | Change |
|------|--------|
| `middleware.ts` | Added `/client/portal/*` protection — redirects to `/client/portal/login` if no valid `client_session` cookie |
| `app/api/units/[id]/route.ts` | Added `cleanliness` and `occupancy_status` to allowed PATCH fields |
| `.env.example` | Added `SLACK_WEBHOOK_URL` and `CLIENT_SESSION_SECRET` |

---

## SQL Migration

Run `supabase/migrations/018_client_portal.sql` in your Supabase dashboard (SQL Editor).

### New Tables

```sql
client_companies     — Company records (e.g. "Maxwell Floors")
client_users         — Portal users linked to companies (passwordless)
client_company_contracts  — Junction: company ↔ contract access
magic_tokens         — One-time login tokens (expire in 1 hour)
cleaning_requests    — Cleaning requests with status tracking
staff_changes        — Staff swap records
```

### Column Additions

```sql
-- occupants table
ALTER TABLE occupants ADD COLUMN status TEXT DEFAULT 'active';     -- 'active'|'departing'|'incoming'
ALTER TABLE occupants ADD COLUMN departure_date DATE;
ALTER TABLE occupants ADD COLUMN arrival_date DATE;

-- units table
ALTER TABLE units ADD COLUMN cleanliness TEXT DEFAULT 'clean';     -- 'clean'|'dirty'|'cleaning_requested'
ALTER TABLE units ADD COLUMN occupancy_status TEXT DEFAULT 'vacant'; -- 'occupied'|'vacant'
```

---

## New Environment Variables

Add to `.env.local` and Vercel environment settings:

```env
# Slack webhook for #contractflow-updates channel
# Create at: https://api.slack.com/apps → Incoming Webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Secret for HMAC-SHA256 session cookie signing
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CLIENT_SESSION_SECRET=your-random-64-char-hex-secret-here
```

---

## Setup Steps

### 1. Run the SQL Migration
Go to Supabase Dashboard → SQL Editor → paste and run `018_client_portal.sql`

### 2. Create Your First Client Company
```sql
-- Insert client company
INSERT INTO client_companies (name) VALUES ('Maxwell Floors')
RETURNING id;

-- Insert admin user (replace with real email + company_id from above)
INSERT INTO client_users (company_id, email, role)
VALUES ('<company_id_from_above>', 'contact@maxwellfloors.com', 'admin');

-- Link company to existing contracts (replace IDs)
INSERT INTO client_company_contracts (company_id, contract_id)
SELECT '<company_id>', id FROM contracts WHERE client_name = 'Maxwell Floors';
```

### 3. Configure Slack
- Go to https://api.slack.com/apps
- Create a new app → Add "Incoming Webhooks"
- Add webhook for `#contractflow-updates` channel
- Copy webhook URL to `SLACK_WEBHOOK_URL` env var

### 4. Set CLIENT_SESSION_SECRET
Generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add to `.env.local` and Vercel.

### 5. Test the Flow
1. Visit `https://contractflow-omega.vercel.app/client/portal/login`
2. Enter the client user email
3. Click "Send Login Link"
4. Check email → click magic link
5. Should redirect to `/client/portal` (overview dashboard)

---

## Auth Architecture

### Session Flow
1. Client visits `/client/portal/login` → enters email
2. `POST /api/client/auth/send-magic-link` → checks `client_users`, generates token, stores in `magic_tokens`, sends Resend email
3. Client clicks link → hits `/api/client/auth/verify?token=TOKEN`
4. Server validates token (not used, not expired), marks used, creates HMAC-signed session JWT, sets `client_session` httpOnly cookie
5. Redirects to `/client/portal`
6. Subsequent requests: middleware reads `client_session` cookie, verifies HMAC signature, allows/blocks access

### Session Token Format
`base64url(JSON.stringify(payload)).base64url(HMAC-SHA256(data))`

Payload: `{ email, company_id, company_name, role, iat }`

### Security Properties
- httpOnly cookie — not accessible to JavaScript
- SameSite=Lax — CSRF protection
- HMAC-SHA256 signed — tamper-evident
- Timing-safe comparison on verification
- Tokens are single-use and expire in 1 hour
- Security-by-default: unregistered emails still show "check your email"

---

## Portal Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/client/portal/login` | Public | Magic link login |
| `/client/auth/verify` | Public | Token verification redirect |
| `/client/portal` | ✅ Required | Overview dashboard |
| `/client/portal/contracts` | ✅ Required | Contracts list |
| `/client/portal/contracts/[id]` | ✅ Required | Contract detail + unit management |
| `/client/portal/team` | ✅ Required | Team access management (admin-only actions) |

---

## Slack Notifications Sent

| Event | When | Format |
|-------|------|--------|
| Staff Change | Client saves staff swap | 🔄 Outgoing/Incoming name + dates |
| Cleaning Request | Client requests cleaning | 🧹 Unit + date needed + notes |
| Extension Request | Client submits extension request | 📅 Contract + duration + note |
| Notice to End | Client submits notice | 🔴 Contract + end date + note |
| Add Note | Client adds a note | 📝 Contract + note text |
| Unit Cleaned | ERS marks unit clean | ✅ Unit + who marked it |

---

## Data Scoping

All client portal API routes enforce company-scoped access:
1. Extract `company_id` from HMAC-verified `client_session` cookie
2. Verify `client_company_contracts` junction table before returning contract data
3. For unit operations: verify unit → contract → company chain
4. All routes use `createServerClient()` (service role) — no anon key exposure

---

## ERS Internal — Cleaning Workflow

1. Client requests cleaning via portal → creates `cleaning_requests` record + Slack notification
2. Unit `cleanliness` updates to `cleaning_requested` (yellow badge in ERS units view)
3. ERS team sees request in `/dashboard/cleaning` queue
4. ERS marks complete → `cleaning_requests.status = 'completed'`, unit `cleanliness = 'clean'`
5. Slack notification sent: `✅ Unit Cleaned`
6. Client portal auto-reflects clean status (reads same `units` table)

---

## Notes for Future Development

- **Real-time updates**: Consider Supabase Realtime subscriptions for live unit status updates in client portal
- **Admin setup UI**: Currently requires SQL to create client companies/users — a simple admin UI for this would be useful
- **Role escalation**: Only ERS can make someone an 'admin' via SQL; a promote-member endpoint could be added
- **Token revocation**: Magic tokens expire in 1 hour; consider an allow-list approach for enterprise clients
- **Audit trail**: All contract actions (extension, notice, notes) write to `audit_logs` — visible in ERS contract detail view
