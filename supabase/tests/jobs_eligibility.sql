-- ungVERK — stage 3 tests: category age matrix, customer min age, working-time
-- rules (reglugerð 426/1999), create_job validation and job privacy.
--
-- Same conventions as foundation_security.sql: runs as one DO block, impersonates
-- users, always ends with an exception so everything is rolled back.
-- Expected minimum ages below are TEST CONFIGURATION mirroring the seeded categories;
-- if the team changes category ages, update this table too.

do $test$
declare
  results text := '';
  failures int := 0;
  n int;
  ok boolean;
  expected boolean;
  gardabaer smallint;
  job_day date := public.today_is() + 7;
  -- 14:00–15:00 local on job_day: inside every time window
  t_ok timestamptz := (job_day + time '14:00') at time zone 'Atlantic/Reykjavik';
  cust uuid := gen_random_uuid();
  cust2 uuid := gen_random_uuid();
  wrk uuid := gen_random_uuid();
  j uuid;
  j_min15 uuid;
  j_late uuid;
  j_long uuid;
  r record;
  a int;
  expected_min jsonb := '{"gardvinna":13,"gardslattur":16,"dyr":13,"thrif":13,"bilathvottur":13,
                          "sendiferdir":13,"burdur":13,"snjomokstur":16,"annad":16}';
  jobs_by_slug jsonb := '{}';
begin
  select id into gardabaer from public.municipalities where slug = 'gardabaer';

  insert into auth.users (id, instance_id, aud, role, email)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         x::text || '@test.ungverk.invalid'
  from unnest(array[cust, cust2, wrk]) as x;
  insert into public.profiles (id, role, first_name, date_of_birth, municipality_id) values
    (cust,  'CUSTOMER', 'Dagur', public.today_is() - interval '40 years', gardabaer),
    (cust2, 'CUSTOMER', 'Anna',  public.today_is() - interval '35 years', gardabaer),
    (wrk,   'WORKER',   'Ari',   public.today_is() - interval '15 years', gardabaer);

  ---------------------------------------------------------------- create one job per category
  perform set_config('request.jwt.claims', json_build_object('sub', cust, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  for r in select id, slug from public.job_categories order by sort_order loop
    select (public.create_job(r.id, 'Prófunarverk ' || r.slug, '', 5000, gardabaer, 'Arnarnes',
            'Prófgata 1', t_ok, 60::smallint, null, true)).id into j;
    jobs_by_slug := jobs_by_slug || jsonb_build_object(r.slug, j);
  end loop;

  -- customer asks for 15+ on a 13+ category
  select (public.create_job((select id from public.job_categories where slug = 'gardvinna'),
          'Óskar eftir 15+', '', 5000, gardabaer, 'Arnarnes', 'Prófgata 1', t_ok, 60::smallint, 15::smallint, true)).id
    into j_min15;
  -- 19:30–20:30: past the children's 20:00 limit
  select (public.create_job((select id from public.job_categories where slug = 'gardvinna'),
          'Kvöldverk', '', 5000, gardabaer, 'Arnarnes', 'Prófgata 1',
          (job_day + time '19:30') at time zone 'Atlantic/Reykjavik', 60::smallint, null, true)).id
    into j_late;
  -- 3 hours: over the 2 h school-term limit for children
  select (public.create_job((select id from public.job_categories where slug = 'gardvinna'),
          'Langt verk', '', 5000, gardabaer, 'Arnarnes', 'Prófgata 1', t_ok, 180::smallint, null, true)).id
    into j_long;

  -- customer asking for a YOUNGER worker than the category allows is raised to the minimum
  select min_age into n from public.jobs where id = (jobs_by_slug ->> 'gardslattur')::uuid;
  if n = 16 then results := results || E'\n' || 'ok   garðsláttur min_age stays 16';
  else results := results || E'\n' || ('FAIL garðsláttur min_age = ' || n); failures := failures + 1; end if;

  -- validation errors
  begin
    perform public.create_job((select id from public.job_categories where slug = 'gardvinna'),
      'Of ungt', '', 5000, gardabaer, 'X', 'Prófgata 1', t_ok, 60::smallint, 18::smallint, true);
    results := results || E'\n' || 'FAIL min age 18 accepted'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'invalid_min_age' then results := results || E'\n' || 'ok   min age above 17 rejected';
    else results := results || E'\n' || ('FAIL min age 18: ' || sqlerrm); failures := failures + 1; end if;
  end;

  begin
    perform public.create_job((select id from public.job_categories where slug = 'gardvinna'),
      'Of snemma', '', 5000, gardabaer, 'X', 'Prófgata 1',
      (job_day + time '05:30') at time zone 'Atlantic/Reykjavik', 60::smallint, null, true);
    results := results || E'\n' || 'FAIL 05:30 start accepted'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'outside_allowed_hours' then results := results || E'\n' || 'ok   start before 06:00 rejected';
    else results := results || E'\n' || ('FAIL 05:30: ' || sqlerrm); failures := failures + 1; end if;
  end;

  begin
    perform public.create_job((select id from public.job_categories where slug = 'gardvinna'),
      'Of seint', '', 5000, gardabaer, 'X', 'Prófgata 1',
      (job_day + time '21:30') at time zone 'Atlantic/Reykjavik', 60::smallint, null, true);
    results := results || E'\n' || 'FAIL job ending 22:30 accepted'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'outside_allowed_hours' then results := results || E'\n' || 'ok   end after 22:00 rejected';
    else results := results || E'\n' || ('FAIL 21:30: ' || sqlerrm); failures := failures + 1; end if;
  end;

  begin
    perform public.create_job((select id from public.job_categories where slug = 'gardvinna'),
      'Án staðfestingar', '', 5000, gardabaer, 'X', 'Prófgata 1', t_ok, 60::smallint, null, false);
    results := results || E'\n' || 'FAIL job without safety confirmation accepted'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'safety_not_confirmed' then results := results || E'\n' || 'ok   safety confirmation required';
    else results := results || E'\n' || ('FAIL safety: ' || sqlerrm); failures := failures + 1; end if;
  end;

  begin
    perform public.create_job((select id from public.job_categories where slug = 'gardvinna'),
      'Liðið', '', 5000, gardabaer, 'X', 'Prófgata 1', now() - interval '1 day', 60::smallint, null, true);
    results := results || E'\n' || 'FAIL job in the past accepted'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'invalid_start_time' then results := results || E'\n' || 'ok   past start rejected';
    else results := results || E'\n' || ('FAIL past: ' || sqlerrm); failures := failures + 1; end if;
  end;

  begin
    insert into public.jobs (customer_id, category_id, title, price_isk, municipality_id, area_label,
      min_age, starts_at, duration_minutes, safety_confirmed_at)
    values (cust, 1, 'Framhjá', 5000, gardabaer, 'X', 13, t_ok, 60, now());
    results := results || E'\n' || 'FAIL direct insert into jobs allowed'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   no direct insert into jobs';
  end;

  begin
    update public.jobs set status = 'COMPLETED' where customer_id = cust;
    results := results || E'\n' || 'FAIL customer updated job status directly'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   no direct status update';
  end;

  select count(*) into n from public.job_private_details;
  if n = 12 then results := results || E'\n' || 'ok   customer reads own 12 addresses';
  else results := results || E'\n' || ('FAIL customer sees ' || n || ' addresses'); failures := failures + 1; end if;
  execute 'reset role';

  ---------------------------------------------------------------- other users cannot see private data
  perform set_config('request.jwt.claims', json_build_object('sub', cust2, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.jobs;
  if n = 0 then results := results || E'\n' || 'ok   other customer sees no foreign jobs';
  else results := results || E'\n' || ('FAIL other customer sees ' || n || ' jobs'); failures := failures + 1; end if;
  select count(*) into n from public.job_private_details;
  if n = 0 then results := results || E'\n' || 'ok   other customer sees no addresses';
  else results := results || E'\n' || ('FAIL other customer sees ' || n || ' addresses'); failures := failures + 1; end if;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', wrk, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.jobs;
  if n = 0 then results := results || E'\n' || 'ok   worker cannot read jobs table directly';
  else results := results || E'\n' || ('FAIL worker reads ' || n || ' jobs'); failures := failures + 1; end if;
  select count(*) into n from public.job_private_details;
  if n = 0 then results := results || E'\n' || 'ok   worker cannot read addresses';
  else results := results || E'\n' || ('FAIL worker reads ' || n || ' addresses'); failures := failures + 1; end if;
  begin
    perform public.create_job(1::smallint, 'Verkamaður', '', 5000, gardabaer, 'X', 'Prófgata 1', t_ok, 60::smallint, null, true);
    results := results || E'\n' || 'FAIL worker created a job'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'not_a_customer' then results := results || E'\n' || 'ok   worker cannot post jobs';
    else results := results || E'\n' || ('FAIL worker post: ' || sqlerrm); failures := failures + 1; end if;
  end;
  begin
    perform public.worker_can_take_job(public.today_is(), (jobs_by_slug ->> 'dyr')::uuid);
    results := results || E'\n' || 'FAIL worker can call eligibility function with any DOB'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   eligibility function not callable by clients';
  end;
  execute 'reset role';

  ---------------------------------------------------------------- age matrix: every category x ages 12–18
  n := 0;
  for r in select slug from public.job_categories order by sort_order loop
    for a in 12..18 loop
      ok := public.worker_can_take_job((job_day - make_interval(years => a))::date, (jobs_by_slug ->> r.slug)::uuid);
      expected := a >= (expected_min ->> r.slug)::int and a <= 17;
      n := n + 1;
      if ok is distinct from expected then
        results := results || E'\n' || format('FAIL %s age %s: got %s expected %s', r.slug, a, ok, expected);
        failures := failures + 1;
      end if;
    end loop;
  end loop;
  results := results || E'\n' || format('ok   age matrix checked (%s combinations)', n);

  -- birthday edge: turns 13 the day AFTER the job
  ok := public.worker_can_take_job((job_day - interval '13 years' + interval '1 day')::date, (jobs_by_slug ->> 'dyr')::uuid);
  if not ok then results := results || E'\n' || 'ok   13th birthday after job date -> not eligible';
  else results := results || E'\n' || 'FAIL 12-year-old on job date eligible'; failures := failures + 1; end if;

  -- customer min age 15
  if not public.worker_can_take_job((job_day - interval '14 years')::date, j_min15)
     and public.worker_can_take_job((job_day - interval '15 years')::date, j_min15) then
    results := results || E'\n' || 'ok   customer min age 15 respected';
  else results := results || E'\n' || 'FAIL customer min age 15'; failures := failures + 1; end if;

  -- 19:30–20:30: children (≤15) no, unglingar (16+) yes
  if not public.worker_can_take_job((job_day - interval '15 years')::date, j_late)
     and public.worker_can_take_job((job_day - interval '16 years')::date, j_late) then
    results := results || E'\n' || 'ok   20:00 limit for children, 22:00 for 16+';
  else results := results || E'\n' || 'FAIL evening rule'; failures := failures + 1; end if;

  -- 3 h job in school term: children no, 16+ yes; outside term children yes
  if not public.worker_can_take_job((job_day - interval '15 years')::date, j_long)
     and public.worker_can_take_job((job_day - interval '16 years')::date, j_long) then
    results := results || E'\n' || 'ok   2 h school-term limit for children';
  else results := results || E'\n' || 'FAIL school-term length rule'; failures := failures + 1; end if;

  update public.platform_settings set school_term_active = false where id;
  if public.worker_can_take_job((job_day - interval '13 years')::date, j_long) then
    results := results || E'\n' || 'ok   holiday allows 3 h for children';
  else results := results || E'\n' || 'FAIL holiday length rule'; failures := failures + 1; end if;

  -- configuration changes take effect without code changes
  update public.job_categories set minimum_age = 15 where slug = 'dyr';
  if not public.worker_can_take_job((job_day - interval '14 years')::date, (jobs_by_slug ->> 'dyr')::uuid) then
    results := results || E'\n' || 'ok   category age is configuration (dyr -> 15)';
  else results := results || E'\n' || 'FAIL category config change ignored'; failures := failures + 1; end if;

  update public.job_categories set active = false where slug = 'thrif';
  if not public.worker_can_take_job((job_day - interval '16 years')::date, (jobs_by_slug ->> 'thrif')::uuid) then
    results := results || E'\n' || 'ok   inactive category -> nobody eligible';
  else results := results || E'\n' || 'FAIL inactive category still eligible'; failures := failures + 1; end if;

  if (select requires_approval from public.jobs where id = (jobs_by_slug ->> 'annad')::uuid) then
    results := results || E'\n' || 'ok   "Annað" requires manual approval';
  else results := results || E'\n' || 'FAIL "Annað" not flagged for approval'; failures := failures + 1; end if;

  ---------------------------------------------------------------- anon
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  begin
    perform 1 from public.job_categories;
    results := results || E'\n' || 'FAIL anon reads categories'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   anon cannot read categories or jobs';
  end;
  execute 'reset role';

  if failures = 0 then
    raise exception E'ALL PASSED (% checks, rolled back)\n%', array_length(regexp_split_to_array(btrim(results, E'\n'), E'\n'), 1), results;
  else
    raise exception E'FAILED: % failures\n%', failures, results;
  end if;
end
$test$;
