-- Campus Marketplace schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "uuid-ossp";

-- ---------- Profiles ----------
-- Supabase auth.users already handles login; this holds app-specific profile data.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  campus_email text unique not null,
  phone_number text,                -- kept private; only exposed via the reveal flow below
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Catalog: your own new / dropshipped products ----------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  price numeric(10,2) not null,
  stock int not null default 0,
  category text,
  image_urls text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Peer secondhand listings ----------
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  asking_price numeric(10,2) not null,
  condition text not null check (condition in ('new', 'like_new', 'good', 'fair', 'worn')),
  image_urls text[] not null default '{}',
  status text not null default 'available' check (status in ('available', 'reserved', 'sold', 'removed')),
  created_at timestamptz not null default now()
);

-- ---------- Orders for your own catalog products ----------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled')),
  pickup_location text,
  pickup_time timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Chat between buyer and seller on a secondhand listing ----------
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'agreed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)   -- one thread per buyer per listing
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- The escrow deal created once buyer & seller agree in chat ----------
create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references profiles(id),
  agreed_price numeric(10,2) not null,
  commission_amount numeric(10,2) not null,   -- 10% of agreed_price, computed at creation
  deposit_amount numeric(10,2) not null,
  status text not null default 'awaiting_commission' check (status in (
    'awaiting_commission',   -- seller hasn't paid the 10% yet
    'commission_paid',       -- STK push confirmed, waiting on admin approval
    'approved',              -- admin approved; buyer's number revealed to seller
    'awaiting_deposit',      -- waiting on buyer's deposit
    'deposit_paid',          -- deposit confirmed, ready for pickup
    'completed',             -- pickup confirmed, deposit released to seller
    'disputed',
    'cancelled'
  )),
  buyer_number_revealed boolean not null default false,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  deposit_released_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Payment ledger (M-Pesa STK push commission + deposit) ----------
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references deals(id) on delete cascade,
  type text not null check (type in ('commission', 'deposit', 'payout')),
  phone_number text not null,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  mpesa_checkout_request_id text,      -- returned when STK push is initiated
  mpesa_receipt_number text unique,    -- returned by the callback; unique guards against double-processing
  raw_callback jsonb,                  -- keep the full Daraja callback for reconciliation/debugging
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_status on listings(status);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_deals_status on deals(status);
create index if not exists idx_payments_deal on payments(deal_id);

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table listings enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table deals enable row level security;
alter table payments enable row level security;

-- Profiles: users can read/update their own profile; anyone signed in can read basic profile info
create policy "profiles_select_own_or_public" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Listings: anyone can browse; only the seller can insert/update their own
create policy "listings_select_all" on listings for select using (true);
create policy "listings_insert_own" on listings for insert with check (auth.uid() = seller_id);
create policy "listings_update_own" on listings for update using (auth.uid() = seller_id);

-- Conversations: only buyer and seller involved can see/insert
create policy "conversations_select_participants" on conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "conversations_insert_buyer" on conversations for insert
  with check (auth.uid() = buyer_id);

-- Messages: only participants of the parent conversation
create policy "messages_select_participants" on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));
create policy "messages_insert_participants" on messages for insert
  with check (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
      and c.status <> 'cancelled'
  ));

-- Deals: buyer, seller, or an admin can view. Mutations happen through service-role API routes only,
-- since approval/payment-triggered transitions must be server-controlled, not client-writable.
create policy "deals_select_participants_or_admin" on deals for select
  using (
    auth.uid() = buyer_id or auth.uid() = seller_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Payments: participants of the related deal, or admin, can view; no client-side writes (API routes use service role)
create policy "payments_select_participants_or_admin" on payments for select
  using (exists (
    select 1 from deals d
    where d.id = payments.deal_id
      and (d.buyer_id = auth.uid() or d.seller_id = auth.uid()
           or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin))
  ));

-- IMPORTANT: buyer_number_revealed gates whether the seller can see the buyer's phone_number.
-- Enforce this in application code (API routes), since Postgres RLS can't easily do
-- column-level masking based on a *different* table's boolean without a view/function.
-- See lib/getRevealedContact.ts for the enforcement point.

-- ---------- Storage: listing images ----------
-- Run this after the tables above. Creates a public bucket for listing photos
-- and policies so any signed-in student can upload, but only the uploader can
-- delete their own files.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "listing_images_public_read" on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "listing_images_auth_upload" on storage.objects for insert
  with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

create policy "listing_images_owner_delete" on storage.objects for delete
  using (bucket_id = 'listing-images' and owner = auth.uid());
