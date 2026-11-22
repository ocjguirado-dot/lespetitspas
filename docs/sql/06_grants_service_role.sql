-- docs/sql/06_grants_service_role.sql
-- Lot 7A : la notification équipe lit les emails du staff côté serveur uniquement.
-- Droit minimal : lecture seule de profiles. Aucun droit d'écriture, aucune autre table.
-- À rejouer à l'identique sur lespetitspas-prod à US-33.
grant select on table public.profiles to service_role;
