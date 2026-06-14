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
  contact_name    text not null,
  whatsapp        text not null,
  doc_url         text,
  verified        boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Backfill for databases created before contact_name existed (idempotent).
-- Default '' satisfies the not-null constraint for any pre-existing rows;
-- new inserts always supply a real value via the onboarding action.
alter table recyclers add column if not exists contact_name text not null default '';

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
-- buyer_gstin / buyer_company_name are denormalized from brands at order time so
-- the involved recycler (who cannot read the buyer's brands row under RLS) can see
-- the GSTIN needed for the CPCB transfer + display the buyer name. Visibility is
-- confined to the buyer + recycler by the "orders: buyer or recycler" policy.
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  buyer_id            uuid not null references brands(id) on delete cascade,
  recycler_id         uuid not null references recyclers(id) on delete cascade,
  listing_id          uuid not null references listings(id) on delete cascade,
  category            text not null check (category in ('rigid', 'flexible', 'mlp')),
  qty_kg              numeric not null,
  price_per_kg        numeric not null,
  credits_cost        numeric not null,
  platform_fee        numeric not null,
  total               numeric not null,
  buyer_gstin         text,
  buyer_company_name  text,
  status              text not null default 'pending' check (status in ('pending', 'transferred', 'declined', 'expired')),
  expires_at          timestamptz not null,
  created_at          timestamptz not null default now()
);

-- Backfill for databases created before the denormalized buyer fields existed.
alter table orders add column if not exists buyer_gstin        text;
alter table orders add column if not exists buyer_company_name text;

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

-- NOTE: Postgres has no CREATE POLICY IF NOT EXISTS, so each policy is dropped
-- first to keep this whole file safely re-runnable (idempotent).

-- brands: own row only
drop policy if exists "brands: own row" on brands;
create policy "brands: own row" on brands
  for all using (clerk_user_id = public.clerk_user_id());

-- recyclers: own row only
drop policy if exists "recyclers: own row" on recyclers;
create policy "recyclers: own row" on recyclers
  for all using (clerk_user_id = public.clerk_user_id());

-- recyclers: any authenticated user can read rows (needed for order book join).
-- Column exposure is narrowed to the public subset by a column-level GRANT in
-- the ROLE GRANTS section below — RLS gates rows, the grant gates columns.
drop policy if exists "recyclers: public read" on recyclers;
create policy "recyclers: public read" on recyclers
  for select using (public.clerk_user_id() is not null);

-- liabilities: brand owner only
drop policy if exists "liabilities: brand owner" on liabilities;
create policy "liabilities: brand owner" on liabilities
  for all using (
    brand_id in (select id from brands where clerk_user_id = public.clerk_user_id())
  );

-- listings: any authed user reads active listings; only owning recycler writes
drop policy if exists "listings: read active" on listings;
create policy "listings: read active" on listings
  for select using (
    public.clerk_user_id() is not null
    and status = 'active'
  );

drop policy if exists "listings: recycler writes" on listings;
create policy "listings: recycler writes" on listings
  for insert with check (
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

drop policy if exists "listings: recycler updates own" on listings;
create policy "listings: recycler updates own" on listings
  for update using (
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

-- recycler can read ALL of its own listings (any status) for the inventory vault;
-- the "read active" policy above only covers active listings for the public market.
drop policy if exists "listings: recycler reads own" on listings;
create policy "listings: recycler reads own" on listings
  for select using (
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

-- orders: visible only to the buyer or the recycler involved
drop policy if exists "orders: buyer or recycler" on orders;
create policy "orders: buyer or recycler" on orders
  for select using (
    buyer_id   in (select id from brands    where clerk_user_id = public.clerk_user_id())
    or
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

drop policy if exists "orders: buyer inserts" on orders;
create policy "orders: buyer inserts" on orders
  for insert with check (
    buyer_id in (select id from brands where clerk_user_id = public.clerk_user_id())
  );

-- only recycler can update status (accept/decline); system handles expired via cron
drop policy if exists "orders: recycler updates" on orders;
create policy "orders: recycler updates" on orders
  for update using (
    recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
  );

-- certificates: visible to buyer or recycler of the associated order
drop policy if exists "certificates: buyer or recycler" on certificates;
create policy "certificates: buyer or recycler" on certificates
  for select using (
    order_id in (
      select id from orders where
        buyer_id    in (select id from brands    where clerk_user_id = public.clerk_user_id())
        or
        recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
    )
  );

-- Only the recycler fulfilling the order may issue its certificate. A blanket
-- `with check (true)` would let any authenticated user pre-insert a certificate
-- row for an order they don't own (griefing the reference_id), since respondToOrder
-- treats a duplicate (23505) as already-issued. Scope the insert to the order's recycler.
-- (Drop the old permissive policy name too, in case an earlier schema run created it.)
drop policy if exists "certificates: system inserts" on certificates;
drop policy if exists "certificates: recycler of order inserts" on certificates;
create policy "certificates: recycler of order inserts" on certificates
  for insert with check (
    order_id in (
      select id from orders where
        recycler_id in (select id from recyclers where clerk_user_id = public.clerk_user_id())
    )
  );

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

-- ------------------------------------------------------------
-- Column-level lockdown: recyclers
-- RLS gates ROWS, not COLUMNS. The "recyclers: public read" policy lets any
-- authenticated user select rows, and the blanket grant above would otherwise
-- expose EVERY column — including the private clerk_user_id / whatsapp /
-- contact_name / doc_url. Restrict the API roles' SELECT to the public subset
-- (the same columns the public_recyclers view exposes). service_role keeps
-- full access for server-side admin reads of a seller's own private fields.
-- Run AFTER the blanket grant so this narrower grant takes effect.
-- ------------------------------------------------------------

revoke select on recyclers from anon, authenticated;

grant select (id, company_name, state, cpcb_reg_no, capacity_mt, verified)
  on recyclers
  to anon, authenticated;

-- ============================================================
-- AI RATE LIMITING
-- A shared, atomic fixed-window counter for the paid LLM endpoints
-- (/api/copilot, /api/estimate-liability, /api/chat). Server-only: the table
-- is RLS-locked (no policies → API roles see no rows; service_role bypasses
-- RLS), and EXECUTE on the function is granted to service_role only.
-- ============================================================

create table if not exists ai_rate_limits (
  clerk_user_id   text not null,
  window_start    timestamptz not null,
  count           integer not null default 0,
  primary key (clerk_user_id, window_start)
);

alter table ai_rate_limits enable row level security;

-- Atomically bump the caller's counter for the current fixed window and report
-- whether they are still within the limit. Called only from the server via the
-- service-role key (supabaseAdmin.rpc).
create or replace function public.check_ai_rate_limit(
  p_user text, p_limit integer, p_window_seconds integer
) returns boolean
  language plpgsql
  as $$
  declare
    v_window timestamptz := to_timestamp(
      floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
    );
    v_count integer;
  begin
    insert into ai_rate_limits (clerk_user_id, window_start, count)
      values (p_user, v_window, 1)
    on conflict (clerk_user_id, window_start)
      do update set count = ai_rate_limits.count + 1
    returning count into v_count;
    return v_count <= p_limit;
  end;
  $$;

-- Lock the function down to the server (service_role) only.
revoke execute on function public.check_ai_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_ai_rate_limit(text, integer, integer)
  to service_role;

-- ============================================================
-- REALTIME
-- Enable realtime for the two tables the demo syncs on
-- ============================================================

-- ALTER PUBLICATION ... ADD TABLE has no IF NOT EXISTS and errors if the table
-- is already a member, so guard each add to keep this file re-runnable.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'listings'
  ) then
    alter publication supabase_realtime add table listings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;
