# ContractFlow — Corporate Housing Contract Management

A full-stack contract management platform built with Next.js, Supabase, and Resend.
  
---

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Database**: Supabase (Postgres)
- **Auth**: Supabase (team login)
- **Email**: Resend
- **File Storage**: Supabase Storage
- **Hosting**: Vercel

---

## Deployment Steps

### 1. Set up Supabase Database

1. Go to https://supabase.com → your project → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**
4. Go to **Storage** → Create a new bucket called `contract-files` → set to **Public**

### 2. Configure Resend

1. Go to https://resend.com → **Domains** → Add your sending domain
2. Follow DNS verification steps (add the provided TXT/MX records to your domain registrar)
3. Once verified, update `lib/emails.ts` line 5:
   ```
   const FROM = 'ContractFlow <contracts@YOURDOMAIN.com>'
   ```

### 3. Push to GitHub

```bash
cd contractflow
git init
git add .
git commit -m "Initial ContractFlow deployment"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/contractflow.git
git push -u origin main
```

### 4. Deploy to Vercel

1. Go to https://vercel.com → **New Project** → Import your GitHub repo
2. Add these **Environment Variables** in Vercel dashboard (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dfcsqpgltjlbzdwxughu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (your full key) |
| `RESEND_API_KEY` | `re_bFdt6A7r...` (your full key) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (update after first deploy) |

3. Click **Deploy**
4. Once deployed, copy your Vercel URL and update `NEXT_PUBLIC_APP_URL` to match

### 5. Update App URL

After your first Vercel deployment, you'll get a URL like `https://contractflow-abc123.vercel.app`.
- Go to Vercel → Settings → Environment Variables
- Update `NEXT_PUBLIC_APP_URL` to your actual URL
- Redeploy

---

## How It Works

### Internal Team (your app URL)
- Dashboard shows all contracts, stats, filters
- Create new contracts with full client/booking details
- Manage each contract through 9 stages
- Apply signatures, upload contract documents
- Mark team handoff stages complete
- Full audit trail on every contract

### Client Portal (`/client/[token]`)
- Each contract has a unique, secure URL
- Copy the link from any contract and send to your client
- Client sees their quote, can approve or request changes
- Client signs the contract digitally
- No login required — token-based access

### Email Triggers (automatic)
| Stage | Email Sent |
|-------|-----------|
| Stage → 1 (Quote Sent) | Quote email to client |
| Stage → 3 (Confirmed) | Confirmation + payment details |
| Both signatures applied | Fully executed confirmation |

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
contractflow/
├── app/
│   ├── page.tsx              # Main dashboard (internal)
│   ├── client/[token]/       # Client portal
│   ├── api/
│   │   ├── contracts/        # GET all, POST new
│   │   ├── contracts/[id]/   # PATCH contract
│   │   ├── contracts/[id]/upload/  # File upload
│   │   └── client/[token]/   # Client portal API
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ContractDetail.tsx    # Full contract management UI
│   └── NewContract.tsx       # New contract form
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── types.ts              # TypeScript types + helpers
│   └── emails.ts             # Resend email templates
├── supabase/
│   └── schema.sql            # Run this in Supabase SQL editor
└── .env.local                # Your credentials (never commit)
```
