-- =====================================================================
-- Les Petits Pas - Phase 4, Étape 5 : tests d'isolation (RLS)
-- Cible : projet Supabase `lespetitspas` UNIQUEMENT. À lancer après 04_donnees_test.sql et 06_rls_auteurs.sql.
-- Chaque test se place dans la peau d'un utilisateur (non connecté, parent 1,
-- parent 2, staff) et compare le résultat attendu au résultat observé.
-- Les écritures de test sont annulées en fin de script. Une seule table de résultats est affichée.
-- =====================================================================
drop table if exists pg_temp.resultats;
create temp table resultats (id text, test text, attendu text, observe text, statut text);

do $$
declare
  v_staff uuid; v_p1 uuid; v_p2 uuid;
  v_lea uuid; v_hugo uuid; v_jade uuid;
  n bigint; e bigint; obs text;
begin
  select id into v_staff from public.profiles where email = 'oc.jguirado+staff@gmail.com';
  select id into v_p1    from public.profiles where email = 'oc.jguirado+parent1@gmail.com';
  select id into v_p2    from public.profiles where email = 'oc.jguirado+parent2@gmail.com';
  select id into v_lea   from public.children where first_name = 'Léa'  and last_name = 'Durand';
  select id into v_hugo  from public.children where first_name = 'Hugo' and last_name = 'Durand';
  select id into v_jade  from public.children where first_name = 'Jade' and last_name = 'Moreau';
  if v_staff is null or v_p1 is null or v_p2 is null or v_lea is null or v_hugo is null or v_jade is null then
    raise exception 'Comptes ou données de test manquants : lance d''abord 04_donnees_test.sql.';
  end if;

  -- Contrôles de configuration (exécutés en tant qu''administrateur)
  insert into resultats values ('C-01', 'Trigger : profils créés pour les 3 comptes', '3',
    (select count(*)::text from public.profiles), case when (select count(*) from public.profiles) = 3 then 'OK' else 'KO' end);
  insert into resultats values ('C-02', 'Trigger : liens de famille rattachés à un compte', '3',
    (select count(*)::text from public.family_members where parent_id is not null),
    case when (select count(*) from public.family_members where parent_id is not null) = 3 then 'OK' else 'KO' end);
  insert into resultats values ('C-03', 'Rôles : 1 staff et 2 parents', '1 staff / 2 parent',
    (select count(*) filter (where role = 'staff') || ' staff / ' || count(*) filter (where role = 'parent') || ' parent' from public.profiles),
    case when (select count(*) filter (where role = 'staff') from public.profiles) = 1
          and (select count(*) filter (where role = 'parent') from public.profiles) = 2 then 'OK' else 'KO' end);
  insert into resultats values ('C-04', 'La fonction du trigger n''est pas appelable par un utilisateur connecté', 'non',
    case when has_function_privilege('authenticated', 'public.handle_new_user()', 'execute') then 'oui' else 'non' end,
    case when has_function_privilege('authenticated', 'public.handle_new_user()', 'execute') then 'KO' else 'OK' end);

  -- A-01
  begin
    set local role anon;
    perform 1 from public.children;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('A-01', 'Non connecté : lecture des enfants', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- A-02
  begin
    set local role anon;
    perform 1 from public.messages;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('A-02', 'Non connecté : lecture des messages', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-01
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.children) q;
  reset role;
  insert into resultats values ('P1-01', 'Parent 1 : enfants visibles', '2', n::text, case when n = 2 then 'OK' else 'KO' end);

  -- P1-02
  select count(*) into e from (select 1 from public.events ev join public.family_members fm on fm.child_id = ev.child_id where fm.parent_id = v_p1) q;
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.events) q;
  reset role;
  insert into resultats values ('P1-02', 'Parent 1 : événements visibles (ceux de ses 2 enfants)', e::text || ' (calculé en administrateur)', n::text, case when n = e and e > 0 then 'OK' else 'KO' end);

  -- P1-03
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.events where child_id = v_jade) q;
  reset role;
  insert into resultats values ('P1-03', 'Parent 1 : événements de l''enfant d''une autre famille (Jade)', '0', n::text, case when n = 0 then 'OK' else 'KO' end);

  -- P1-04
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.children where id = v_jade) q;
  reset role;
  insert into resultats values ('P1-04', 'Parent 1 : fiche de l''enfant d''une autre famille (Jade)', '0', n::text, case when n = 0 then 'OK' else 'KO' end);

  -- P1-05
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.messages) q;
  reset role;
  insert into resultats values ('P1-05', 'Parent 1 : messages visibles', '2', n::text, case when n = 2 then 'OK' else 'KO' end);

  -- P1-06
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.family_members) q;
  reset role;
  insert into resultats values ('P1-06', 'Parent 1 : liens de famille visibles', '2', n::text, case when n = 2 then 'OK' else 'KO' end);

  -- P1-07
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.profiles) q;
  reset role;
  insert into resultats values ('P1-07', 'Parent 1 : profils visibles (le sien + auteurs des événements de ses enfants)', '2', n::text, case when n = 2 then 'OK' else 'KO' end);

  -- P1-21
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.profiles where role = 'staff' and first_name is not null) q;
  reset role;
  insert into resultats values ('P1-21', 'Parent 1 : prénom de l''auteur d''un événement lisible (staff)', '1', n::text, case when n = 1 then 'OK' else 'KO' end);

  -- P1-22
  perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.profiles where id = v_p2) q;
  reset role;
  insert into resultats values ('P1-22', 'Parent 1 : profil de l''autre parent non lisible', '0', n::text, case when n = 0 then 'OK' else 'KO' end);

  -- P2-01
  perform set_config('request.jwt.claims', json_build_object('sub', v_p2::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.children) q;
  reset role;
  insert into resultats values ('P2-01', 'Parent 2 : enfants visibles', '1', n::text, case when n = 1 then 'OK' else 'KO' end);

  -- P2-02
  select count(*) into e from (select 1 from public.events ev join public.family_members fm on fm.child_id = ev.child_id where fm.parent_id = v_p2) q;
  perform set_config('request.jwt.claims', json_build_object('sub', v_p2::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.events) q;
  reset role;
  insert into resultats values ('P2-02', 'Parent 2 : événements visibles (ceux de son enfant)', e::text || ' (calculé en administrateur)', n::text, case when n = e and e > 0 then 'OK' else 'KO' end);

  -- P2-03
  perform set_config('request.jwt.claims', json_build_object('sub', v_p2::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.events where child_id = v_lea) q;
  reset role;
  insert into resultats values ('P2-03', 'Parent 2 : événements de Léa (autre famille)', '0', n::text, case when n = 0 then 'OK' else 'KO' end);

  -- P2-04
  perform set_config('request.jwt.claims', json_build_object('sub', v_p2::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.messages) q;
  reset role;
  insert into resultats values ('P2-04', 'Parent 2 : messages visibles', '2', n::text, case when n = 2 then 'OK' else 'KO' end);

  -- P2-05
  perform set_config('request.jwt.claims', json_build_object('sub', v_p2::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.profiles) q;
  reset role;
  insert into resultats values ('P2-05', 'Parent 2 : profils visibles (le sien + auteurs des événements de son enfant)', '2', n::text, case when n = 2 then 'OK' else 'KO' end);

  -- S-01
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.children) q;
  reset role;
  insert into resultats values ('S-01', 'Staff : enfants visibles', '30', n::text, case when n = 30 then 'OK' else 'KO' end);

  -- S-02
  select count(*) into e from (select 1 from public.events) q;
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.events) q;
  reset role;
  insert into resultats values ('S-02', 'Staff : événements visibles (tous)', e::text || ' (calculé en administrateur)', n::text, case when n = e and e > 0 then 'OK' else 'KO' end);

  -- S-03
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.messages) q;
  reset role;
  insert into resultats values ('S-03', 'Staff : messages visibles', '4', n::text, case when n = 4 then 'OK' else 'KO' end);

  -- S-04
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.profiles) q;
  reset role;
  insert into resultats values ('S-04', 'Staff : profils visibles', '3', n::text, case when n = 3 then 'OK' else 'KO' end);

  -- S-05
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from (select 1 from public.family_members) q;
  reset role;
  insert into resultats values ('S-05', 'Staff : liens de famille visibles', '30', n::text, case when n = 30 then 'OK' else 'KO' end);

  -- P1-08
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profiles set role = 'staff' where id = v_p1;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-08', 'Parent 1 : se donner le rôle staff', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-09
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profiles set email = 'x@example.test' where id = v_p1;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-09', 'Parent 1 : changer son email', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-10
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.events (child_id, author_id, type, details) values (v_lea, v_p1, 'activite', '{"nom":"Test"}');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-10', 'Parent 1 : créer un événement', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-11
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.messages (child_id, author_id, body) values (v_jade, v_p1, 'TEST-ISOLATION');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-11', 'Parent 1 : message sur l''enfant d''une autre famille', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-12
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.messages (child_id, author_id, body) values (v_lea, v_p2, 'TEST-ISOLATION');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-12', 'Parent 1 : message au nom d''un autre parent', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-13
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.messages (child_id, author_id, body, status) values (v_lea, v_p1, 'TEST-ISOLATION', 'lu');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-13', 'Parent 1 : message avec un statut autre que nouveau', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-14
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.messages (child_id, author_id, body) values (v_lea, v_p1, repeat('a', 501));
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-14', 'Parent 1 : message de plus de 500 caractères', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-15
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.messages set status = 'traite' where child_id = v_lea;
    get diagnostics n = row_count;
    reset role;
    obs := n || ' ligne(s) modifiée(s)';
  exception when others then
    reset role;
    n := 0;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-15', 'Parent 1 : changer le statut d''un message', '0 ligne ou refusé', obs, case when n = 0 then 'OK' else 'KO' end);

  -- P1-16
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.children set medication_authorized = true where id = v_hugo;
    get diagnostics n = row_count;
    reset role;
    obs := n || ' ligne(s) modifiée(s)';
  exception when others then
    reset role;
    n := 0;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-16', 'Parent 1 : modifier une fiche enfant (autorisation médicament)', '0 ligne ou refusé', obs, case when n = 0 then 'OK' else 'KO' end);

  -- P1-17
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    delete from public.children where id = v_lea;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-17', 'Parent 1 : supprimer un enfant', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-18
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.family_members (child_id, parent_email) values (v_jade, 'oc.jguirado+parent1@gmail.com');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-18', 'Parent 1 : ajouter un lien de famille', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- S-06
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profiles set role = 'parent' where id = v_staff;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-06', 'Staff : se donner un autre rôle ou modifier un profil (rôle)', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- S-07
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.events set note = 'modifié' where child_id = v_lea;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-07', 'Staff : modifier un événement', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- S-08
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    delete from public.events where child_id = v_lea;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-08', 'Staff : supprimer un événement', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- S-09
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.family_members (child_id, parent_email) values (v_jade, 'x@example.test');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-09', 'Staff : ajouter un lien de famille', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- S-10
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.messages set body = 'modifié' where child_id = v_lea;
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-10', 'Staff : modifier le texte d''un message', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- S-11
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.events (child_id, author_id, type, details) values (v_lea, v_p1, 'activite', '{"nom":"Test"}');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-11', 'Staff : événement au nom d''un autre auteur', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- S-12
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.events (child_id, author_id, type, details) values (v_hugo, v_staff, 'medicament', '{"nom":"X","dose":"1","heure":"10:00","autorisation_confirmee":"true"}');
    reset role;
    obs := 'autorisé (anormal)';
  exception when others then
    reset role;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-12', 'Staff : médicament pour un enfant NON autorisé (Hugo)', 'refusé', obs, case when obs like 'refus%' then 'OK' else 'KO' end);

  -- P1-19
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.profiles set first_name = 'Parent' where id = v_p1;
    get diagnostics n = row_count;
    reset role;
    obs := n || ' ligne(s)';
  exception when others then
    reset role;
    n := -1;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-19', 'Parent 1 : modifier son prénom', '1 ligne', obs, case when n = 1 then 'OK' else 'KO' end);

  -- P1-20
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_p1::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.messages (child_id, author_id, body) values (v_lea, v_p1, 'TEST-ISOLATION');
    get diagnostics n = row_count;
    reset role;
    obs := n || ' ligne(s)';
  exception when others then
    reset role;
    n := -1;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('P1-20', 'Parent 1 : message valide sur son enfant', '1 ligne', obs, case when n = 1 then 'OK' else 'KO' end);

  -- S-13
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.events (child_id, author_id, type, details, note) values (v_lea, v_staff, 'activite', '{"nom":"Test"}', 'TEST-ISOLATION');
    get diagnostics n = row_count;
    reset role;
    obs := n || ' ligne(s)';
  exception when others then
    reset role;
    n := -1;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-13', 'Staff : événement valide', '1 ligne', obs, case when n = 1 then 'OK' else 'KO' end);

  -- S-14
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.events (child_id, author_id, type, details, note) values (v_lea, v_staff, 'medicament', '{"nom":"X","dose":"1","heure":"10:00","autorisation_confirmee":"true"}', 'TEST-ISOLATION');
    get diagnostics n = row_count;
    reset role;
    obs := n || ' ligne(s)';
  exception when others then
    reset role;
    n := -1;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-14', 'Staff : médicament pour un enfant autorisé (Léa)', '1 ligne', obs, case when n = 1 then 'OK' else 'KO' end);

  -- S-15
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.messages set status = 'lu' where body = 'Jade arrivera un peu plus tard demain.';
    get diagnostics n = row_count;
    reset role;
    obs := n || ' ligne(s)';
  exception when others then
    reset role;
    n := -1;
    obs := 'refusé (' || sqlstate || ')';
  end;
  insert into resultats values ('S-15', 'Staff : changer le statut d''un message', '1 ligne', obs, case when n = 1 then 'OK' else 'KO' end);

  -- Nettoyage des écritures de test (en tant qu''administrateur)
  delete from public.messages where body = 'TEST-ISOLATION';
  delete from public.events where note = 'TEST-ISOLATION';
  update public.messages set status = 'nouveau' where body = 'Jade arrivera un peu plus tard demain.';
  update public.profiles set first_name = 'Parent' where id = v_p1;
end;
$$;

select id, test, attendu, observe, statut from pg_temp.resultats
union all
select 'ZZ-BILAN', 'Nombre de tests en échec (KO)', '0',
       count(*) filter (where statut = 'KO')::text,
       case when count(*) filter (where statut = 'KO') = 0 then 'OK' else 'KO' end
from pg_temp.resultats
order by 1;
