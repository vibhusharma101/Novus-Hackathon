-- ============================================================
-- EPRx Exchange — Supabase Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Helper: extract Clerk userId from the JWT sub claim.
-- Defined in public schema — the SQL Editor cannot create functions in auth schema.
create or replace function public.clerk_user_id() returns text
  language sql stable
  as $$
    select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')
  $$;

-- ============================================================
-- TABLES
-- ============================================================

-- Buyer profiles (one per Clerk user)
create table if not exists brands (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null unique,
  company_name    text not null,
  gstin           text not null unique,
  contact_name    text not null,
  phone           text not null,
  email           text not null,
  state           text not null,
  created_at      timestamptz not null default now()
);

-- Seller profiles (one per Clerk user)
create table if not exists recyclers (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null unique,
  company_name    text not null,
  cpcb_reg_no     text not null unique,
  state           text not null,
  capacity_mt     numeric not null,
  whatsapp        text not null,
  doc_url         text,
  verified        boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Buyer liability per category (upserted after calculator)
create table if not exists liabilities (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references brands(id) on delete cascade,
  category        text not null check (category in ('rigid', 'flexible', 'mlp')),
  market_kg       numeric not null,
  target_pct      numeric not null,
  liability_kg    numeric not null,
  unique (brand_id, category)
);

-- Recycler credit listings
create table if not exists listings (
  id              uuid primary key default gen_random_uuid(),
  recycler_id     uuid not null references recyclers(id) on delete cascade,
  category        text not null check (category in ('rigid', 'flexible', 'mlp')),
  qty_kg          numeric not null check (qty_kg > 0),
  price_per_kg    numeric not null check (price_per_kg > 0),
  status          text not null default 'active' check (status in ('active', 'partial', 'sold')),
  created_at      timestamptz not null default now()
);

-- Orders (buyer purchases a listing)
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references brands(id) on delete cascade,
  recycler_id     uuid not null references recyclers(id) on delete cascade,
  listing_id      uuid not null references listings(id) on delete cascade,
  category        text not null check (category in ('rigid', 'flexible', 'mlp')),
  qty_kg          numeric not null,
  price_per_kg    numeric not null,
  credits_cost    numeric not null,
  platform_fee    numeric not null,
  total           numeric not null,
  status          text not null default 'pending' check (status in ('pending', 'transferred', 'declined', 'expired')),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

-- Certificates (one per completed order)
create table if not exists certificates (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null unique references orders(id) on delete cascade,
  reference_id    text not null unique,
  issued_at       timestamptz not null default now()
);

-- ============================================================
-- PUBLIC VIEW: recycler info exposed to buyers on the order book
-- (hides clerk_user_id and private fields)
-- ============================================================
create or replace view public_recyclers as
  select id, company_name, state, cpcb_reg_no, capacity_mt, verified
  from recyclers;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table brands      enable row level security;
alter table recyclers   enable row level security;
alter table liabilities enable row level security;
alter table listings    enable row level security;
alter table orders      enable row level security;
alter table certificates enable row level security;

-- brands: own row only
create policy "brands: own row" on brands
  for all using (clerk_user_id = public.clerk_user_id());

-- recyclers: own row only
create policy "recyclers: own row" on recyclers
  for all using (clerk_user_id = public.clerk_user_id());

-- liabilities: brand owner only
create policy "liabilities: brand owner" on liabilities
  for all using (
    brand_id in (select id from brands where clerk_user_id = public.clerk_user_id())
  );

-- listings: any authed user reads active listings; only owning recycler writes
create policy "listings: read active" on listings
  for select using (
    public.clerk_user_id() is not null
    and status = 'active'
  );

create policy "listings: recycler writes" on listings
  for insert with check (
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

create policy "listings: recycler updates own" on listings
  for update using (
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

-- orders: visible only to the buyer or the recycler involved
create policy "orders: buyer or recycler" on orders
  for select using (
    buyer_id   in (select id from brands    where clerk_user_id = public.clerk_user_id())
    or
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

create policy "orders: buyer inserts" on orders
  for insert with check (
    buyer_id in (select id from brands where clerk_user_id = public.clerk_user_id())
  );

-- only recycler can update status (accept/decline); system handles expired via cron
create policy "orders: recycler updates" on orders
  for update using (
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

-- certificates: visible to buyer or recycler of the associated order
create policy "certificates: buyer or recycler" on certificates
  for select using (
    order_id in (
      select id from orders where
        buyer_id    in (select id from brands    where clerk_user_id = public.clerk_user_id())
        or
        recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
    )
  );

create policy "certificates: system inserts" on certificates
  for insert with check (true);

-- ============================================================
-- ROLE GRANTS
-- Supabase API roles need table-level privileges; RLS (above) then filters
-- rows. Without these grants every authed request fails with
-- "permission denied for table ..." BEFORE policies are evaluated.
-- (Tables created via a direct Postgres connection do not get the
-- default Supabase grants, so we set them explicitly + for future tables.)
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select
  on all sequences in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;

-- ============================================================
-- REALTIME
-- Enable realtime for the two tables the demo syncs on
-- ============================================================

alter publication supabase_realtime add table listings;
alter publication supabase_realtime add table orders;
