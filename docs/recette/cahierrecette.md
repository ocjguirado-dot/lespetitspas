# Cahier de recette — Les Petits Pas

Version du 22/11/2026. Dépôt : branche `staging`, commit de référence `bcf84f1` (le cahier lui-même est ajouté ensuite).

## Règles de lecture

- **Résultat obtenu** : ne contient que ce qui a été réellement exécuté. « Conforme » signifie : test exécuté et réussi, avec la preuve citée.
- **Environnements** : *Local* = `pnpm dev` ; *Staging* = Vercel Preview de la branche `staging` (base Supabase `lespetitspas`) ; *Production* = branche `main` (base `lespetitspas-prod`, pas encore déployée au 22/11/2026).
- **Colonne Production** : « À exécuter » tant que la mise en production n'a pas eu lieu. Aucun résultat de production n'est annoncé avant exécution.
- **Preuve** : `Playwright` = exécution complète de la suite (84 tests, dont 3 d'initialisation des connexions, tous réussis sur staging le 22/11/2026) ; `SQL` = script `docs/sql/05_tests_isolation.sql` (57 tests, bilan 0 KO, 22/11/2026) ; `Manuel` = contrôle humain.
- Données de test préfixées `TEST-E2E-`, supprimées après chaque série par SQL avec contrôle du nombre de lignes.
- Comptes : 1 staff, 2 parents (Parent Un : Léa et Hugo ; Parent Deux : Jade), tous fictifs.

## 1. Authentification et accès par rôle

| ID | US | Objectif | Prérequis | Étapes | Résultat attendu | Résultat obtenu (staging, 22/11/2026) | Preuve | Production |
|---|---|---|---|---|---|---|---|---|
| R-01 | US-01, US-03 | Un visiteur non connecté est renvoyé vers la connexion | Aucune session | Ouvrir `/staff`, `/staff/messages`, la fiche de Léa, `/parent`, `/` | Redirection vers `/login` à chaque fois | Conforme | Playwright `access.spec.ts` | À exécuter |
| R-02 | US-02 | Identifiants invalides | Aucune session | Saisir un email et un mot de passe faux | Erreur explicite, aucune session créée | Conforme | Playwright `access.spec.ts` | À exécuter |
| R-03 | US-01 | Le staff est dirigé vers son espace | Compte staff | Ouvrir `/login`, `/parent`, `/` | Redirection vers `/staff` | Conforme | Playwright `access.spec.ts` | À exécuter |
| R-04 | US-01, US-31 | Un parent ne peut pas ouvrir l'espace équipe | Compte Parent Un | Ouvrir `/staff`, `/staff/messages`, une fiche enfant, un message équipe | Redirection vers `/parent` ; `/` mène à `/parent` | Conforme | Playwright `access.spec.ts` | À exécuter |
| R-05 | US-29 | Pages d'erreur 404 propres | Compte staff | Ouvrir `/staff/messages/abc`, `/staff/children/abc` et un UUID inexistant ; cliquer « Retour à l'accueil » | Page 404 ; retour vers l'espace équipe | Conforme en local (22/11/2026) pour les deux routes équipe ; retour conservé. | Playwright `access.spec.ts` | À exécuter |
| R-06 | US-04 | Création automatique du profil à l'inscription | Parent invité | Créer un compte via le lien d'invitation | Un profil `parent` est créé et lié à `family_members` | Conforme en base (tests SQL de la phase 4) et lors du parcours d'invitation réel du 21/11/2026 | SQL ; Manuel | À exécuter |

## 2. Vue équipe

| ID | US | Objectif | Prérequis | Étapes | Résultat attendu | Résultat obtenu (staging, 22/11/2026) | Preuve | Production |
|---|---|---|---|---|---|---|---|---|
| R-10 | US-06 | Liste des enfants | Compte staff | Ouvrir la liste | 30 enfants affichés | Conforme | Playwright `children.spec.ts` | À exécuter |
| R-11 | US-07, US-08 | Recherche et filtre par section | Compte staff | Rechercher sans accent ni casse ; effacer ; filtrer par section | Résultats corrects ; filtres effaçables | Conforme | Playwright `children.spec.ts` | À exécuter |
| R-12 | US-09, US-15 | Fiche enfant et autorisation médicament | Compte staff | Ouvrir la fiche de Léa puis de Hugo | Informations et autorisation affichées ; Hugo : médicament non autorisé | Conforme | Playwright `children.spec.ts` | À exécuter |
| R-13 | US-10 | Chronologie du jour et formulaire | Compte staff | Ouvrir la fiche de Léa | Chronologie du jour et formulaire visibles | Conforme | Playwright `children.spec.ts` | À exécuter |
| R-14 | US-11, US-17 | Saisir un repas | Compte staff | Saisir un repas valide | Événement affiché avec son auteur | Conforme | Playwright `events.spec.ts` | À exécuter |
| R-15 | US-11 | Repas incomplet et double clic | Compte staff | Valider sans champ obligatoire ; double-cliquer sur Enregistrer | Rien d'enregistré ; un seul événement | Conforme | Playwright `events.spec.ts` | À exécuter |
| R-16 | US-12, US-13, US-14 | Sieste, activité, incident | Compte staff | Saisir chaque type | Horaires et qualité, nom, type et gravité affichés | Conforme | Playwright `events.spec.ts` | À exécuter |
| R-17 | US-15 | Médicament, enfant autorisé | Compte staff | Ouvrir la fiche de Léa ; cocher la case ; enregistrer | Bouton bloqué jusqu'à la case, puis événement enregistré | Conforme | Playwright `events.spec.ts` | À exécuter |
| R-18 | US-16 | Médicament, enfant non autorisé : refus serveur | Compte staff | Forcer la saisie pour Hugo | Refus côté serveur, rien d'écrit | Conforme | Playwright `events.spec.ts` ; SQL | À exécuter |

## 3. Messagerie

| ID | US | Objectif | Prérequis | Étapes | Résultat attendu | Résultat obtenu (staging, 22/11/2026) | Preuve | Production |
|---|---|---|---|---|---|---|---|---|
| R-20 | US-24 | Formulaire d'envoi parent | Compte Parent Un | Ouvrir la messagerie | Enfants proposés, présélection par l'URL, bouton bloqué si vide | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-21 | US-24 | Limite de 500 caractères | Compte Parent Un | Saisir 500 puis 501 caractères | 500 acceptés ; 501 bloqués avec message | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-22 | US-24, US-25 | Envoi d'un message | Compte Parent Un | Envoyer un message | Confirmation, formulaire vidé, historique à jour, statut « Nouveau », texte affiché tel quel | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-23 | US-18 | Réception côté équipe | Message envoyé | Ouvrir la liste côté staff | Message présent avec le badge « Nouveau » | Conforme | Playwright `parent.spec.ts`, `messages.spec.ts` | À exécuter |
| R-24 | US-19 | Ouverture d'un message | Message « Nouveau » | L'ouvrir | Statut « Lu », compteur de nouveaux messages diminué de 1 | Conforme | Playwright `messages.spec.ts` | À exécuter |
| R-25 | US-20 | Marquer comme traité | Message ouvert | Cliquer « Marquer comme traité », puis double clic sur un autre | Badge « Traité », bouton retiré, compteur inchangé ; une seule écriture | Conforme | Playwright `messages.spec.ts` | À exécuter |
| R-26 | US-24 | Sécurité du texte | Compte staff | Envoyer un message contenant du HTML | Balises affichées telles quelles, non interprétées | Conforme | Playwright `messages.spec.ts` | À exécuter |
| R-27 | US-31 | Un parent n'ouvre pas la page d'un message côté équipe | Compte Parent Un | Ouvrir l'URL d'un message équipe | Accès refusé, redirection | Conforme | Playwright `messages.spec.ts` | À exécuter |

## 4. Vue parent et isolation entre familles

| ID | US | Objectif | Prérequis | Étapes | Résultat attendu | Résultat obtenu (staging, 22/11/2026) | Preuve | Production |
|---|---|---|---|---|---|---|---|---|
| R-30 | US-21 | Liste des enfants du parent | Compte Parent Un | Ouvrir `/parent` | Léa et Hugo seulement, avec le dernier événement du jour | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-31 | US-22, US-17 | Chronologie et sélecteur de date | Compte Parent Un | Ouvrir la fiche de Léa ; changer de date ; revenir à aujourd'hui | Événement du jour avec son auteur ; retour fonctionnel | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-32 | US-22, US-29 | Date invalide dans l'URL | Compte Parent Un | Ouvrir une date invalide | Retour sur aujourd'hui sans erreur | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-33 | US-23 | Enfant d'une autre famille, inexistant, invalide | Compte Parent Un | Ouvrir la fiche de Jade, un UUID inexistant, `abc` | Redirection vers `/parent`, aucune donnée visible | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-34 | US-23, US-31 | Appel direct à l'API avec les droits du parent | Compte Parent Un | Interroger enfants, événements, messages de Jade | Aucune donnée d'une autre famille ; écriture forgée refusée | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-35 | US-23 | Isolation côté Parent Deux | Compte Parent Deux | Parcourir liste, historique, formulaire ; appeler l'API pour Léa | Jade seulement ; aucune donnée de la famille 1 | Conforme | Playwright `parent.spec.ts` | À exécuter |
| R-36 | US-31 | Politiques RLS en base | Projet Supabase | Rejouer `05_tests_isolation.sql` | 57 tests, 0 échec (non connecté, parents 1 et 2, staff) | Conforme (22/11/2026) | SQL | À exécuter sur `lespetitspas-prod` |

## 5. Emails (Resend)

| ID | US | Objectif | Prérequis | Étapes | Résultat attendu | Résultat obtenu | Preuve | Production |
|---|---|---|---|---|---|---|---|---|
| R-40 | US-26 | Invitation d'un parent | Compte staff, clés Resend | Inviter une nouvelle adresse | Message « Invitation envoyée », parent « En attente », un seul envoi | Conforme (Playwright staging, 22/11/2026) ; email réellement reçu et lien utilisé le 21/11/2026 | Playwright `invitation.spec.ts` ; Manuel | À exécuter |
| R-41 | US-26 | Relance | Invitation en attente | Cliquer « Renvoyer l'invitation » | Un nouvel email part | Conforme (Playwright) | Playwright `invitation.spec.ts` | À exécuter |
| R-42 | US-27 | Parent déjà actif | Parent actif | Inviter la même adresse | Message explicite, aucune ligne en trop | Conforme (Playwright) | Playwright `invitation.spec.ts` | À exécuter |
| R-43 | US-05 | Lien d'invitation | Aucune session | Ouvrir un jeton invalide ; une destination hors `/auth/set-password` ; `/auth/set-password` sans session | Message clair ; destination refusée ; renvoi vers `/login` | Conforme | Playwright `invitation.spec.ts` | À exécuter |
| R-44 | US-05 | Choix du mot de passe | Parent connecté par le lien | Saisir deux mots de passe différents ; trop courts | Refus par le formulaire | Conforme (Playwright, validation sans enregistrement) ; création réelle d'un mot de passe contrôlée à la main le 21/11/2026 | Playwright ; Manuel | À exécuter |
| R-45 | US-28 | Notification de l'équipe à chaque message parent | Message parent envoyé | Envoyer un message depuis le compte parent | Un email part vers l'équipe, sans contenu médical | Conforme lors du contrôle réel de la phase 7 (étape 3) ; aucun test Playwright dédié (aucune boîte de réception automatisable) | Manuel | À exécuter |

## 6. Bonus : livre du soir

| ID | US | Objectif | Prérequis | Étapes | Résultat attendu | Résultat obtenu (staging, 22/11/2026) | Preuve | Production |
|---|---|---|---|---|---|---|---|---|
| R-50 | BN-01, BN-02 | Encart du jour | Compte Parent Un | Ouvrir la fiche de Léa | « Livre du soir » avec un livre, ou « Suggestion indisponible » ; la chronologie reste utilisable | Conforme (livre : *The Gruffalo*, Julia Donaldson) ; contrôle visuel sur ordinateur | Playwright `evening-book.spec.ts` ; Manuel | À exécuter |
| R-51 | BN-01 | Cache quotidien partagé | R-50 exécuté | Recharger ; ouvrir la page de Jade | Même suggestion ; une seule ligne dans `evening_books` | Conforme | Playwright ; SQL (1 ligne) | À exécuter |
| R-52 | BN-01 | Pas d'encart sur une date passée | Compte Parent Un | Ouvrir `?date=2000-01-01` | Aucun encart, aucun appel externe | Conforme | Playwright | À exécuter |
| R-53 | BN-02 | Cas limites de l'API (aucun résultat, donnée manquante, délai dépassé) | — | Exécuter les tests unitaires de `lib/books` | Aucune erreur visible ; repli prévu | Conforme (53 tests unitaires Node, 22/11/2026) ; non simulé en navigateur | Tests unitaires | À exécuter |

## 7. Qualité transverse

| ID | US | Objectif | Prérequis | Étapes | Résultat attendu | Résultat obtenu (staging, 22/11/2026) | Preuve | Production |
|---|---|---|---|---|---|---|---|---|
| R-60 | US-30 | Pas de débordement horizontal à 320 px et sur ordinateur | Comptes staff et Parent Un | Parcourir connexion, liste, fiche, messages, timeline parent | Aucun débordement | Conforme (8 écrans, 2 formats) ; contrôle visuel humain limité à l'ordinateur | Playwright `layout.spec.ts` ; Manuel | À exécuter |
| R-61 | US-29 | États vides : parent sans enfant rattaché, historique vide | Parent sans enfant | Ouvrir l'accueil et la messagerie | Message « Aucun enfant n'est rattaché à votre compte. » | Conforme en local (22/11/2026) : compte parent temporaire TEST-E2E- sans rattachement ; message affiché sur `/parent` et `/parent/messages`, historique vide. Compte, profil et rattachements vérifiés absents après nettoyage. | Playwright `empty-parent.spec.ts` | À exécuter |
| R-62 | US-29 | Erreur réseau avec « Réessayer » | — | Couper le réseau | Message et bouton « Réessayer » | Non automatisé : l'erreur est produite par une lecture serveur Supabase ; couper le réseau du navigateur ne provoque pas cette erreur serveur. Pas de point d'entrée de panne en production et aucun test destructif de panne de service exécuté. `app/error.tsx` et `RetryChildrenButton` relus. | — | À exécuter |
| R-63 | US-33 | Séparation des environnements | — | Vérifier variables et bases par environnement | Staging sur `lespetitspas`, production sur `lespetitspas-prod` | Variables de Preview contrôlées sur capture le 22/11/2026 ; Production non configurée | Manuel | À exécuter |
| R-64 | US-34 | Suite Playwright verte | Staging à jour | `pnpm exec playwright test` avec `E2E_BASE_URL` | 0 échec | Conforme : 84/84 sur staging (22/11/2026, commit `bcf84f1`) ; 85/85 en local après le lot 8A (22/11/2026) | Playwright | À rejouer sur staging (commit du lot 8A) puis en production |
| R-65 | US-36 | Absence de secret dans le dépôt | — | Contrôler `.gitignore`, fichiers suivis, historique | Aucune clé ; clés sensibles côté serveur uniquement | Conforme (22/11/2026) ; variables Vercel `Sensitive` | Manuel (lecture seule) | À exécuter |

## Tests non couverts à ce jour

Ces points sont connus et seront traités ou assumés dans le procès-verbal : R-62 (erreur réseau), expiration réelle de 24 h du lien d'invitation, rattachement d'un parent à un deuxième enfant (fratrie, code relu seulement), envoi d'email vers un destinataire réel (domaine Resend non vérifié : les emails partent uniquement vers l'adresse de test), parcours complet sur build de production.
