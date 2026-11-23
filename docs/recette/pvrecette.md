# Procès-verbal de recette — Les Petits Pas

Version du 23/11/2026. Ce document justifie la décision de mise en production. Il s'appuie sur `cahierrecette.md` (49 cas) et `bugs.md` (anomalies). Chaque résultat est rattaché à une exécution réelle ; les contrôles manuels sont distingués des tests automatisés.

## 1. Périmètre et environnements

| Élément | Valeur |
|---|---|
| Application | Les Petits Pas : vue équipe, vue parent, messagerie, invitations par email (Resend), bonus « livre du soir » |
| Production | `https://lespetitspas-lilac.vercel.app`, branche `main`, base Supabase `lespetitspas-prod` |
| Staging | Preview Vercel de la branche `staging`, base Supabase `lespetitspas` (protégé par Vercel : voir B-18) |
| Version recettée | Commit `7d708f0` (fusion de la PR n° 3 dans `main`), déploiement de production du 23/11/2026 |
| Données | 100 % fictives : 30 enfants, 3 comptes de test (équipe, parent 1, parent 2) |
| Hors périmètre | Réinitialisation de mot de passe (B-11), envoi d'emails vers des destinataires réels (B-19) |

## 2. Critères de décision

Critères officiels de la phase 8, auxquels s'ajoutent deux critères que je me suis fixés (marqués « interne »).

| Critère | Résultat | Preuve |
|---|---|---|
| Cahier de recette complet (ID, objectif, prérequis, étapes, attendu, obtenu) | Atteint | `cahierrecette.md` : 49 cas, colonnes Staging et Production renseignées |
| Anomalies classées par gravité avec statut | Atteint | `bugs.md` : 21 anomalies ; gravités et statuts renseignés |
| Tests Playwright sur les parcours critiques, au vert | Atteint | Production le 23/11/2026 : 92 tests, **92 réussis, 0 ignoré, 0 échec** après la PR #8 (R-64) ; série précédente du même jour : 88 tests, 86 réussis, 2 ignorés |
| Application en production sans bug bloquant | Atteint | Aucune anomalie bloquante ouverte (voir § 4) |
| Isolation entre familles et entre rôles vérifiée | Atteint | `05_tests_isolation.sql` rejoué sur la production : **57 tests, 0 échec** (R-36) ; scénarios Playwright d'isolation, y compris par appels directs à l'API |
| Interne : aucun secret dans le dépôt | Atteint | R-65 : `.env*` ignoré, aucun motif de clé dans les fichiers suivis ni dans l'historique |
| Interne : rendu de production identique au staging | Atteint après correction | R-66 : écart détecté puis corrigé (B-21) |

## 3. Résultats de la recette

| Famille de cas | Cas | Résultat en production |
|---|---|---|
| Accès et rôles (R-01 à R-06) | 6 | Conformes |
| Vue équipe : enfants, événements, messages (R-10 à R-18) | 9 | Conformes |
| Vue parent et messagerie (R-20 à R-27) | 8 | Conformes |
| Sécurité et RLS (R-30 à R-36) | 7 | Conformes |
| Emails et invitations (R-40 à R-45) | 6 | Conformes ; emails réellement reçus pour l'invitation, la relance et la notification équipe |
| Bonus livre du soir (R-50 à R-53) | 4 | R-50 à R-52 conformes ; R-53 sans objet en production (tests unitaires de code) |
| États vides, erreurs, qualité (R-60 à R-68) | 9 | Conformes, sauf R-62 non exécuté et R-66 conforme après correction (B-21) |
| **Total** | **49** | **46 conformes, 1 conforme après correction (R-66), 1 sans objet (R-53), 1 non exécuté (R-62)** |

**Nature des preuves**
- **Automatisées :** suite Playwright en production (85 tests le 22/11 en deux exécutions, puis 88 tests le 23/11 avec le nouveau spec d'accessibilité, puis 92 tests le 23/11 après la correction de l'état vide staff) et script SQL d'isolation (57 tests).
- **Capturées :** emails reçus (invitation, relance, notification équipe), résultat du script d'isolation.
- **Manuelles sans capture :** certains contrôles du 22/11/2026 ; ils sont signalés comme tels dans le cahier et ne sont pas présentés comme des tests automatisés.

**Les 2 tests ignorés** appartiennent au bonus « livre du soir ». Le code les désactive volontairement lorsque l'API Open Library répond « Suggestion indisponible » au premier chargement. Ce n'est pas une régression, et le comportement de repli est lui-même un cas limite voulu du bonus.

## 4. Anomalies

**Aucune anomalie bloquante n'est ouverte.** Les gravités sont celles proposées dans `bugs.md`.

**Corrigées pendant la recette (extraits)**

| ID | Gravité | Sujet | Preuve de correction |
|---|---|---|---|
| B-01 | Majeure | `/` ne redirigeait pas selon le rôle | R-03, R-04 |
| B-02 | Majeure | Filtre du bonus renvoyant des romans pour adolescents | R-50, essai réel |
| B-12 | Mineure | Page d'erreur sur identifiant invalide | Playwright local et staging |
| B-13 | Mineure | Contraste insuffisant des liens (2,09:1) et du texte secondaire (3,03:1) | Ratios portés à 11,98:1 et 4,89:1 ; mesuré en production (R-68) |
| B-14 | Mineure | Plusieurs `<h1>` sur la fiche enfant ; aucun sur `/login` | `accessibilite.spec.ts` réussi en production (R-67) |
| B-15 | Mineure | Longueur minimale du mot de passe côté Supabase | Réglage de production à 8 |
| B-16 | Mineure | Comptes de test résiduels après les tests d'invitation | Nettoyage automatique, contrôle SQL |
| B-21 | Majeure | Production servie avec une ancienne feuille de style | Redéploiement sans cache ; rendu identique au Preview (R-66) |

**Restantes, acceptées ou documentées**

| ID | Gravité | Sujet | Décision et justification |
|---|---|---|---|
| B-10 | Mineure | Parent « Actif » avant d'avoir défini son mot de passe | Accepté : correction risquée à ce stade (logique d'invitation déjà validée) ; sans effet sur la sécurité |
| B-11 | Majeure en exploitation, mineure pour la recette | Pas de réinitialisation de mot de passe | Accepté : hors périmètre des user stories |
| B-17 | Mineure | Avertissements de pré-rendu vus en développement | Documenté : le build de production réussit ; avertissements non recontrôlés sur le build de production |
| B-18 | Mineure (organisation) | Staging protégé par Vercel | Accepté : la démonstration se fait en production, captures de secours préparées |
| B-19 | Majeure en exploitation réelle | Emails envoyés uniquement vers l'adresse de test (aucun domaine Resend vérifié) | Accepté pour la recette et la démonstration ; à lever avant l'exploitation réelle |
| B-20 | Majeure (couverture) | Cas non exécutés : voir § 5 | Assumé, listé ci-dessous |

## 5. Limites connues

- **R-62 (erreur réseau avec « Réessayer ») non exécuté.** L'erreur vient d'une lecture serveur Supabase ; la reproduire en production exigerait une panne ou un test destructif. Couverture limitée à la relecture de `app/error.tsx` et du bouton de nouvelle tentative.
- **US-29 et US-30 acceptées comme limites connues.** US-29 (gestion d'erreur avec « Réessayer ») repose sur R-62, non exécuté ; US-30 (navigation par barre latérale et barre du bas) n'a pas fait l'objet d'une vérification dédiée, même si les parcours critiques traversent ces navigations. Ces deux points seront approfondis après la soutenance.
- **Pas de réponse de l'équipe dans l'application.** La messagerie est unidirectionnelle (parent vers équipe, statuts nouveau, lu, traité), conformément au périmètre officiel. Le prototype Figma Make montrait des réponses de l'équipe dans l'historique du parent : écart assumé et amélioration prioritaire, car elle exige une évolution du modèle de données et des politiques RLS, donc une nouvelle recette. Les réponses se font hors application.
- **Expiration réelle de 24 h du lien d'invitation non observée.** Le réglage est vérifié (86 400 s), l'expiration elle-même n'a pas été attendue.
- **Rattachement d'un parent à un deuxième enfant (fratrie) non testé en exécution ;** le code a seulement été relu.
- **Emails uniquement vers l'adresse de test** (B-19) : aucun envoi vers un destinataire réel n'a été vérifié.
- **Tests Playwright en intégration continue :** le workflow GitHub `CI` exécute les tests unitaires, le lint, le build et `tsc` à chaque push. Les tests Playwright restent en lancement manuel (`playwright.yml`), car ils exigent la clé serveur Supabase et des comptes de test ; ce workflow n'a pas encore été exécuté et ses secrets GitHub ne sont pas créés (interprétation retenue pour US-35).
- **Contrôles manuels sans capture** (voir § 3).
- **Leçon de B-21 :** Playwright ne détecte pas un défaut purement visuel. Un contrôle du rendu (cas R-66) est désormais rejoué à chaque mise en production, et un redéploiement sans cache est le remède.

## 6. Décision Go / NoGo

**Décision : GO pour la mise en production du périmètre recetté, avec les limites du § 5.**

**Justification**
1. **Les critères officiels de la phase 8 sont atteints** : cahier complet, anomalies classées, Playwright au vert en production (0 échec), PV, isolation vérifiée.
2. **Aucune anomalie bloquante n'est ouverte.** Les deux défauts majeurs de la recette (B-02, B-21) sont corrigés et revérifiés en production.
3. **L'isolation des données**, risque principal pour une application contenant des données d'enfants, est vérifiée à trois niveaux : politiques RLS en base (57 tests sur la production), scénarios Playwright incluant des URL trafiquées et des appels API directs, et absence de secret côté client.
4. **Les limites sont connues et assumées.** Elles concernent la robustesse en cas de panne (R-62) et des cas rares (fratrie, expiration à 24 h), et non les parcours critiques.

**Condition avant toute exploitation réelle :** vérifier un domaine d'envoi chez Resend (B-19) et traiter B-11 (réinitialisation de mot de passe) ; la production ne doit pas accueillir de données réelles d'enfants avant ces deux points.

**Réversibilité :** retour arrière possible par « Instant Rollback » Vercel vers le déploiement précédent, ou par revert de la PR sur `main`. Aucune migration de base ne figure dans le dernier déploiement.

## 7. Signature

Rédigé le 23/11/2026 par John, avec l'assistance de Claude pour la structuration et la vérification des preuves. Décision à valider par John avant dépôt.
