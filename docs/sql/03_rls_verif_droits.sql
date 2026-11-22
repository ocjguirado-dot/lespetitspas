-- Requête B : droits par table. Attendu : AUCUNE ligne pour anon ;
-- pour authenticated : events = INSERT + SELECT seulement (pas d'UPDATE/DELETE),
-- family_members = SELECT seulement, aucun DELETE nulle part.
select grantee, table_name, string_agg(privilege_type, ', ' order by privilege_type) as droits
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles','children','family_members','events','messages')
  and grantee in ('anon','authenticated')
group by grantee, table_name
order by grantee, table_name;
