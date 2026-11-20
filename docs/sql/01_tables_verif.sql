-- Vérification après exécution de 01_tables.sql (projet lespetitspas)

-- 1. Les 5 tables existent, RLS activée (rowsecurity = true partout)
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'children', 'family_members', 'events', 'messages')
order by tablename;

-- 2. Contraintes créées (check, clés étrangères, unicité)
select conrelid::regclass as table_name, conname, contype
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in ('profiles', 'children', 'family_members', 'events', 'messages')
order by 1, 2;
