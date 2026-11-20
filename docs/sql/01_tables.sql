-- =====================================================================
-- Les Petits Pas - Phase 4, Étape 2 : création des tables
-- Cible : projet Supabase `lespetitspas` (local + staging) UNIQUEMENT.
-- Ne pas exécuter sur `lespetitspas-prod` pour l'instant.
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
