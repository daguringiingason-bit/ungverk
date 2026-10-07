-- ungVERK — DEVELOPMENT SEED DATA. NEVER RUN AGAINST PRODUCTION.
--
-- For a local stack only (`npx supabase start`, then run this file). Everything here is
-- fake and clearly marked: emails end in @test.ungverk.invalid and names start with "Próf".
-- The hosted project has no seed data; automated tests create and roll back their own.
--
-- Accounts (sign in with the email; local Inbucket at http://localhost:54324 shows the code):
--   customers: prof-vidskiptavinur-1@test.ungverk.invalid, prof-vidskiptavinur-2@...
--   workers:   prof-13@..., prof-14@..., prof-15@..., prof-16@..., prof-17@...
--   12- and 18-year-olds have accounts but NO profile (onboarding must refuse them):
--              prof-12@..., prof-18@...

do $seed$
declare
  gardabaer smallint := (select id from public.municipalities where slug = 'gardabaer');
  uid uuid;
  a int;
  cust uuid;
  r record;
begin
  if exists (select 1 from auth.users where email like '%@test.ungverk.invalid') then
    raise notice 'seed already applied';
    return;
  end if;

  -- customers
  for a in 1..2 loop
    uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at)
    values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'prof-vidskiptavinur-' || a || '@test.ungverk.invalid', now());
    insert into public.profiles (id, role, first_name, date_of_birth, municipality_id)
    values (uid, 'CUSTOMER', 'Próf Viðskiptavinur ' || a, public.today_is() - interval '40 years', gardabaer);
    if a = 1 then cust := uid; end if;
  end loop;

  -- workers 13–17 (birthday 30 days ago), plus 12 and 18 without profiles
  for a in 12..18 loop
    uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at)
    values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'prof-' || a || '@test.ungverk.invalid', now());
    if a between 13 and 17 then
      insert into public.profiles (id, role, first_name, date_of_birth, municipality_id)
      values (uid, 'WORKER', 'Próf ' || a || ' ára',
              (public.today_is() - make_interval(years => a, days => 30))::date, gardabaer);
    end if;
  end loop;

  -- one open job per category, Saturday-ish next week at 14:00, 1 hour
  for r in select id, slug, name from public.job_categories where active order by sort_order loop
    insert into public.jobs (customer_id, category_id, title, description, price_isk, municipality_id,
                             area_label, min_age, starts_at, duration_minutes, requires_approval, safety_confirmed_at)
    select cust, r.id, 'Próf: ' || r.name, 'Prófunarverkefni (gervigögn).', 5000, gardabaer, 'Arnarnes',
           c.minimum_age, ((public.today_is() + 7) + time '14:00') at time zone 'Atlantic/Reykjavik', 60,
           c.requires_manual_approval, now()
    from public.job_categories c where c.id = r.id
    returning id into uid;
    insert into public.job_private_details (job_id, address) values (uid, 'Prófgata ' || r.id);
  end loop;
end
$seed$;
