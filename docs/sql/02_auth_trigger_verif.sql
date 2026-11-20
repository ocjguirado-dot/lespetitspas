-- Vérification après exécution de 02_auth_trigger.sql (projet lespetitspas)
-- Attendu : 1 ligne, trigger activé (tgenabled = 'O'),
-- fonction security definer (prosecdef = true), search_path vide.
select t.tgname,
       t.tgenabled,
       p.proname,
       p.prosecdef,
       p.proconfig
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'auth.users'::regclass
  and not t.tgisinternal
  and t.tgname = 'on_auth_user_created';
