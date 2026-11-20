-- =====================================================================
-- Les Petits Pas - Phase 4 : correctif RLS (US-31)
-- Critère du backlog : « le prénom de l'auteur d'un événement reste lisible par un parent ».
-- Constat : avec 03_rls.sql, un parent ne lit que son propre profil.
-- Correctif : un utilisateur connecté peut lire le profil d'un auteur d'événement
-- seulement si cet événement lui est visible (donc, pour un parent, concernant ses enfants).
-- Cible : projet Supabase `lespetitspas` UNIQUEMENT.
-- =====================================================================
create policy profiles_select_event_authors on public.profiles
  for select to authenticated
  using (
    exists (select 1 from public.events e where e.author_id = profiles.id)
  );
