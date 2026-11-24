# Les Petits Pas

Application web pour une crèche : l'équipe saisit la journée des enfants (repas, sieste, activité, incident, médicament), les parents la consultent et écrivent à l'équipe. Projet OpenClassrooms « Développez une application fonctionnelle grâce à la programmation agentique ».

- **Production :** https://lespetitspas-lilac.vercel.app
- **Stack :** Next.js (App Router, TypeScript), Tailwind CSS et ShadCN, Supabase (base, authentification, RLS), Resend (emails), Playwright (tests de bout en bout), Vercel (hébergement), pnpm.
- **Données :** 100 % fictives ; aucune donnée réelle d'enfant ou de famille.

## Fonctionnalités

| Rôle | Fonctionnalités |
|---|---|
| Équipe | Liste des 30 enfants avec recherche et filtre par section ; fiche enfant et timeline du jour avec sélecteur de date ; saisie de cinq types d'événements, médicament bloqué côté client et serveur si l'autorisation manque ; messages des parents avec statuts nouveau, lu, traité ; invitation et relance d'un parent par email |
| Parent | Accueil limité à ses enfants ; timeline du jour avec sélecteur de date ; messagerie vers l'équipe (500 caractères maximum) et historique ; création du mot de passe depuis le lien d'invitation |
| Bonus | « Livre du soir » : suggestion quotidienne via l'API Open Library, avec cas limites (aucun résultat, donnée manquante, délai dépassé) |

## Documentation

| Document | Contenu |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Règles de travail de l'agent IA : structure, conventions, sécurité, mise à jour du backlog |
| [`backlog.md`](backlog.md) | Product Backlog : 41 entrées (38 user stories et 3 du bonus), critères d'acceptation, statuts et preuves |
| [`docs/datamodel.md`](docs/datamodel.md) | Modèle de données (diagramme Mermaid), droits et politiques RLS |
| [`docs/featurebonus.md`](docs/featurebonus.md) | Bonus « Livre du soir » |
| [`docs/recette/cahierrecette.md`](docs/recette/cahierrecette.md) | Cahier de recette : 51 cas, résultats en staging et en production |
| [`docs/recette/bugs.md`](docs/recette/bugs.md) | Suivi des anomalies par gravité et statut |
| [`docs/recette/pvrecette.md`](docs/recette/pvrecette.md) | Procès-verbal de recette et décision Go / NoGo |
| [`docs/sql/`](docs/sql) | Scripts SQL numérotés : tables, déclencheur d'authentification, RLS, données de test, tests d'isolation, installation de la production |

## Environnements

| Environnement | Branche | Base Supabase | Accès |
|---|---|---|---|
| Local | n'importe laquelle | `lespetitspas` (ou un projet local) | `pnpm dev` |
| Staging | `staging` (Preview Vercel) | `lespetitspas` | protégé par Vercel |
| Production | `main` | `lespetitspas-prod` | public |

Le passage en production se fait par Pull Request de `staging` vers `main`.

## Installation locale

Prérequis : Node.js et pnpm.

```bash
pnpm install
cp .env.example .env.local   # puis renseigner les valeurs
pnpm dev                     # http://localhost:3000
```

### Variables d'environnement

Les valeurs de `.env.example` sont fictives et ne permettent aucun envoi. Ne jamais commiter `.env.local`.

| Variable | Rôle | Visibilité |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL de l'application (liens des emails) | publique |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Connexion Supabase côté navigateur | publiques |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur privée (invitations, notifications) | **secrète**, serveur uniquement |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envoi d'emails | **secrète** (clé), serveur uniquement |
| `EMAIL_TEST_RECIPIENT` | Sans domaine vérifié chez Resend, tous les emails sont redirigés vers cette adresse exacte (pas d'alias `+`) | serveur |
| `OPEN_LIBRARY_BASE_URL` | Optionnelle, défaut `https://openlibrary.org` ; remplaçable pour simuler une indisponibilité | serveur |

### Base de données

Les scripts de `docs/sql/` s'exécutent dans l'éditeur SQL de Supabase, dans l'ordre numérique.
- **Nouvelle base de production :** `10_prod_install.sql` regroupe les scripts de structure (il refuse de s'exécuter si les tables existent déjà).
- **Données fictives de test :** `04_donnees_test.sql` (30 enfants, 3 comptes de test à créer au préalable dans Authentication).
- **Isolation :** `05_tests_isolation.sql` vérifie les politiques RLS (57 tests) et nettoie ses propres écritures.
- **Invitations :** `08_grants_invitation.sql` donne à la clé `service_role` uniquement `SELECT`, `INSERT` et `DELETE` sur `public.family_members`. Relire avant exécution.

## Tests

```bash
node --test "lib/**/*.test.mjs"            # tests unitaires
pnpm lint                                   # lint
pnpm exec tsc --noEmit                      # types
pnpm build                                  # compilation de production
pnpm exec playwright test                   # tests de bout en bout
```

Les tests Playwright utilisent les comptes de test et la clé serveur Supabase de l'environnement ciblé. Pour cibler un environnement déployé, définir `E2E_BASE_URL` (et le contournement de la protection Vercel pour le staging). Ils écrivent des données préfixées `TEST-E2E-`, à supprimer ensuite. Le workflow GitHub `CI` exécute tests unitaires, lint, build et types à chaque push ; `playwright.yml` se lance manuellement.

## Sécurité

- Les accès sont contrôlés par des politiques RLS dans Supabase : un parent ne voit que ses enfants, l'équipe voit tout. Un écran masqué ne constitue jamais une protection.
- `SUPABASE_SERVICE_ROLE_KEY` et `RESEND_API_KEY` ne sont utilisées que côté serveur et ne portent jamais le préfixe `NEXT_PUBLIC_`.
- Aucune donnée médicale n'est envoyée par email.
