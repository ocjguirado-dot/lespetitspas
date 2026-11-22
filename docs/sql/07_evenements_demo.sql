-- =====================================================================
-- Les Petits Pas - Phase 5, US-10 : événements de démonstration FICTIFS
-- Cible : projet Supabase `lespetitspas` (local + staging) UNIQUEMENT.
--         Ne JAMAIS l'exécuter sur `lespetitspas-prod`.
-- Prérequis : 04_donnees_test.sql a été exécuté (30 enfants, compte staff).
-- Contenu : 18 événements fictifs avec des heures différentes,
--   aujourd'hui et hier (date et heures de Paris), pour Léa Durand,
--   Hugo Durand et Jade Moreau, couvrant les 5 types et les 3 gravités.
-- Ne modifie ni la structure, ni la RLS, ni les 9 événements existants.
-- Chaque ligne porte details.source = 'demo07' (repérage et nettoyage).
-- Non rejouable : le script s'arrête si ces événements existent déjà.
-- Nettoyage éventuel (SQL Editor uniquement) :
--   delete from public.events where details ->> 'source' = 'demo07';
-- =====================================================================
do $$
declare
  v_staff uuid;
  v_today date := (now() at time zone 'Europe/Paris')::date;
  v_yday  date := (now() at time zone 'Europe/Paris')::date - 1;
begin
  select id into v_staff from public.profiles
   where email = 'oc.jguirado+staff@gmail.com' and role = 'staff';
  if v_staff is null then
    raise exception 'Compte staff introuvable : exécute d''abord 04_donnees_test.sql.';
  end if;
  if exists (select 1 from public.events where details ->> 'source' = 'demo07') then
    raise exception 'Événements de démonstration déjà présents : script non rejouable.';
  end if;

  insert into public.events (child_id, author_id, type, details, note, created_at)
  select c.id, v_staff, e.type, e.details::jsonb || '{"source":"demo07"}'::jsonb, e.note,
         ((case when e.jour = 0 then v_today else v_yday end) + e.heure::time)
           at time zone 'Europe/Paris'
  from (values
    -- Léa Durand, aujourd'hui (7 événements)
    ('Léa','Durand', 0,'08:30','repas','{"moment":"matin","qualite":"tout"}','Petit-déjeuner terminé'),
    ('Léa','Durand', 0,'09:45','activite','{"nom":"Éveil musical"}','A tapé en rythme (fictif)'),
    ('Léa','Durand', 0,'11:05','sieste','{"debut":"10:00","fin":"11:00","qualite":"calme"}',null),
    ('Léa','Durand', 0,'12:00','medicament','{"nom":"Sirop fictif","dose":"5 ml","heure":"12:00","autorisation_confirmee":true}','Médicament fictif de test'),
    ('Léa','Durand', 0,'12:30','repas','{"moment":"midi","qualite":"moitie"}',null),
    ('Léa','Durand', 0,'14:45','sieste','{"debut":"13:15","fin":"14:40","qualite":"agitee"}','Réveils fréquents (fictif)'),
    ('Léa','Durand', 0,'16:10','repas','{"moment":"gouter","qualite":"tout"}',null),
    -- Léa Durand, hier (3 événements)
    ('Léa','Durand', 1,'12:10','repas','{"moment":"midi","qualite":"tout"}',null),
    ('Léa','Durand', 1,'14:30','sieste','{"debut":"13:00","fin":"14:20","qualite":"calme"}',null),
    ('Léa','Durand', 1,'15:50','incident','{"type":"chute","gravite":"leger"}','Petite chute sans gravité (fictif)'),
    -- Hugo Durand, aujourd'hui (3 événements)
    ('Hugo','Durand', 0,'09:30','activite','{"nom":"Peinture"}','A adoré (fictif)'),
    ('Hugo','Durand', 0,'11:50','incident','{"type":"fievre","gravite":"modere"}','Température élevée, parents prévenus (fictif)'),
    ('Hugo','Durand', 0,'12:20','repas','{"moment":"midi","qualite":"peu"}',null),
    -- Hugo Durand, hier (2 événements)
    ('Hugo','Durand', 1,'12:15','repas','{"moment":"midi","qualite":"tout"}',null),
    ('Hugo','Durand', 1,'15:30','repas','{"moment":"gouter","qualite":"moitie"}',null),
    -- Jade Moreau, aujourd'hui (2 événements)
    ('Jade','Moreau', 0,'10:15','sieste','{"debut":"09:30","fin":"10:10","qualite":"reveil_precoce"}',null),
    ('Jade','Moreau', 0,'12:30','repas','{"moment":"midi","qualite":"tout"}',null),
    -- Jade Moreau, hier (1 événement, gravité maximale pour tester le badge)
    ('Jade','Moreau', 1,'16:00','incident','{"type":"morsure","gravite":"urgent"}','Simulation de gravité maximale (fictif)')
  ) as e(fn, ln, jour, heure, type, details, note)
  join public.children c on c.first_name = e.fn and c.last_name = e.ln;
end;
$$;

-- Contrôle (attendu, en comptant les 9 événements de 04 créés le jour de son exécution : Léa 10 aujourd'hui et 3 hier ; Hugo 5 et 2 ; Jade 4 et 1 ; 27 événements au total)
select c.first_name || ' ' || c.last_name as enfant,
       count(*) filter (where (e.created_at at time zone 'Europe/Paris')::date =
                              (now() at time zone 'Europe/Paris')::date)     as aujourdhui,
       count(*) filter (where (e.created_at at time zone 'Europe/Paris')::date =
                              (now() at time zone 'Europe/Paris')::date - 1) as hier,
       count(*)                                                            as total
from public.events e
join public.children c on c.id = e.child_id
where c.first_name in ('Léa', 'Hugo', 'Jade')
group by c.first_name, c.last_name
order by c.first_name;
