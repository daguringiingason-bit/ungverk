-- ungVERK — foundation security tests.
--
-- Runs as one DO block against a real database, impersonating anon/authenticated
-- users through Postgres roles + JWT claims exactly like PostgREST does.
-- It ALWAYS ends by raising an exception so every change is rolled back:
--   * message starting "ALL PASSED"  -> success
--   * message starting "FAILED"      -> at least one check failed (details listed)
--
-- Run it with the Supabase SQL editor, psql, or the Supabase MCP execute_sql tool.

do $test$
declare
  results text := '';
  failures int := 0;
  n int;
  gardabaer smallint;
  today date := public.today_is();
  u12 uuid := gen_random_uuid();   -- worker, turns 13 tomorrow -> must be rejected
  u13 uuid := gen_random_uuid();   -- worker, 13 today          -> allowed
  u17 uuid := gen_random_uuid();   -- worker, 17                -> allowed
  u18 uuid := gen_random_uuid();   -- worker, 18 today          -> rejected
  c17 uuid := gen_random_uuid();   -- customer, 17              -> rejected
  c30 uuid := gen_random_uuid();   -- customer, 30              -> allowed
  adm uuid := gen_random_uuid();   -- tries to self-assign ADMIN
begin
  select id into gardabaer from public.municipalities where slug = 'gardabaer';

  insert into auth.users (id, instance_id, aud, role, email)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         x::text || '@test.ungverk.invalid'
  from unnest(array[u12, u13, u17, u18, c17, c30, adm]) as x;

  ---------------------------------------------------------------- anon
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';

  begin
    perform 1 from public.profiles;
    results := results || E'\n' || 'FAIL anon can read profiles'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   anon cannot read profiles';
  end;

  begin
    perform public.complete_onboarding('WORKER', 'X', (today - interval '15 years')::date, gardabaer);
    results := results || E'\n' || 'FAIL anon can onboard'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   anon cannot call complete_onboarding';
  end;

  select count(*) into n from public.municipalities;
  if n = 6 then results := results || E'\n' || 'ok   anon can list 6 municipalities';
  else results := results || E'\n' || ('FAIL anon municipalities = ' || n); failures := failures + 1; end if;

  execute 'reset role';

  ---------------------------------------------------------------- onboarding age matrix

  -- 12 (13th birthday is tomorrow)
  perform set_config('request.jwt.claims', json_build_object('sub', u12, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.complete_onboarding('WORKER', 'Tólf', (today - interval '13 years' + interval '1 day')::date, gardabaer);
    results := results || E'\n' || 'FAIL 12-year-old registered as worker'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'worker_age_not_allowed' then results := results || E'\n' || 'ok   12 -> cannot be worker';
    else results := results || E'\n' || ('FAIL 12 unexpected error: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  -- 13 exactly today
  perform set_config('request.jwt.claims', json_build_object('sub', u13, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.complete_onboarding('WORKER', 'Þrettán', (today - interval '13 years')::date, gardabaer);
    results := results || E'\n' || 'ok   13 (birthday today) -> worker allowed';
  exception when others then
    results := results || E'\n' || ('FAIL 13 rejected: ' || sqlerrm); failures := failures + 1;
  end;

  -- second onboarding for same user must fail
  begin
    perform public.complete_onboarding('CUSTOMER', 'Aftur', (today - interval '40 years')::date, gardabaer);
    results := results || E'\n' || 'FAIL user could onboard twice / switch role'; failures := failures + 1;
  exception when others then
    results := results || E'\n' || ('ok   cannot onboard twice (' || sqlerrm || ')');
  end;

  -- privilege checks on own row
  begin
    execute 'update public.profiles set role = ''ADMIN'' where id = auth.uid()';
    results := results || E'\n' || 'FAIL worker changed own role'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   cannot change own role';
  end;

  begin
    execute 'update public.profiles set date_of_birth = ''2000-01-01'' where id = auth.uid()';
    results := results || E'\n' || 'FAIL worker changed own DOB'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   cannot change own date_of_birth';
  end;

  begin
    execute 'update public.profiles set verification_status = ''VERIFIED'' where id = auth.uid()';
    results := results || E'\n' || 'FAIL worker self-verified'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   cannot self-verify';
  end;

  update public.profiles set first_name = 'Þrettán B' where id = auth.uid();
  get diagnostics n = row_count;
  if n = 1 then results := results || E'\n' || 'ok   can update own first_name';
  else results := results || E'\n' || 'FAIL could not update own first_name'; failures := failures + 1; end if;

  begin
    insert into public.profiles (id, role, first_name, date_of_birth, municipality_id)
    values (u12, 'WORKER', 'Laumu', (today - interval '15 years')::date, gardabaer);
    results := results || E'\n' || 'FAIL direct insert into profiles allowed'; failures := failures + 1;
  exception when insufficient_privilege then
    results := results || E'\n' || 'ok   no direct insert into profiles';
  end;
  execute 'reset role';

  -- 17
  perform set_config('request.jwt.claims', json_build_object('sub', u17, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.complete_onboarding('WORKER', 'Sautján', (today - interval '17 years 364 days')::date, gardabaer);
    results := results || E'\n' || 'ok   17 -> worker allowed';
  exception when others then
    results := results || E'\n' || ('FAIL 17 rejected: ' || sqlerrm); failures := failures + 1;
  end;

  -- 17 cannot see the 13-year-old's row, nor modify it
  select count(*) into n from public.profiles;
  if n = 1 then results := results || E'\n' || 'ok   user sees only own profile row';
  else results := results || E'\n' || ('FAIL user sees ' || n || ' profile rows'); failures := failures + 1; end if;

  update public.profiles set first_name = 'Hakk' where id = u13;
  get diagnostics n = row_count;
  if n = 0 then results := results || E'\n' || 'ok   cannot modify another user''s profile';
  else results := results || E'\n' || 'FAIL modified another user''s profile'; failures := failures + 1; end if;
  execute 'reset role';

  -- 18 today as worker
  perform set_config('request.jwt.claims', json_build_object('sub', u18, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.complete_onboarding('WORKER', 'Átján', (today - interval '18 years')::date, gardabaer);
    results := results || E'\n' || 'FAIL 18-year-old registered as worker'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'worker_age_not_allowed' then results := results || E'\n' || 'ok   18 -> cannot be worker';
    else results := results || E'\n' || ('FAIL 18 unexpected error: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  -- 17-year-old customer
  perform set_config('request.jwt.claims', json_build_object('sub', c17, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.complete_onboarding('CUSTOMER', 'Ungur', (today - interval '17 years')::date, gardabaer);
    results := results || E'\n' || 'FAIL minor registered as customer'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'customer_age_not_allowed' then results := results || E'\n' || 'ok   17 -> cannot be customer';
    else results := results || E'\n' || ('FAIL c17 unexpected error: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  -- adult customer
  perform set_config('request.jwt.claims', json_build_object('sub', c30, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.complete_onboarding('CUSTOMER', 'Dagur', (today - interval '30 years')::date, gardabaer);
    results := results || E'\n' || 'ok   adult -> customer allowed';
  exception when others then
    results := results || E'\n' || ('FAIL adult customer rejected: ' || sqlerrm); failures := failures + 1;
  end;
  execute 'reset role';

  -- self-assign ADMIN
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.complete_onboarding('ADMIN', 'Stjóri', (today - interval '30 years')::date, gardabaer);
    results := results || E'\n' || 'FAIL self-assigned ADMIN'; failures := failures + 1;
  exception when others then
    if sqlerrm = 'invalid_role' then results := results || E'\n' || 'ok   cannot self-assign ADMIN';
    else results := results || E'\n' || ('FAIL admin unexpected error: ' || sqlerrm); failures := failures + 1; end if;
  end;
  execute 'reset role';

  ---------------------------------------------------------------- admin read
  update public.profiles set role = 'ADMIN' where id = c30;  -- as postgres (team action)
  perform set_config('request.jwt.claims', json_build_object('sub', c30, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.profiles where id in (u13, u17, c30);
  if n = 3 then results := results || E'\n' || 'ok   admin can read all profiles';
  else results := results || E'\n' || ('FAIL admin sees ' || n); failures := failures + 1; end if;
  execute 'reset role';

  update public.profiles set suspended_at = now() where id = c30;
  execute 'set local role authenticated';
  select count(*) into n from public.profiles where id in (u13, u17, c30);
  if n = 1 then results := results || E'\n' || 'ok   suspended admin loses admin access';
  else results := results || E'\n' || ('FAIL suspended admin sees ' || n); failures := failures + 1; end if;
  execute 'reset role';

  if failures = 0 then
    raise exception E'ALL PASSED (% checks, rolled back)\n%', array_length(regexp_split_to_array(btrim(results, E'\n'), E'\n'), 1), results;
  else
    raise exception E'FAILED: % of % checks\n%', failures, array_length(regexp_split_to_array(btrim(results, E'\n'), E'\n'), 1), results;
  end if;
end
$test$;
