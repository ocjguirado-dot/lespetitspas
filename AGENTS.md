# AGENTS.md — Les Petits Pas

Application web de transmissions pour la crèche associative Les Petits Pas (30 enfants de 3 mois à 3 ans, 3 sections). Deux rôles : **staff** et **parent**.

Ce fichier est lu avant chaque tâche. Le backlog du projet est dans `backlog.md`.

## Règle de mise à jour du backlog (obligatoire)

À chaque tâche, dans la même modification de code :

1. Avant de commencer, identifier la story concernée dans `backlog.md` et passer son statut à `En cours`.
2. Pendant le travail, noter toute nouvelle contrainte ou dépendance découverte dans la colonne « Contraintes / Dépendances ».
3. À la fin, passer le statut à `Terminé` **uniquement si** les critères d'acceptation sont vérifiés (test exécuté ou contrôle manuel décrit). Sinon, laisser `En cours` et expliquer ce qui manque. Pour déclarer `Terminé`, consigner dans le compte rendu : les critères vérifiés, les tests ou contrôles réellement exécutés, l'environnement utilisé et le résultat observé. Ajouter dans la colonne « Contraintes / Dépendances » une ligne courte : « Vérifié : [test ou contrôle], [environnement], [date] ». Une compilation réussie ou du code généré ne prouve pas qu'un parcours fonctionne.
4. Si un travail nécessaire ne correspond à aucune story : proposer une nouvelle ligne (ID suivant la numérotation existante) en précisant son origine (exigence documentée, correction nécessaire ou amélioration facultative), et **demander validation avant de l'implémenter** si elle élargit le périmètre. Une sous-tâche technique nécessaire à une story existante se note dans cette story, sans nouvelle ligne. Ne jamais présenter une proposition comme une exigence officielle.
5. Ne jamais supprimer une story. Pour l'abandonner, ajouter « Abandonné : [raison] » dans la colonne « Contraintes / Dépendances ».
6. Garder le tableau cohérent : mêmes colonnes, même ordre.

Statuts autorisés : `À faire`, `En cours`, `Terminé`.

## Stack

- Next.js (App Router, Server Actions), TypeScript
- Supabase : base, authentification, RLS
- Tailwind CSS et ShadCN (Radix, preset Nova)
- Resend pour les emails
- Playwright pour les tests de bout en bout
- Déploiement Vercel : local, staging (branche `staging`), production (branche `main`)
- Gestionnaire de paquets : `pnpm`

Ne pas ajouter de bibliothèque, de service payant ni de framework sans demander.

## Commandes

À vérifier dans `package.json` avant de les utiliser :

- `pnpm dev` : serveur local (http://localhost:3000)
- `pnpm build` : compilation de production
- `pnpm lint` : analyse du code
- `pnpm exec playwright test` : tests de bout en bout

## Règles de sécurité (non négociables)

- **Clé `service_role`** : uniquement côté serveur (Server Action ou route API). Jamais dans le code client, jamais dans une variable `NEXT_PUBLIC_`.
- **Secrets** : ne jamais écrire de clé, de mot de passe ni de jeton dans le code, les fichiers versionnés, les logs ou les réponses. Utiliser `.env.local` (ignoré par Git) et les variables Vercel.
- **RLS** activée sur toutes les tables. Un écran masqué ou un bouton désactivé ne remplace pas une vérification serveur ou base de données.
- **Médicament** : l'enregistrement exige l'autorisation parentale vérifiée côté client (bouton désactivé) **et** côté serveur (réponse 403, aucune écriture). Un bouton désactivé n'est jamais une preuve suffisante. Vérifier aussi qu'un appel direct, contournant le formulaire et la Server Action, ne permet pas d'enregistrer un médicament sans autorisation. Le mécanisme exact en base est à définir avec le modèle de données : ne pas prétendre qu'il existe avant de l'avoir implémenté et testé.
- **Isolation des familles** : un parent n'accède qu'aux données de ses enfants. Vérifier identité, rôle, rattachement à l'enfant et opération autorisée pour chaque **lecture et chaque écriture**.
- **Cas à tester séparément** : utilisateur non connecté, parent autorisé, parent d'une autre famille, membre du staff.
- **Rôle** : `profiles.role` n'est jamais modifiable depuis l'application.
- **Données** : aucune donnée réelle d'enfant ou de famille dans les tests, les seeds ou les exemples. Aucune donnée du message du parent ni donnée médicale ou sensible dans le corps des emails (jamais de fiche enfant, d'événement ni de donnée de santé).
- **Destinations de test** : tout test pouvant envoyer un email ou créer une donnée externe utilise une destination de test explicitement identifiée. Avec l'expéditeur de test Resend (`onboarding@resend.dev`), seul l'adresse exacte du compte Resend reçoit les emails (vérifié le 21/11/2026 : un alias `+` est refusé avec une erreur 403). Tant qu'aucun domaine n'est vérifié, tout email sortant est donc redirigé vers cette adresse via `EMAIL_TEST_RECIPIENT`. Aucun calendrier ni compte réel connecté. Avant le premier test d'une intégration, préciser l'environnement, le destinataire autorisé, les données fictives et le résultat attendu. Si la destination n'est pas identifiée, ne pas exécuter le test.

## Conventions de code

- Charte Nuage en tokens dans `globals.css` et la configuration Tailwind. Ne pas coder de couleurs en dur.
  Primaire `#9FA8DA`, secondaire `#80CBC4`, accent `#F48FB1`, fond `#F0F4F8`, surface `#FFFFFF`, texte `#1A237E`, texte secondaire `#78909C`, erreur `#EF9A9A`. Titres : Plus Jakarta Sans. Texte : DM Sans.
- Interface en français.
- Toute page couvre ses états : chargement, vide, erreur (message clair et bouton « Réessayer »), jamais d'écran blanc.
- Mobile d'abord : préfixes `sm:` `md:` `lg:` pour tablette et ordinateur.
- Pas de temps réel : actualisation par rechargement.

## Environnements et déploiement

- Ne jamais pousser directement sur `main`. Travailler sur une branche, fusionner dans `staging`, puis ouvrir une Pull Request de `staging` vers `main`.
- Supabase : projet `lespetitspas` pour local et staging, `lespetitspas-prod` pour la production. La production ne reçoit que la structure (tables, trigger, politiques RLS), jamais les données de test.
- Avant tout déploiement : vérifier variables d'environnement, migrations, paramètres d'authentification, tests.

## Façon de travailler

- Lire le code existant avant de modifier. Signaler une information manquante plutôt que l'inventer.
- Faire des changements courts, ciblés, sur une seule story à la fois.
- Après chaque tâche, donner un compte rendu : modifications, fichiers touchés, tests exécutés et résultats, limites, actions restantes. Ne pas affirmer qu'un test passe sans l'avoir exécuté.
- Distinguer exigence officielle documentée, décision validée par l'utilisateur, proposition et hypothèse à vérifier. En cas de contradiction entre les documents officiels, `backlog.md` et ce fichier, signaler l'écart avant d'implémenter la partie concernée. Ne pas la résoudre silencieusement : si elle bloque, demander un arbitrage, sinon avancer sur les éléments indépendants.
- L'accord sur une tâche autorise les modifications locales de fichiers dans le périmètre annoncé.
- Demander un accord explicite avant : une modification de base distante ; une modification de configuration d'un service distant ; un envoi réel d'email ; un push ou une fusion déclenchant un déploiement ; une action destructive, une dépense ou une mise en production. Présenter d'abord la cible exacte, l'environnement, l'effet attendu et les risques.
- Ne jamais supprimer de données ni réinitialiser un environnement pour résoudre une erreur sans autorisation.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
