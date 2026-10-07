-- ungVERK — stage 3: job categories, jobs and worker eligibility.
--
-- Age and working-time rules follow Reglugerð nr. 426/1999 um vinnu barna og unglinga
-- (latest amendment 454/2016) as the team's chosen safety baseline. Everything here is
-- DATA in job_categories / platform_settings so the team can change it without code.
-- Each category records whether its age is explicitly LISTED in the regulation or is an
-- INTERPRETATION that should be confirmed (e.g. with Vinnueftirlitið) before launch.
--
-- Eligibility is decided ONLY by public.worker_can_take_job() in the database.

-- ---------------------------------------------------------------------------
-- Working-time settings (reglugerð 426/1999)
-- ---------------------------------------------------------------------------
alter table public.platform_settings
  -- Workers up to this age are treated as "barn" (1. gr.: under 15 OR in compulsory
  -- schooling). Most 15-year-olds in Iceland are still in grunnskóli, so 15 is the
  -- conservative default.
  add column child_max_age smallint not null default 15,
  -- 30. gr.: children may not work 20:00–06:00. 19. gr.: unglingar not 22:00–06:00.
  add column earliest_start time not null default '06:00',
  add column child_latest_end time not null default '20:00',
  add column adolescent_latest_end time not null default '22:00',
  -- 27. gr.: children max 2 h per school day; 7 h per day outside the school term
  -- (13–14). 16. gr.: unglingar max 8 h per day. Applied per job.
  add column school_term_active boolean not null default true,
  add column child_max_minutes_school_term smallint not null default 120,
  add column child_max_minutes_holiday smallint not null default 420,
  add column adolescent_max_minutes smallint not null default 480,
  -- How far ahead a job can be scheduled.
  add column max_days_ahead smallint not null default 60;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create type public.risk_level as enum ('LOW', 'MEDIUM', 'HIGH');
create type public.legal_basis as enum ('LISTED', 'INTERPRETED');

create table public.job_categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique check (char_length(name) between 1 and 40),
  description text not null,          -- what the category covers (shown to customers)
  safety_rules text not null,          -- what is NOT allowed (shown to customers + workers)
  minimum_age smallint not null,
  maximum_age smallint not null default 17,
  risk_level public.risk_level not null default 'LOW',
  requires_manual_approval boolean not null default false,
  legal_basis public.legal_basis not null,
  legal_reference text not null,       -- internal note: which article/annex
  active boolean not null default true,
  sort_order smallint not null default 0,
  constraint category_age_range_valid check (minimum_age > 0 and minimum_age <= maximum_age)
);

insert into public.job_categories
  (slug, name, description, safety_rules, minimum_age, risk_level, requires_manual_approval, legal_basis, legal_reference, sort_order)
values
  ('gardvinna', 'Garðvinna',
   'Rakstur, laufsöfnun, illgresi, plöntun, vökvun og létt beðavinna.',
   'Án véla. Ekki sláttuvél, sláttuorf, keðjusög eða áburður/eiturefni.',
   13, 'LOW', false, 'LISTED', '426/1999 viðauki 4, liðir 2 og 5', 1),

  ('gardslattur', 'Garðsláttur',
   'Sláttur á heimilisgarði með garðsláttuvél.',
   'Aðeins garðsláttuvél í góðu lagi. Ekki sláttuorf, sláttutraktor eða keðjusög.',
   16, 'MEDIUM', false, 'LISTED', '426/1999 10. gr., viðauki 1A liður 1 og viðauki 1B liður 3', 2),

  ('dyr', 'Dýr',
   'Hundaganga, fóðrun og pössun gæludýra.',
   'Aðeins róleg og vel vanin dýr. Ekki hættuleg eða ótamin dýr.',
   13, 'LOW', false, 'LISTED', '426/1999 viðauki 4 liður 1; viðauki 3 liður 3', 3),

  ('thrif', 'Létt þrif',
   'Sópa, tína rusl, þurrka af, ganga frá og létt tiltekt.',
   'Engin sterk hreinsiefni eða efni með hættumerkingum. Engin háþrýstidæla.',
   13, 'LOW', false, 'LISTED', '426/1999 viðauki 4 liðir 6 og 10; viðauki 2', 4),

  ('bilathvottur', 'Bílaþvottur',
   'Þvottur bíls í höndunum með fötu, svampi og mildri sápu.',
   'Engin háþrýstidæla og engin sterk efni (t.d. tjöruhreinsir).',
   13, 'LOW', false, 'INTERPRETED', 'Túlkað sem létt hreingerning (viðauki 4 liður 6); háþrýstidælur, viðauki 1A', 5),

  ('sendiferdir', 'Sendiferðir',
   'Fara út í búð, sækja eða skila léttum hlutum.',
   'Enginn hlutur þyngri en 8 kg. Ekki áfengi, tóbak eða lyf.',
   13, 'LOW', false, 'LISTED', '426/1999 viðauki 4 liður 13; almenn skilyrði viðauka 4 (8–10 kg)', 6),

  ('burdur', 'Létt burðarverk',
   'Bera létta hluti, t.d. kassa eða poka, innanhúss eða að bíl.',
   'Enginn hlutur þyngri en 8 kg. Ekki húsgögn, stigar eða burður milli hæða með þunga hluti.',
   13, 'LOW', false, 'LISTED', '426/1999 viðauki 4 liður 9 og almenn skilyrði (8–10 kg); viðauki 3 liður 1 (12 kg)', 7),

  ('snjomokstur', 'Snjómokstur',
   'Moka snjó af tröppum, stétt eða innkeyrslu með skóflu.',
   'Aðeins skófla. Ekki snjóblásari. Ekki á þökum.',
   16, 'MEDIUM', false, 'INTERPRETED', 'Ekki á lista viðauka 4 (léttari störf barna); snjóblásarar óheimilir yngri en 18 (viðauki 1A liður 1)', 8),

  ('annad', 'Annað',
   'Önnur létt verkefni sem passa ekki í flokkana hér að ofan.',
   'ungVERK teymið fer yfir verkefnið áður en það birtist.',
   16, 'MEDIUM', true, 'INTERPRETED', 'Metið handvirkt í hvert sinn', 9);

alter table public.job_categories enable row level security;
create policy "active categories readable by signed-in users"
  on public.job_categories for select
  to authenticated
  using (active or (select public.is_admin()));
revoke all on public.job_categories from anon, authenticated;
grant select on public.job_categories to authenticated;

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create type public.job_status as enum (
  'DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WORKER_COMPLETED', 'COMPLETED', 'REVIEWED',
  'CANCELLED', 'DISPUTED'
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id),
  category_id smallint not null references public.job_categories (id),
  title text not null check (char_length(btrim(title)) between 3 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  price_isk integer not null check (price_isk between 500 and 200000),
  municipality_id smallint not null references public.municipalities (id),
  area_label text not null check (char_length(btrim(area_label)) between 1 and 60),
  -- The customer may ask for an older worker than the category minimum.
  min_age smallint not null check (min_age between 1 and 99),
  starts_at timestamptz not null,
  duration_minutes smallint not null check (duration_minutes between 15 and 480),
  status public.job_status not null default 'OPEN',
  requires_approval boolean not null default false,
  approved_at timestamptz,
  assigned_worker_id uuid references public.profiles (id),
  -- Customer confirmed the job needs no machines, hazardous substances or heavy loads.
  safety_confirmed_at timestamptz not null,
  -- Payment is handled outside the app in the pilot; nothing here moves money.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_status_idx on public.jobs (status);
create index jobs_municipality_id_idx on public.jobs (municipality_id);
create index jobs_category_id_idx on public.jobs (category_id);
create index jobs_created_at_idx on public.jobs (created_at desc);
create index jobs_customer_id_idx on public.jobs (customer_id);
create index jobs_assigned_worker_id_idx on public.jobs (assigned_worker_id);

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;

-- Customers see their own jobs; admins see all. Workers never read this table
-- directly — they get a filtered, privacy-safe feed function (stage 4).
create policy "customers read own jobs"
  on public.jobs for select
  to authenticated
  using (customer_id = (select auth.uid()));

create policy "admins read all jobs"
  on public.jobs for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.jobs from anon, authenticated;
grant select on public.jobs to authenticated;
-- No insert/update/delete grants: all changes go through functions that enforce the
-- state machine.

-- Exact location is stored separately and is never part of a public query.
create table public.job_private_details (
  job_id uuid primary key references public.jobs (id) on delete cascade,
  address text not null check (char_length(btrim(address)) between 3 and 120),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180)
);

alter table public.job_private_details enable row level security;
-- Stage 5 adds: the assigned worker may read it after assignment.
create policy "customer reads own job address"
  on public.job_private_details for select
  to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id and j.customer_id = (select auth.uid())));
create policy "admins read job addresses"
  on public.job_private_details for select
  to authenticated
  using ((select public.is_admin()));
revoke all on public.job_private_details from anon, authenticated;
grant select on public.job_private_details to authenticated;

-- ---------------------------------------------------------------------------
-- Eligibility — the single source of truth
-- ---------------------------------------------------------------------------
-- Can a worker with this date of birth take this job? Applies:
--   * worker age range (platform_settings), category age range, customer's min age
--   * time-of-day and length limits for barn / unglingur (426/1999, 19., 27., 30. gr.)
-- Age is measured on the day the job happens.
create or replace function public.worker_can_take_job(p_worker_dob date, p_job_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.platform_settings;
  j public.jobs;
  c public.job_categories;
  v_local_start timestamp;
  v_local_end timestamp;
  v_age integer;
  v_max_minutes integer;
  v_latest_end time;
begin
  select * into s from public.platform_settings where id;
  select * into j from public.jobs where id = p_job_id;
  if not found then return false; end if;
  select * into c from public.job_categories where id = j.category_id;
  if not c.active then return false; end if;

  v_local_start := j.starts_at at time zone 'Atlantic/Reykjavik';
  v_local_end := v_local_start + make_interval(mins => j.duration_minutes);
  v_age := extract(year from age(v_local_start::date, p_worker_dob))::integer;

  if v_age < greatest(s.worker_min_age, c.minimum_age, j.min_age)
     or v_age > least(s.worker_max_age, c.maximum_age) then
    return false;
  end if;

  if v_age <= s.child_max_age then
    v_latest_end := s.child_latest_end;
    v_max_minutes := case when s.school_term_active
                          then s.child_max_minutes_school_term
                          else s.child_max_minutes_holiday end;
  else
    v_latest_end := s.adolescent_latest_end;
    v_max_minutes := s.adolescent_max_minutes;
  end if;

  return v_local_end::date = v_local_start::date         -- never past midnight
     and v_local_start::time >= s.earliest_start
     and v_local_end::time <= v_latest_end
     and j.duration_minutes <= v_max_minutes;
end;
$$;
revoke all on function public.worker_can_take_job(date, uuid) from public, anon, authenticated;
-- Internal only: used by other security-definer functions (feed, apply, select).

-- ---------------------------------------------------------------------------
-- Create a job (customers only)
-- ---------------------------------------------------------------------------
create or replace function public.create_job(
  p_category_id smallint,
  p_title text,
  p_description text,
  p_price_isk integer,
  p_municipality_id smallint,
  p_area_label text,
  p_address text,
  p_starts_at timestamptz,
  p_duration_minutes smallint,
  p_min_age smallint,
  p_safety_confirmed boolean
)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_category public.job_categories;
  s public.platform_settings;
  v_min_age smallint;
  v_local_start timestamp;
  v_job public.jobs;
begin
  select * into v_profile from public.profiles where id = v_uid;
  if not found or v_profile.role <> 'CUSTOMER' then
    raise exception 'not_a_customer' using errcode = '42501';
  end if;
  if v_profile.suspended_at is not null then
    raise exception 'account_suspended' using errcode = '42501';
  end if;

  select * into v_category from public.job_categories where id = p_category_id and active;
  if not found then
    raise exception 'invalid_category' using errcode = '22023';
  end if;

  select * into s from public.platform_settings where id;

  -- The customer can ask for an older worker, never a younger one than the category allows.
  v_min_age := greatest(v_category.minimum_age, s.worker_min_age, coalesce(p_min_age, 0));
  if v_min_age > least(v_category.maximum_age, s.worker_max_age) then
    raise exception 'invalid_min_age' using errcode = '22023';
  end if;

  if p_safety_confirmed is not true then
    raise exception 'safety_not_confirmed' using errcode = '22023';
  end if;

  if p_starts_at is null or p_starts_at < now() + interval '1 hour'
     or p_starts_at > now() + make_interval(days => s.max_days_ahead) then
    raise exception 'invalid_start_time' using errcode = '22023';
  end if;

  -- Reject times no worker could ever take (outside the widest allowed window).
  v_local_start := p_starts_at at time zone 'Atlantic/Reykjavik';
  if v_local_start::time < s.earliest_start
     or (v_local_start + make_interval(mins => p_duration_minutes))::time > s.adolescent_latest_end
     or (v_local_start + make_interval(mins => p_duration_minutes))::date <> v_local_start::date
     or p_duration_minutes > s.adolescent_max_minutes then
    raise exception 'outside_allowed_hours' using errcode = '22023';
  end if;

  if not exists (select 1 from public.municipalities where id = p_municipality_id and active) then
    raise exception 'invalid_municipality' using errcode = '22023';
  end if;

  insert into public.jobs (
    customer_id, category_id, title, description, price_isk, municipality_id, area_label,
    min_age, starts_at, duration_minutes, status, requires_approval, safety_confirmed_at
  ) values (
    v_uid, p_category_id, btrim(p_title), btrim(coalesce(p_description, '')), p_price_isk,
    p_municipality_id, btrim(p_area_label), v_min_age, p_starts_at, p_duration_minutes,
    'OPEN', v_category.requires_manual_approval, now()
  )
  returning * into v_job;

  insert into public.job_private_details (job_id, address)
  values (v_job.id, btrim(p_address));

  return v_job;
end;
$$;
revoke all on function public.create_job(smallint, text, text, integer, smallint, text, text, timestamptz, smallint, smallint, boolean) from public, anon;
grant execute on function public.create_job(smallint, text, text, integer, smallint, text, text, timestamptz, smallint, smallint, boolean) to authenticated;
