# Campus Marketplace

A two-sided campus marketplace: your own new/dropshipped catalog, plus
secondhand listings from students. Secondhand deals go through an escrow-style
flow — buyer and seller chat in-app, agree on price, the seller pays a 10%
commission (M-Pesa), you approve, the buyer's number is revealed, the buyer
pays a deposit to you, and you release it to the seller after pickup.

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Supabase** — Postgres, auth, row-level security
- **M-Pesa Daraja API** — STK push for commission + deposit collection

## Setup

1. **Create a Supabase project** at supabase.com. In the SQL editor, run
   `supabase/schema.sql` to create all tables, indexes, and RLS policies.

2. **Copy `.env.example` to `.env.local`** and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from
     Supabase project settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — same page. **Never expose this to the
     client** — it's only used in `lib/supabaseAdmin.ts`, imported exclusively
     from `app/api/**` route handlers.
   - M-Pesa Daraja sandbox credentials from
     developer.safaricom.co.ke (create an app, get consumer key/secret,
     use the sandbox shortcode `174379` and its test passkey to start).
   - `MPESA_CALLBACK_URL` must be a **publicly reachable** HTTPS URL — use
     `ngrok` for local dev (Safaricom can't call `localhost`), or your Vercel
     deployment URL in production.

3. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

4. **Make yourself an admin.** After signing up once through the app, run
   this in the Supabase SQL editor:
   ```sql
   update profiles set is_admin = true where campus_email = 'you@youruni.ac.ke';
   ```

## How the escrow flow maps to the code

| Stage | Where it happens |
|---|---|
| Buyer messages seller | `app/chat/[conversationId]` (Supabase Realtime) |
| Buyer & seller agree | `AgreeDealForm.tsx` → `POST /api/deals` creates the `deals` row |
| Seller pays 10% | `app/deals/[dealId]` → `POST /api/mpesa/stkpush` (type: commission) |
| Payment confirmed | Safaricom → `POST /api/mpesa/callback` → deal → `commission_paid` |
| You approve | `app/admin` → `POST /api/deals/[dealId]/approve` → reveals buyer's number |
| Buyer pays deposit | `app/deals/[dealId]` → `POST /api/mpesa/stkpush` (type: deposit) |
| Deposit confirmed | callback → deal → `deposit_paid` |
| Pickup confirmed | `app/admin` → `POST /api/deals/[dealId]/complete` → deal → `completed` |
| Deposit released to seller | **Manual for now** — send via M-Pesa yourself; a `payments` row of type `payout` is created as a reminder/ledger entry. Automating this needs Daraja's B2C API, which requires extra Safaricom approval. |

## Not yet built (natural next steps)

- Campus-email domain restriction at signup (there's a `TODO` in `app/signup/page.tsx`)
- Image upload for listings (Supabase Storage — `TODO` in `app/sell/page.tsx`)
- Order flow for your own catalog `products` (schema exists via the `orders`
  table; no UI yet — same pattern as the secondhand flow but without the
  escrow steps)
- Dispute handling beyond the `disputed` status placeholder
- Email/SMS notifications on stage changes (currently the buyer/seller has to
  revisit the deal page to see status updates)
- Automated deposit payout via Daraja B2C once you have Safaricom approval for it
