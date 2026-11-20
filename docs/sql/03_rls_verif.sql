-- Vérification après 03_rls.sql (projet lespetitspas)
-- Requête A : liste des politiques. Attendu : 16 lignes, toutes avec roles = {authenticated}.
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;
