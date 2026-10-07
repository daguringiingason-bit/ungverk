-- ungVERK — stage 4: worker job feed, job details and applications.
--
-- Workers never read public.jobs directly. They get privacy-safe functions that:
--   * only return OPEN, upcoming, approved jobs in the worker's municipality
--   * only return jobs public.worker_can_take_job() allows for the worker's DOB
--   * never return the address, coordinates, customer id or customer surname

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create type public.application_status as enum ('PENDING', 'SELECTED', 'NOT_SELECTED', 'WITHDRAWN');

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  worker_id uuid not null references public.profiles (id),
  message text not null default '' check (char_length(message) <= 300),
  status public.application_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_application_per_worker_per_job unique (job_id, worker_id)
);

create index job_applications_job_id_idx on public.job_applications (job_id);
create index job_applications_worker_id_idx on public.job_applications (worker_id);

create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

alter table public.job_applications enable row level security;

create policy "workers read own applications"
  on public.job_applications for select
  to authenticated
  using (worker_id = (select auth.uid()));

create policy "customers read applications to own jobs"
  on public.job_applications for select
  to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id and j.customer_id = (select auth.uid())));

create policy "admins read all applications"
  on public.job_applications for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.job_applications from anon, authenticated;
grant select on public.job_applications to authenticated;
-- Writes only through apply_to_job() / withdraw_application() / select_worker() (stage 5).

-- ---------------------------------------------------------------------------
-- Internal: the signed-in, active worker (or an exception)
-- ---------------------------------------------------------------------------
create or replace function public.current_worker()
returns public.profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w public.profiles;
begin
  select * into w from public.profiles where id = auth.uid();
  if not found or w.role <> 'WORKER' then
    raise exception 'not_a_worker' using errcode = '42501';
  end if;
  if w.suspended_at is not null then
    raise exception 'account_suspended' using errcode = '42501';
  end if;
  return w;
end;
$$;
revoke all on function public.current_worker() from public, anon, authenticated;

-- Internal: may this worker see / apply to this job right now?
create or replace function public.job_open_for_worker(p_worker public.profiles, p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jobs j
    join public.profiles c on c.id = j.customer_id
    where j.id = p_job_id
      and j.status = 'OPEN'
      and j.starts_at > now()
      and (not j.requires_approval or j.approved_at is not null)
      and j.municipality_id = p_worker.municipality_id
      and c.suspended_at is null
      and public.worker_can_take_job(p_worker.date_of_birth, j.id)
  );
$$;
revoke all on function public.job_open_for_worker(public.profiles, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Feed
-- ---------------------------------------------------------------------------
create or replace function public.get_job_feed(p_limit integer default 20, p_offset integer default 0)
returns table (
  id uuid,
  title text,
  price_isk integer,
  category_name text,
  municipality_name text,
  area_label text,
  starts_at timestamptz,
  duration_minutes smallint,
  has_applied boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w public.profiles := public.current_worker();
begin
  return query
  select j.id, j.title, j.price_isk, cat.name, m.name, j.area_label, j.starts_at, j.duration_minutes,
         exists (select 1 from public.job_applications a
                 where a.job_id = j.id and a.worker_id = w.id and a.status <> 'WITHDRAWN')
  from public.jobs j
  join public.job_categories cat on cat.id = j.category_id
  join public.municipalities m on m.id = j.municipality_id
  where j.status = 'OPEN'
    and j.municipality_id = w.municipality_id
    and j.starts_at > now()
    and public.job_open_for_worker(w, j.id)
  order by j.starts_at asc, j.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;
revoke all on function public.get_job_feed(integer, integer) from public, anon;
grant execute on function public.get_job_feed(integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Job details for a worker. Visible if the job is open for them, or if they have
-- applied to it (so they can follow its status). Never includes the address.
-- ---------------------------------------------------------------------------
create or replace function public.get_job_details(p_job_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  price_isk integer,
  category_name text,
  safety_rules text,
  municipality_name text,
  area_label text,
  starts_at timestamptz,
  duration_minutes smallint,
  min_age smallint,
  job_status public.job_status,
  customer_first_name text,
  customer_verified boolean,
  can_apply boolean,
  my_application_id uuid,
  my_application_status public.application_status
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w public.profiles := public.current_worker();
  v_open boolean := public.job_open_for_worker(w, p_job_id);
  v_app public.job_applications;
begin
  select * into v_app from public.job_applications a where a.job_id = p_job_id and a.worker_id = w.id;

  if not v_open and v_app.id is null then
    raise exception 'job_not_available' using errcode = 'P0002';
  end if;

  return query
  select j.id, j.title, j.description, j.price_isk, cat.name, cat.safety_rules, m.name, j.area_label,
         j.starts_at, j.duration_minutes, j.min_age, j.status, c.first_name,
         c.verification_status = 'VERIFIED',
         v_open and v_app.id is null,
         v_app.id, v_app.status
  from public.jobs j
  join public.job_categories cat on cat.id = j.category_id
  join public.municipalities m on m.id = j.municipality_id
  join public.profiles c on c.id = j.customer_id
  where j.id = p_job_id;
end;
$$;
revoke all on function public.get_job_details(uuid) from public, anon;
grant execute on function public.get_job_details(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Apply / withdraw
-- ---------------------------------------------------------------------------
create or replace function public.apply_to_job(p_job_id uuid, p_message text default '')
returns public.job_applications
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.profiles := public.current_worker();
  v_app public.job_applications;
begin
  -- Lock the job row so it can't be assigned/cancelled while we check and insert.
  perform 1 from public.jobs where id = p_job_id for share;

  if exists (select 1 from public.job_applications where job_id = p_job_id and worker_id = w.id) then
    raise exception 'already_applied' using errcode = '23505';
  end if;

  if not public.job_open_for_worker(w, p_job_id) then
    raise exception 'job_not_available' using errcode = 'P0002';
  end if;

  if char_length(coalesce(p_message, '')) > 300 then
    raise exception 'message_too_long' using errcode = '22023';
  end if;

  insert into public.job_applications (job_id, worker_id, message)
  values (p_job_id, w.id, btrim(coalesce(p_message, '')))
  returning * into v_app;

  return v_app;
end;
$$;
revoke all on function public.apply_to_job(uuid, text) from public, anon;
grant execute on function public.apply_to_job(uuid, text) to authenticated;

create or replace function public.withdraw_application(p_application_id uuid)
returns public.job_applications
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.profiles := public.current_worker();
  v_app public.job_applications;
begin
  update public.job_applications
     set status = 'WITHDRAWN'
   where id = p_application_id and worker_id = w.id and status = 'PENDING'
  returning * into v_app;

  if v_app.id is null then
    raise exception 'cannot_withdraw' using errcode = 'P0002';
  end if;
  return v_app;
end;
$$;
revoke all on function public.withdraw_application(uuid) from public, anon;
grant execute on function public.withdraw_application(uuid) to authenticated;

-- The worker's own applications with the public job fields they need.
create or replace function public.get_my_applications()
returns table (
  application_id uuid,
  application_status public.application_status,
  applied_at timestamptz,
  job_id uuid,
  title text,
  price_isk integer,
  municipality_name text,
  area_label text,
  starts_at timestamptz,
  duration_minutes smallint,
  job_status public.job_status
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w public.profiles := public.current_worker();
begin
  return query
  select a.id, a.status, a.created_at, j.id, j.title, j.price_isk, m.name, j.area_label,
         j.starts_at, j.duration_minutes, j.status
  from public.job_applications a
  join public.jobs j on j.id = a.job_id
  join public.municipalities m on m.id = j.municipality_id
  where a.worker_id = w.id
  order by a.created_at desc
  limit 100;
end;
$$;
revoke all on function public.get_my_applications() from public, anon;
grant execute on function public.get_my_applications() to authenticated;
