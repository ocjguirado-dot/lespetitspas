-- =====================================================================
-- Les Petits Pas - US-33 : installation initiale sur `lespetitspas-prod`
-- Cible : projet Supabase `lespetitspas-prod` UNIQUEMENT (base vide).
-- Contenu : 01 tables, 02 trigger, 03 RLS, 06 RLS auteurs, 06 grants service_role,
--           08 grants invitation, 09 evening_books. AUCUNE donnee de test (04, 05, 07 exclus).
-- Garde : le script s'arrete si public.profiles existe deja.
-- Execution : une seule requete (transaction implicite) ; en cas d'erreur, rien n'est cree.
-- Fichiers sources : concatenes a l'identique ; modifier les sources, puis regenerer ce fichier.
-- =====================================================================
do $$
begin
  if to_regclass('public.profiles') is not null then
    raise exception 'public.profiles existe deja : ce script est reserve a une base vide.';
  end if;
end $$;


-- ############ 01_tables.sql ############
-- =====================================================================
-- Les Petits Pas - Phase 4, Étape 2 : création des tables
-- Cible : `lespetitspas` (local + staging), puis `lespetitspas-prod` via 10_prod_install.sql (US-33).
-- Contenu : 5 tables, contraintes, index, RLS activée (sans politique).
-- Hors périmètre ici : trigger de profil (Étape 3), politiques RLS (Étape 4),
-- données de test (Étape 5).
-- =====================================================================

-- 1. profiles : un profil par compte (créé par un trigger à l'Étape 3)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('staff', 'parent')),
  first_name  text,
  last_name   text,
  email       text,
  created_at  timestamptz not null default now()
);

-- 2. children : les enfants de la crèche
create table public.children (
  id                     uuid primary key default gen_random_uuid(),
  first_name             text not null,
  last_name              text not null,
  section                text not null check (section in ('bebes', 'moyens', 'grands')),
  allergies              text,
  medication_authorized  boolean not null default false,
  photo_url              text,
  created_at             timestamptz not null default now()
);

-- 3. family_members : lien parent <-> enfant (option A)
--    parent_email est renseigné par script SQL ; parent_id est rempli à la
--    première connexion du parent (trigger de l'Étape 3).
create table public.family_members (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children (id) on delete cascade,
  parent_email  text not null check (parent_email = lower(parent_email)),
  parent_id     uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint family_members_child_email_key unique (child_id, parent_email)
);

-- 4. events : tous les événements de la journée, 5 types dans une seule table
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id) on delete cascade,
  author_id   uuid not null references public.profiles (id),
  type        text not null check (type in ('repas', 'sieste', 'activite', 'incident', 'medicament')),
  details     jsonb not null default '{}'::jsonb,
  note        text,
  created_at  timestamptz not null default now(),
  constraint events_details_valid check (
    (type = 'repas'
      and details ->> 'moment'  in ('matin', 'midi', 'gouter')
      and details ->> 'qualite' in ('tout', 'moitie', 'peu', 'rien'))
    or
    (type = 'sieste'
      and details ->> 'debut' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and details ->> 'fin'   ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and details ->> 'fin' > details ->> 'debut'
      and details ->> 'qualite' in ('calme', 'agitee', 'reveil_precoce'))
    or
    (type = 'activite'
      and length(trim(coalesce(details ->> 'nom', ''))) > 0)
    or
    (type = 'incident'
      and details ->> 'type'    in ('chute', 'morsure', 'fievre', 'autre')
      and details ->> 'gravite' in ('leger', 'modere', 'urgent'))
    or
    (type = 'medicament'
      and length(trim(coalesce(details ->> 'nom', ''))) > 0
      and length(trim(coalesce(details ->> 'dose', ''))) > 0
      and details ->> 'heure' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and details ->> 'autorisation_confirmee' = 'true')
  )
);

-- 5. messages : messages parent -> équipe
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id) on delete cascade,
  author_id   uuid not null references public.profiles (id),
  body        text not null check (char_length(body) between 1 and 500),
  status      text not null default 'nouveau' check (status in ('nouveau', 'lu', 'traite')),
  created_at  timestamptz not null default now()
);

-- Index utiles (timeline par enfant, messages par statut, lien parent)
create index events_child_created_idx    on public.events (child_id, created_at desc);
create index messages_child_idx          on public.messages (child_id);
create index messages_status_created_idx on public.messages (status, created_at desc);
create index family_members_parent_idx   on public.family_members (parent_id);
create index family_members_email_idx    on public.family_members (parent_email);

-- RLS activée sur toutes les tables. Sans politique, personne ne peut lire
-- ni écrire via l'API : c'est voulu, les politiques arrivent à l'Étape 4.
alter table public.profiles       enable row level security;
alter table public.children       enable row level security;
alter table public.family_members enable row level security;
alter table public.events         enable row level security;
alter table public.messages       enable row level security;


-- ############ 02_auth_trigger.sql ############
-- =====================================================================
-- Les Petits Pas - Phase 4, Étape 3 : trigger de création du profil
-- Cible : `lespetitspas` (local + staging), puis `lespetitspas-prod` via 10_prod_install.sql (US-33).
-- Règles :
--  * Tout nouveau compte reçoit TOUJOURS le rôle 'parent' (jamais lu depuis
--    les métadonnées envoyées par l'utilisateur : sinon, élévation de droits).
--  * Le rôle 'staff' ne s'attribue que par script SQL (Étape 5).
--  * Le trigger rattache le parent à ses enfants via family_members.parent_email.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, email, first_name, last_name)
  values (
    new.id,
    'parent',
    lower(new.email),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );

  update public.family_members
     set parent_id = new.id
   where parent_email = lower(new.email)
     and parent_id is null;

  return new;
end;
$$;

-- La fonction ne doit pas être appelable par les clients de l'API
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ############ 03_rls.sql ############
-- =====================================================================
-- Les Petits Pas - Phase 4, Étape 4 : politiques RLS + droits d'accès
-- Cible : `lespetitspas` (local + staging), puis `lespetitspas-prod` via 10_prod_install.sql (US-33).
-- Décisions validées le 20/11/2026 :
--   * events : le staff peut créer, jamais modifier ni supprimer
--   * profiles : le parent peut modifier prénom et nom, pas rôle ni email
-- =====================================================================

-- 1) Fonctions utilitaires (SECURITY DEFINER pour éviter la récursion RLS)
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
     where id = (select auth.uid()) and role = 'staff'
  );
$$;

create or replace function public.is_parent_of(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members
     where child_id = p_child_id and parent_id = (select auth.uid())
  );
$$;

revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_parent_of(uuid) from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_parent_of(uuid) to authenticated;

-- 2) Droits d'accès à l'API : on repart de zéro, puis on accorde le strict nécessaire
revoke all on public.profiles, public.children, public.family_members,
              public.events, public.messages from anon, authenticated;

grant select on public.profiles, public.children, public.family_members,
                public.events, public.messages to authenticated;
grant update (first_name, last_name) on public.profiles to authenticated;
grant insert, update on public.children to authenticated;
grant insert on public.events to authenticated;
grant insert on public.messages to authenticated;
grant update (status) on public.messages to authenticated;

-- 3) Politiques (aucune pour anon : un utilisateur non connecté n'a accès à rien)

-- profiles
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_select_staff on public.profiles
  for select to authenticated using (public.is_staff());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- children
create policy children_select_staff on public.children
  for select to authenticated using (public.is_staff());
create policy children_select_parent on public.children
  for select to authenticated using (public.is_parent_of(id));
create policy children_insert_staff on public.children
  for insert to authenticated with check (public.is_staff());
create policy children_update_staff on public.children
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- family_members (lecture seule côté client ; écriture par SQL / serveur)
create policy family_select_own on public.family_members
  for select to authenticated using (parent_id = (select auth.uid()));
create policy family_select_staff on public.family_members
  for select to authenticated using (public.is_staff());

-- events (création par le staff uniquement ; ni modification ni suppression)
create policy events_select_staff on public.events
  for select to authenticated using (public.is_staff());
create policy events_select_parent on public.events
  for select to authenticated using (public.is_parent_of(child_id));
create policy events_insert_staff on public.events
  for insert to authenticated
  with check (
    public.is_staff()
    and author_id = (select auth.uid())
    and (
      type <> 'medicament'
      or exists (
        select 1 from public.children c
         where c.id = child_id and c.medication_authorized
      )
    )
  );

-- messages
create policy messages_select_staff on public.messages
  for select to authenticated using (public.is_staff());
create policy messages_select_parent on public.messages
  for select to authenticated using (public.is_parent_of(child_id));
create policy messages_insert_parent on public.messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_parent_of(child_id)
    and status = 'nouveau'
  );
create policy messages_update_staff on public.messages
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());


-- ############ 06_rls_auteurs.sql ############
-- =====================================================================
-- Les Petits Pas - Phase 4 : correctif RLS (US-31)
-- Critère du backlog : « le prénom de l'auteur d'un événement reste lisible par un parent ».
-- Constat : avec 03_rls.sql, un parent ne lit que son propre profil.
-- Correctif : un utilisateur connecté peut lire le profil d'un auteur d'événement
-- seulement si cet événement lui est visible (donc, pour un parent, concernant ses enfants).
-- Cible : `lespetitspas` (local + staging), puis `lespetitspas-prod` via 10_prod_install.sql (US-33).
-- =====================================================================
create policy profiles_select_event_authors on public.profiles
  for select to authenticated
  using (
    exists (select 1 from public.events e where e.author_id = profiles.id)
  );


-- ############ 06_grants_service_role.sql ############
-- docs/sql/06_grants_service_role.sql
-- Lot 7A : la notification équipe lit les emails du staff côté serveur uniquement.
-- Droit minimal : lecture seule de profiles. Aucun droit d'écriture, aucune autre table.
-- À rejouer à l'identique sur lespetitspas-prod à US-33.
grant select on table public.profiles to service_role;


-- ############ 08_grants_invitation.sql ############
-- Les Petits Pas — droits minimaux utilisés par l'invitation serveur.
-- À relire puis exécuter manuellement sur le projet Supabase cible.
-- Ce script n'a pas été exécuté dans le cadre de l'implémentation.

revoke all on public.family_members from service_role;
grant select, insert, delete on public.family_members to service_role;


-- ############ 09_evening_books.sql ############
-- Les Petits Pas — bonus « Livre du soir ».
-- Cible : `lespetitspas` (local + staging), puis `lespetitspas-prod` via 10_prod_install.sql (US-33).

create table if not exists public.evening_books (
  id uuid primary key default gen_random_uuid(),
  suggestion_date date not null unique,
  title text not null check (char_length(title) between 1 and 200),
  author text,
  cover_url text,
  open_library_key text not null,
  created_at timestamptz not null default now()
);

alter table public.evening_books enable row level security;

drop policy if exists evening_books_select_authenticated on public.evening_books;
create policy evening_books_select_authenticated on public.evening_books
  for select to authenticated using (true);

revoke all on public.evening_books from anon, authenticated, service_role;
grant select on public.evening_books to authenticated;
grant select, insert on public.evening_books to service_role;

