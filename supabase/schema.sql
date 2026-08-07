-- =============================================================
-- AVINYAA PLATFORM — PHASE 0 SCHEMA
-- Run this in your Supabase project's SQL Editor (see setup guide)
-- =============================================================

-- ---------------------------------------------------------------
-- 1. ORGANISATIONS
-- One row for your master account, one row per client sub-account.
-- ---------------------------------------------------------------
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('master', 'client')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 2. PROFILES
-- One row per logged-in user, linked to Supabase's built-in auth.users
-- and tagged with which organisation they belong to + their role.
-- ---------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organisations(id),
  role text not null check (role in ('super_admin', 'dispatcher', 'client_admin', 'client_user')),
  full_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 3. CARRIERS
-- Transport carriers and install partners. Only your master org
-- manages these — clients never see this table directly.
-- ---------------------------------------------------------------
create table carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text not null check (service_type in ('freight', 'install')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 4. CARRIER RATE CARDS
-- Cost rates you pay each carrier. Never shown to clients.
-- ---------------------------------------------------------------
create table carrier_rate_cards (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references carriers(id),
  rate_basis text not null check (rate_basis in ('per_kg', 'flat', 'per_job')),
  rate_value numeric(10,2) not null,
  effective_from date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 5. MARGIN RULES
-- Phase 0/1 version: one flat-% rule per client org, optionally
-- overridden per carrier. This matches the "two levels only"
-- MVP margin engine from your project plan.
-- ---------------------------------------------------------------
create table margin_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),      -- which client this rule applies to
  carrier_id uuid references carriers(id),                 -- null = applies to ALL carriers for this client
  margin_percent numeric(5,2) not null,                     -- e.g. 20.00 = 20%
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 6. JOBS
-- One row per booking — freight or install. Pricing is SNAPSHOTTED
-- at booking time so later margin changes don't retroactively
-- change historical jobs (see your project plan, Section on margin engine).
-- ---------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),        -- which client this job belongs to
  carrier_id uuid not null references carriers(id),
  job_type text not null check (job_type in ('freight', 'install')),
  status text not null default 'booked' check (status in ('booked', 'in_progress', 'completed', 'cancelled')),
  cost_rate numeric(10,2) not null,          -- snapshot: what you pay the carrier
  margin_percent numeric(5,2) not null,      -- snapshot: margin used at booking time
  sell_rate numeric(10,2) not null,          -- snapshot: what the client is charged
  notes text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- This is what makes multi-tenancy actually safe: a client user
-- can only ever query rows belonging to their own org_id, enforced
-- by the database itself — not by application code you have to
-- get right everywhere.
-- =============================================================

alter table organisations enable row level security;
alter table profiles enable row level security;
alter table carriers enable row level security;
alter table carrier_rate_cards enable row level security;
alter table margin_rules enable row level security;
alter table jobs enable row level security;

-- Helper: is the current logged-in user a super_admin (you)?
create or replace function is_super_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Helper: what org_id does the current logged-in user belong to?
create or replace function my_org_id()
returns uuid
language sql security definer
as $$
  select org_id from profiles where id = auth.uid();
$$;

-- Profiles: users can see their own profile; super_admins see all
create policy "view own profile" on profiles
  for select using (id = auth.uid() or is_super_admin());

-- Organisations: users can see their own org; super_admins see all
create policy "view own org" on organisations
  for select using (id = my_org_id() or is_super_admin());

-- Carriers & rate cards: master-account only (super_admin/dispatcher)
create policy "carriers visible to master account" on carriers
  for select using (is_super_admin());
create policy "rate cards visible to master account" on carrier_rate_cards
  for select using (is_super_admin());

-- Margin rules: master account manages them; clients never see raw rules
create policy "margin rules visible to master account" on margin_rules
  for select using (is_super_admin());

-- Jobs: THE key policy — a client only ever sees jobs where org_id
-- matches their own org. Super_admin (you) sees everything.
create policy "view own org jobs" on jobs
  for select using (org_id = my_org_id() or is_super_admin());

create policy "insert own org jobs" on jobs
  for insert with check (org_id = my_org_id() or is_super_admin());
  
  create policy "update own org jobs" on jobs
  for update using (org_id = my_org_id() or is_super_admin())
  with check (org_id = my_org_id() or is_super_admin());