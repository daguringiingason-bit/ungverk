-- ungVERK — stage 4 tests: worker feed, job details and applications.
-- Same conventions as the other suites: one DO block, always rolled back.

do $test$
declare
  results text := '';
  failures int := 0;
  n int;
  t text;
  gb smallint := (select id from public.municipalities where slug = 'gardabaer');
  kop smallint := (select id from public.municipalities where slug = 'kopavogur');
  job_day date := public.today_is() + 7;
  t_ok timestamptz := (job_day + time '14:00') at time zone 'Atlantic/Reykjavik';
  cust uuid := gen_random_uuid();
  cust2 uuid := gen_random_uuid();
  w13 uuid := gen_random_uuid();
  w16 uuid := gen_random_uuid();
  w16k uuid := gen_random_uuid();
  wsus uuid := gen_random_uuid();
  j_light uuid; j_mow uuid; j_annad uuid; j_kop uuid;
  app uuid;
  ids uuid[];
begin
  insert into auth.users (id, instance_id, aud, role, email)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.ungverk.invalid'
  from unnest(array[cust, cust2, w13, w16, w16k, wsus]) as x;
  insert into public.profiles (id, role, first_name, last_name_private, date_of_birth, municipality_id, suspended_at) values
    (cust,  'CUSTOMER', 'Dagur', 'Leyndarson', public.today_is() - interval '40 years', gb, null),
    (cust2, 'CUSTOMER', 'Anna',  null, public.today_is() - interval '35 years', gb, null),
    (w13,   'WORKER', 'Þrettán', null, (job_day - interval '13 years 2 months')::date, gb, null),
    (w16,   'WORKER', 'Sextán',  null, (job_day - interval '16 years 2 months')::date, gb, null),
    (w16k,  'WORKER', 'Kópur',   null, (job_day - interval '16 years 2 months')::date, kop, null),
    (wsus,  'WORKER', 'Lokaður', null, (job_day - interval '15 years')::date, gb, now());

  perform set_config('request.jwt.claims', json_build_object('sub', cust, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  j_light := (public.create_job((select id from public.job_categories where slug='gardvinna'), 'Raka lauf', 'Lítill garður', 6000, gb, 'Arnarnes', 'Leynigata 7', t_ok, 60::smallint, null, true)).id;
  j_mow   := (public.create_job((select id from public.job_categories where slug='gardslattur'), 'Slá garðinn', '', 8000, gb, 'Arnarnes', 'Leynigata 7', t_ok, 60::smallint, null, true)).id;
  j_annad := (public.create_job((select id from public.job_categories where slug='annad'), 'Eitthvað annað', '', 5000, gb, 'Arnarnes', 'Leynigata 7', t_ok, 60::smallint, null, true)).id;
  j_kop   := (public.create_job((select id from public.job_categories where slug='gardvinna'), 'Kópavogsverk', '', 5000, kop, 'Hamraborg', 'Leynigata 9', t_ok, 60::smallint, null, true)).id;
  begin
    perform * from public.get_job_feed();
    results := results || E'\n' || 'FAIL customer can read worker feed'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'not_a_worker' then results := results || E'\n' || 'ok   customers cannot call the worker feed';
    else results := results || E'\n' || ('FAIL customer feed: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  ---------------------------------------------------------------- feed contents
  perform set_config('request.jwt.claims', json_build_object('sub', w13, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select array_agg(id) into ids from public.get_job_feed();
  if ids = array[j_light] then results := results || E'\n' || 'ok   13-year-old feed: only the light job in own municipality';
  else results := results || E'\n' || ('FAIL 13 feed: ' || coalesce(array_length(ids,1),0) || ' jobs'); failures := failures + 1; end if;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', w16, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.get_job_feed() f where f.id in (j_light, j_mow);
  if n = 2 and not exists (select 1 from public.get_job_feed() f where f.id in (j_annad, j_kop)) then
    results := results || E'\n' || 'ok   16-year-old feed: light + mowing, not unapproved or other municipality';
  else results := results || E'\n' || 'FAIL 16 feed'; failures := failures + 1; end if;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', w16k, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select array_agg(id) into ids from public.get_job_feed();
  if ids = array[j_kop] then results := results || E'\n' || 'ok   feed is limited to the worker''s municipality';
  else results := results || E'\n' || 'FAIL municipality filter'; failures := failures + 1; end if;
  execute 'reset role';

  update public.jobs set approved_at = now() where id = j_annad;  -- admin approval (stage 7 UI)
  perform set_config('request.jwt.claims', json_build_object('sub', w16, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if exists (select 1 from public.get_job_feed() f where f.id = j_annad) then
    results := results || E'\n' || 'ok   approved "Annað" job appears';
  else results := results || E'\n' || 'FAIL approved job missing'; failures := failures + 1; end if;
  execute 'reset role';

  -- no private fields in the worker-facing functions
  select pg_get_function_result('public.get_job_feed(integer,integer)'::regprocedure)
      || pg_get_function_result('public.get_job_details(uuid)'::regprocedure)
      || pg_get_function_result('public.get_my_applications()'::regprocedure) into t;
  if t !~* '(address|latitude|longitude|customer_id|last_name|date_of_birth)' then
    results := results || E'\n' || 'ok   worker functions expose no address, customer id, surname or DOB';
  else results := results || E'\n' || 'FAIL private field in worker function'; failures := failures + 1; end if;

  ---------------------------------------------------------------- details + apply
  perform set_config('request.jwt.claims', json_build_object('sub', w13, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform * from public.get_job_details(j_mow);
    results := results || E'\n' || 'FAIL 13 can open mowing job'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'job_not_available' then results := results || E'\n' || 'ok   ineligible job details hidden';
    else results := results || E'\n' || ('FAIL details: ' || sqlerrm); failures := failures + 1; end if;
  end;
  begin
    perform public.apply_to_job(j_mow, 'Ég get');
    results := results || E'\n' || 'FAIL 13 applied to mowing job'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'job_not_available' then results := results || E'\n' || 'ok   cannot apply to ineligible job (age bypass blocked)';
    else results := results || E'\n' || ('FAIL apply mow: ' || sqlerrm); failures := failures + 1; end if;
  end;
  app := (public.apply_to_job(j_light, 'Ég get komið kl. 14')).id;
  results := results || E'\n' || 'ok   eligible worker can apply';
  begin
    perform public.apply_to_job(j_light, 'Aftur');
    results := results || E'\n' || 'FAIL applied twice'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'already_applied' then results := results || E'\n' || 'ok   cannot apply twice';
    else results := results || E'\n' || ('FAIL twice: ' || sqlerrm); failures := failures + 1; end if;
  end;
  if (select can_apply = false and my_application_status = 'PENDING' from public.get_job_details(j_light)) then
    results := results || E'\n' || 'ok   details show own PENDING application';
  else results := results || E'\n' || 'FAIL details application status'; failures := failures + 1; end if;
  if (select has_applied from public.get_job_feed() f where f.id = j_light) then
    results := results || E'\n' || 'ok   feed marks applied jobs';
  else results := results || E'\n' || 'FAIL feed has_applied'; failures := failures + 1; end if;
  begin
    insert into public.job_applications (job_id, worker_id) values (j_mow, w13);
    results := results || E'\n' || 'FAIL direct insert into applications'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   no direct insert into applications';
  end;
  begin
    update public.job_applications set status = 'SELECTED' where id = app;
    results := results || E'\n' || 'FAIL worker selected themselves'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   worker cannot set own application to SELECTED';
  end;
  select count(*) into n from public.get_my_applications();
  if n = 1 then results := results || E'\n' || 'ok   my applications lists 1';
  else results := results || E'\n' || ('FAIL my applications = ' || n); failures := failures + 1; end if;
  execute 'reset role';

  ---------------------------------------------------------------- who sees applications
  perform set_config('request.jwt.claims', json_build_object('sub', w16, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.job_applications;
  if n = 0 then results := results || E'\n' || 'ok   workers cannot see others'' applications';
  else results := results || E'\n' || 'FAIL worker sees others'' applications'; failures := failures + 1; end if;
  begin
    perform public.withdraw_application(app);
    results := results || E'\n' || 'FAIL withdrew someone else''s application'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'cannot_withdraw' then results := results || E'\n' || 'ok   cannot withdraw another worker''s application';
    else results := results || E'\n' || ('FAIL withdraw other: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', cust, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.job_applications where job_id = j_light;
  if n = 1 then results := results || E'\n' || 'ok   customer sees applications to own job';
  else results := results || E'\n' || 'FAIL customer application count'; failures := failures + 1; end if;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', cust2, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.job_applications;
  if n = 0 then results := results || E'\n' || 'ok   other customers see no applications';
  else results := results || E'\n' || 'FAIL other customer sees applications'; failures := failures + 1; end if;
  execute 'reset role';

  ---------------------------------------------------------------- withdraw
  perform set_config('request.jwt.claims', json_build_object('sub', w13, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform public.withdraw_application(app);
  if (select status from public.job_applications where id = app) = 'WITHDRAWN' then
    results := results || E'\n' || 'ok   worker can withdraw a pending application';
  else results := results || E'\n' || 'FAIL withdraw'; failures := failures + 1; end if;
  begin
    perform public.withdraw_application(app);
    results := results || E'\n' || 'FAIL withdrew twice'; failures := failures + 1;
  exception when others then
    results := results || E'\n' || 'ok   cannot withdraw twice';
  end;
  execute 'reset role';

  ---------------------------------------------------------------- closed / past / suspended
  update public.jobs set status = 'CANCELLED' where id = j_mow;
  update public.jobs set starts_at = now() - interval '1 hour' where id = j_annad;
  perform set_config('request.jwt.claims', json_build_object('sub', w16, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if not exists (select 1 from public.get_job_feed() f where f.id in (j_mow, j_annad)) then
    results := results || E'\n' || 'ok   cancelled and past jobs leave the feed';
  else results := results || E'\n' || 'FAIL cancelled/past job in feed'; failures := failures + 1; end if;
  begin
    perform public.apply_to_job(j_mow, '');
    results := results || E'\n' || 'FAIL applied to cancelled job'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'job_not_available' then results := results || E'\n' || 'ok   cannot apply to a job that is no longer open';
    else results := results || E'\n' || ('FAIL cancelled apply: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  update public.profiles set suspended_at = now() where id = cust;
  perform set_config('request.jwt.claims', json_build_object('sub', w16, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.get_job_feed();
  if n = 0 then results := results || E'\n' || 'ok   suspended customer''s jobs are hidden';
  else results := results || E'\n' || 'FAIL suspended customer jobs visible'; failures := failures + 1; end if;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', wsus, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform * from public.get_job_feed();
    results := results || E'\n' || 'FAIL suspended worker reads feed'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'account_suspended' then results := results || E'\n' || 'ok   suspended worker blocked';
    else results := results || E'\n' || ('FAIL suspended: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  begin
    perform * from public.get_job_feed();
    results := results || E'\n' || 'FAIL anon reads feed'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   anon cannot read the feed';
  end;
  execute 'reset role';

  if failures = 0 then
    raise exception E'ALL PASSED (% checks, rolled back)\n%', array_length(regexp_split_to_array(btrim(results, E'\n'), E'\n'), 1), results;
  else
    raise exception E'FAILED: % failures\n%', failures, results;
  end if;
end
$test$;
