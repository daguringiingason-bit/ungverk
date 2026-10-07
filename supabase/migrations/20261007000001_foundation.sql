-- ungVERK — foundation migration
-- Profiles, roles, municipalities, platform settings and onboarding.
--
-- Security model:
--   * profiles rows are created ONLY through complete_onboarding() (security definer),
--     which validates role and age server-side. Clients have no INSERT/DELETE grant.
--   * Clients may UPDATE only harmless columns of their own row (column-level grants + RLS).
--     role, date_of_birth, verification_status and suspension are not client-writable.
--   * Clients can SELECT only their own profile row. Cross-user (public) profile reads
--     will be added later as narrow, relationship-scoped functions (e.g. a customer
--     viewing the applicants to their own job) — never as open table access.
--   * ADMIN can never be self-assigned; admins are promoted manually by the team via SQL.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('CUSTOMER', 'WORKER', 'ADMIN');
create type public.verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Today's date in Iceland. Iceland is UTC year-round, but being explicit keeps
-- the age calculation correct if the server timezone ever changes.
create or replace function public.today_is()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Atlantic/Reykjavik')::date;
$$;

-- Whole years between a date of birth and today. The DOB is the source of truth;
-- age is never stored.
create or replace function public.age_in_years(dob date)
returns integer
language sql
stable
set search_path = ''
as $$
  select extract(year from age(public.today_is(), dob))::integer;
$$;

-- ---------------------------------------------------------------------------
-- Platform settings (single row). Age bounds are CONFIGURATION, not legal facts.
-- They must be verified against Icelandic rules before public launch.
-- ---------------------------------------------------------------------------
create table public.platform_settings (
  id boolean primary key default true check (id), -- enforces a single row
  worker_min_age smallint not null default 13,
  worker_max_age smallint not null default 17,
  customer_min_age smallint not null default 18,
  updated_at timestamptz not null default now(),
  constraint worker_age_range_valid check (worker_min_age > 0 and worker_min_age <= worker_max_age)
);
insert into public.platform_settings (id) values (true);

alter table public.platform_settings enable row level security;
-- Readable by signed-in users so the app can explain the rules; writable only by
-- the team via SQL/dashboard (no client write grants).
create policy "settings readable by signed-in users"
  on public.platform_settings for select
  to authenticated
  using (true);
revoke all on public.platform_settings from anon, authenticated;
grant select on public.platform_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Municipalities (reference data, database-driven)
-- ---------------------------------------------------------------------------
create table public.municipalities (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique check (char_length(name) between 1 and 60),
  active boolean not null default true,
  sort_order smallint not null default 0
);

insert into public.municipalities (slug, name, sort_order) values
  ('reykjavik',      'Reykjavík',      1),
  ('kopavogur',      'Kópavogur',      2),
  ('hafnarfjordur',  'Hafnarfjörður',  3),
  ('gardabaer',      'Garðabær',       4),
  ('mosfellsbaer',   'Mosfellsbær',    5),
  ('seltjarnarnes',  'Seltjarnarnes',  6);

alter table public.municipalities enable row level security;
-- Public reference data: needed on the onboarding screen.
create policy "active municipalities are public"
  on public.municipalities for select
  to anon, authenticated
  using (active);
revoke all on public.municipalities from anon, authenticated;
grant select on public.municipalities to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 40),
  last_name_private text check (last_name_private is null or char_length(last_name_private) <= 60),
  date_of_birth date not null check (date_of_birth > date '1900-01-01'),
  municipality_id smallint not null references public.municipalities (id),
  avatar_id text not null default 'avatar-01' check (avatar_id ~ '^avatar-[0-9]{2}$'),
  bio text check (bio is null or char_length(bio) <= 300),
  verification_status public.verification_status not null default 'UNVERIFIED',
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_municipality_id_idx on public.profiles (municipality_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Is the current user an active (non-suspended) admin?
-- security definer so it can read profiles regardless of the caller's RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
      and p.suspended_at is null
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "admins read all profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) and suspended_at is null)
  with check (id = (select auth.uid()));

-- Column-level privileges: clients can only ever change these columns.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name_private, municipality_id, avatar_id, bio)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Onboarding: the ONLY way a profile is created.
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_role public.user_role,
  p_first_name text,
  p_date_of_birth date,
  p_municipality_id smallint,
  p_avatar_id text default 'avatar-01'
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_settings public.platform_settings;
  v_age integer;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_role is null or p_role not in ('CUSTOMER', 'WORKER') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile_exists' using errcode = '23505';
  end if;

  if p_first_name is null or char_length(btrim(p_first_name)) not between 1 and 40 then
    raise exception 'invalid_first_name' using errcode = '22023';
  end if;

  if p_date_of_birth is null or p_date_of_birth > public.today_is() then
    raise exception 'invalid_date_of_birth' using errcode = '22023';
  end if;

  if not exists (select 1 from public.municipalities where id = p_municipality_id and active) then
    raise exception 'invalid_municipality' using errcode = '22023';
  end if;

  select * into v_settings from public.platform_settings where id;
  v_age := public.age_in_years(p_date_of_birth);

  if p_role = 'WORKER'
     and (v_age < v_settings.worker_min_age or v_age > v_settings.worker_max_age) then
    raise exception 'worker_age_not_allowed' using errcode = '22023';
  end if;

  if p_role = 'CUSTOMER' and v_age < v_settings.customer_min_age then
    raise exception 'customer_age_not_allowed' using errcode = '22023';
  end if;

  insert into public.profiles (id, role, first_name, date_of_birth, municipality_id, avatar_id)
  values (v_uid, p_role, btrim(p_first_name), p_date_of_birth, p_municipality_id,
          coalesce(p_avatar_id, 'avatar-01'))
  returning * into v_profile;

  return v_profile;
end;
$$;
revoke all on function public.complete_onboarding(public.user_role, text, date, smallint, text) from public, anon;
grant execute on function public.complete_onboarding(public.user_role, text, date, smallint, text) to authenticated;

-- Helper functions are internal; don't expose them through the API.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.age_in_years(date) from public, anon;
revoke all on function public.today_is() from public, anon;
grant execute on function public.age_in_years(date) to authenticated;
grant execute on function public.today_is() to authenticated;
