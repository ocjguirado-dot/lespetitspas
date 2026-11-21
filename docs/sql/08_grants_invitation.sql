-- Les Petits Pas — droits minimaux utilisés par l'invitation serveur.
-- À relire puis exécuter manuellement sur le projet Supabase cible.
-- Ce script n'a pas été exécuté dans le cadre de l'implémentation.

revoke all on public.family_members from service_role;
grant select, insert, delete on public.family_members to service_role;
