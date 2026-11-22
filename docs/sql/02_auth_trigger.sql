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
