# Suivi des anomalies — Les Petits Pas

Version du 22/11/2026. Statuts : **nouveau**, **en cours**, **corrigé**, **accepté** (limite connue assumée, sans correction avant la mise en production).

Gravité : **bloquante** (empêche un parcours critique ou expose des données), **majeure** (parcours dégradé avec contournement), **mineure** (confort, présentation). Les gravités ci-dessous sont **proposées** et à valider lors du procès-verbal. Aucune anomalie bloquante n'est ouverte à ce jour.

## Anomalies corrigées

| ID | Découverte | Description | Gravité | Étapes de reproduction | Attendu | Obtenu | Statut | Preuve de correction |
|---|---|---|---|---|---|---|---|---|
| B-01 | Phase 5, test Playwright d'accès | La racine `/` ne redirigeait pas selon le rôle | Majeure | Connecté en staff ou en parent, ouvrir `/` | Redirection vers `/staff` ou `/parent` | Page d'accueil par défaut | Corrigé | R-03, R-04 (Playwright, réussis) |
| B-02 | Phase 7, essai réel Open Library | Le premier filtre du bonus renvoyait des romans pour adolescents, inadaptés à des enfants de 3 mois à 3 ans | Majeure | Appeler la recherche avec les sujets « Juvenile » | Livres pour tout-petits | Romans jeunesse | Corrigé (sujets `Bedtime`, `Board books`, `Picture books` avec `language:fre`) | R-50 ; essai réel du 22/11/2026 : *The Gruffalo* |
| B-03 | Phase 7, première série de tests d'invitation | Échec dû à un serveur de développement ancien resté actif sur le port 3000, sans lien avec le code de l'application | Mineure (outillage de test) | Lancer Playwright avec un serveur périmé | Tests exécutés sur le code courant | 1 échec | Corrigé (arrêt du processus avant relance) ; garde-fou : consigne dans la procédure d'exécution | 11/11 invitation réussis, puis 84/84 |

## Anomalies et limites ouvertes

| ID | Description | Gravité proposée | Étapes de reproduction | Attendu | Obtenu | Statut | Décision |
|---|---|---|---|---|---|---|---|
| B-10 | Un parent qui ouvre le lien d'invitation mais n'a pas défini de mot de passe apparaît « Actif » côté équipe | Mineure | Inviter un parent, ouvrir le lien, ne pas valider le mot de passe | Statut « En attente » jusqu'au mot de passe | Statut « Actif » | Nouveau | À traiter en phase 8 si le temps le permet, sinon à documenter |
| B-11 | Aucune réinitialisation de mot de passe | Majeure en exploitation réelle, mineure pour la recette | Oublier son mot de passe | Lien de réinitialisation | Aucune fonction | Accepté | Hors périmètre des user stories du projet ; amélioration possible |
| B-12 | `/staff/children/abc` : état d'erreur à vérifier (identifiant invalide) | Mineure | Ouvrir `/staff/children/abc` en staff | Page 404 claire comme pour les messages | À reconfirmer (non couvert par un test) | Nouveau | À tester en phase 8 |
| B-13 | Contraste insuffisant de certains liens | Mineure | Contrôler les liens sur fond clair | Contraste conforme | Contraste limite | Nouveau | À mesurer puis corriger si simple |
| B-14 | Plusieurs titres de niveau 1 sur certaines pages | Mineure | Inspecter les pages parent et équipe | Un seul `h1` par page | Doublons relevés | Nouveau | À corriger si simple (accessibilité) |
| B-15 | Longueur minimale du mot de passe : 8 caractères imposés par l'application, mais le réglage Supabase vaut 6 et n'a pas été revérifié | Mineure | Contourner le formulaire et appeler l'API d'authentification | Minimum 8 caractères | Minimum 6 côté Supabase | Nouveau | Aligner le réglage Supabase sur 8 avant la production |
| B-16 | Le test d'invitation « parent déjà actif » laisse un compte et une ligne `family_members` après chaque exécution | Mineure (outillage de test) | Exécuter la suite puis lire `family_members` | Aucune donnée résiduelle | 1 parent de test par exécution | En cours | Ajouter un nettoyage automatique dans le test ; résidu supprimé à la main le 22/11/2026 |
| B-17 | Avertissements de pré-rendu sur `/auth/confirm` et `/auth/set-password` vus uniquement en développement | Mineure | Lancer `pnpm dev` et ouvrir ces pages | Aucun avertissement | Avertissements | Nouveau | À recontrôler sur le build de production |
| B-18 | Environnement de staging protégé par Vercel : le mentor ne peut pas l'ouvrir sans lien de partage | Mineure (organisation) | Ouvrir l'URL de staging en fenêtre privée | Accès | Écran d'authentification Vercel | Accepté | La démonstration se fait sur la production ; captures de secours préparées |
| B-19 | Emails envoyés uniquement vers l'adresse de test, faute de domaine vérifié chez Resend | Majeure en exploitation réelle | Inviter un parent avec une autre adresse | Email reçu | Non envoyé vers une adresse non autorisée | Accepté | Démonstration sur la boîte de test ; domaine à vérifier en exploitation |
| B-20 | Tests non exécutés : états vides et erreur réseau (R-61, R-62), fratrie, expiration réelle à 24 h | Majeure (couverture) | Voir cahier de recette | Cas couverts | Non couverts | Nouveau | À exécuter ou à assumer dans le procès-verbal |
