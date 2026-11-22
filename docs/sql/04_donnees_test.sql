-- =====================================================================
-- Les Petits Pas - Phase 4, Étape 5 : comptes de test + données FICTIVES
-- Cible : projet Supabase `lespetitspas` (local + staging) UNIQUEMENT.
-- Prérequis : les 3 utilisateurs existent (Authentication > Users > Add user) :
--   oc.jguirado+staff@gmail.com, oc.jguirado+parent1@gmail.com, oc.jguirado+parent2@gmail.com
-- Contenu : staff promu, 30 enfants fictifs (3 sections x 10), familles,
--   événements et messages d'exemple. Aucune donnée réelle.
--   Parent 1 : 2 enfants (Léa et Hugo Durand). Parent 2 : 1 enfant (Jade Moreau).
--   Les 27 autres enfants sont rattachés à des familles fictives sans compte.
-- Non rejouable : le script s'arrête si des enfants existent déjà.
-- =====================================================================
do $$
declare
  v_staff uuid; v_p1 uuid; v_p2 uuid;
begin
  select id into v_staff from public.profiles where email = 'oc.jguirado+staff@gmail.com';
  select id into v_p1    from public.profiles where email = 'oc.jguirado+parent1@gmail.com';
  select id into v_p2    from public.profiles where email = 'oc.jguirado+parent2@gmail.com';

  if v_staff is null or v_p1 is null or v_p2 is null then
    raise exception 'Comptes de test manquants (ou profil non créé par le trigger). Crée les 3 utilisateurs avant ce script.';
  end if;
  if exists (select 1 from public.children) then
    raise exception 'Des enfants existent déjà : script non rejouable. Vérifie avant de continuer.';
  end if;

  -- Seul moyen d'obtenir le rôle staff : SQL (jamais depuis l'application)
  update public.profiles set role = 'staff', first_name = 'Équipe',  last_name = 'Test' where id = v_staff;
  update public.profiles set first_name = 'Parent', last_name = 'Un'   where id = v_p1;
  update public.profiles set first_name = 'Parent', last_name = 'Deux' where id = v_p2;

  -- 30 enfants fictifs et leurs familles
  with src(n, first_name, last_name, section, allergies, med, email) as (values
    ( 1,'Léa','Durand','bebes',null,true,'oc.jguirado+parent1@gmail.com'),
    ( 2,'Jade','Moreau','bebes','Arachides (fictif)',false,'oc.jguirado+parent2@gmail.com'),
    ( 3,'Louis','Bernard','bebes',null,false,'famille03@example.test'),
    ( 4,'Chloé','Petit','bebes','Lait de vache (fictif)',true,'famille04@example.test'),
    ( 5,'Nathan','Robert','bebes',null,false,'famille05@example.test'),
    ( 6,'Manon','Richard','bebes',null,false,'famille06@example.test'),
    ( 7,'Ethan','Dubois','bebes',null,false,'famille07@example.test'),
    ( 8,'Inès','Laurent','bebes',null,false,'famille08@example.test'),
    ( 9,'Tom','Simon','bebes',null,false,'famille09@example.test'),
    (10,'Zoé','Michel','bebes',null,false,'famille10@example.test'),
    (11,'Hugo','Durand','moyens',null,false,'oc.jguirado+parent1@gmail.com'),
    (12,'Emma','Lefebvre','moyens',null,false,'famille12@example.test'),
    (13,'Lucas','Garcia','moyens',null,false,'famille13@example.test'),
    (14,'Alice','Roux','moyens',null,false,'famille14@example.test'),
    (15,'Noah','Fournier','moyens','Oeuf (fictif)',true,'famille15@example.test'),
    (16,'Louise','Girard','moyens',null,false,'famille16@example.test'),
    (17,'Gabriel','Bonnet','moyens',null,false,'famille17@example.test'),
    (18,'Mila','Lambert','moyens',null,false,'famille18@example.test'),
    (19,'Arthur','Faure','moyens',null,false,'famille19@example.test'),
    (20,'Rose','Mercier','moyens',null,false,'famille20@example.test'),
    (21,'Jules','Blanc','grands',null,false,'famille21@example.test'),
    (22,'Eva','Guérin','grands',null,false,'famille22@example.test'),
    (23,'Adam','Muller','grands',null,false,'famille23@example.test'),
    (24,'Lina','Henry','grands',null,false,'famille24@example.test'),
    (25,'Théo','Perrin','grands',null,false,'famille25@example.test'),
    (26,'Anna','Morin','grands',null,false,'famille26@example.test'),
    (27,'Léo','Clément','grands',null,false,'famille27@example.test'),
    (28,'Sarah','Gauthier','grands',null,false,'famille28@example.test'),
    (29,'Paul','Chevalier','grands',null,false,'famille29@example.test'),
    (30,'Clara','François','grands',null,false,'famille30@example.test')
  ),
  ins as (
    insert into public.children (first_name, last_name, section, allergies, medication_authorized)
    select first_name, last_name, section, allergies, med from src order by n
    returning id, first_name, last_name
  )
  insert into public.family_members (child_id, parent_email, parent_id)
  select ins.id, src.email, p.id
  from ins
  join src on src.first_name = ins.first_name and src.last_name = ins.last_name
  left join public.profiles p on p.email = src.email;

  -- Événements d'exemple (auteur : le compte staff)
  insert into public.events (child_id, author_id, type, details, note)
  select c.id, v_staff, e.type, e.details::jsonb, e.note
  from (values
    ('Léa','Durand','repas','{"moment":"midi","qualite":"tout"}','Bon appétit'),
    ('Léa','Durand','sieste','{"debut":"13:00","fin":"14:30","qualite":"calme"}',null),
    ('Léa','Durand','medicament','{"nom":"Sirop fictif","dose":"5 ml","heure":"12:00","autorisation_confirmee":true}','Médicament fictif de test'),
    ('Hugo','Durand','activite','{"nom":"Peinture"}','A adoré'),
    ('Hugo','Durand','incident','{"type":"chute","gravite":"leger"}','Chute sans gravité (fictif)'),
    ('Jade','Moreau','repas','{"moment":"gouter","qualite":"moitie"}',null),
    ('Jade','Moreau','sieste','{"debut":"13:15","fin":"14:45","qualite":"agitee"}',null),
    ('Louis','Bernard','repas','{"moment":"midi","qualite":"peu"}',null),
    ('Louis','Bernard','activite','{"nom":"Motricité"}',null)
  ) as e(fn, ln, type, details, note)
  join public.children c on c.first_name = e.fn and c.last_name = e.ln;

  -- Messages d'exemple (parent -> équipe)
  insert into public.messages (child_id, author_id, body, status)
  select c.id, m.author, m.body, m.status
  from (values
    ('Léa','Durand', v_p1, 'Bonjour, je viendrai chercher Léa à 17h aujourd''hui.', 'nouveau'),
    ('Hugo','Durand', v_p1, 'Hugo a un doudou bleu à ne pas perdre.', 'lu'),
    ('Jade','Moreau', v_p2, 'Jade arrivera un peu plus tard demain.', 'nouveau'),
    ('Jade','Moreau', v_p2, 'Merci pour la bonne journée.', 'traite')
  ) as m(fn, ln, author, body, status)
  join public.children c on c.first_name = m.fn and c.last_name = m.ln;
end;
$$;

-- Contrôle rapide (attendu : 30 / 30 / 9 / 4 / 3 liens rattachés)
select (select count(*) from public.children)       as enfants,
       (select count(*) from public.family_members) as liens_famille,
       (select count(*) from public.events)         as evenements,
       (select count(*) from public.messages)       as messages,
       (select count(*) from public.family_members where parent_id is not null) as liens_avec_compte;
