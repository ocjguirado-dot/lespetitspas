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
