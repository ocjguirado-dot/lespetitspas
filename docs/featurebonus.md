# Bonus — Livre du soir

## Écran et comportement

Sur `/parent/children/[id]`, l'encart « Livre du soir » apparaît sous la chronologie uniquement lorsque la date sélectionnée est aujourd'hui à Paris. Il affiche la couverture si elle est disponible, le titre et l'auteur. Sans auteur, il indique « Auteur non renseigné » ; sans couverture, il montre un emplacement neutre. Si la source ou le cache est indisponible, l'encart affiche « Suggestion indisponible » sans bloquer les événements. Son propre `Suspense` garde le chargement de la recommandation indépendant de la chronologie.

Une date antérieure ne déclenche aucune requête Open Library. La date utilisée est celle fournie par `getTodayInParis()` dans `lib/dates.ts`.

## Source et recherche

La recherche se fait côté serveur sur l'endpoint `search.json` d'[Open Library](https://openlibrary.org/dev/docs/api/search), sans clé. La requête limite les champs à `key,title,author_name,cover_i`, le nombre de résultats à 20 et demande `lang=fr`. Le filtre de requête utilise les sujets `Bedtime`, `Board books` et `Picture books` (livres du coucher et albums pour tout-petits) avec `language:fre` : la documentation indique que `lang=fr` privilégie les éditions françaises sans les garantir, tandis que `language:fre` filtre les livres sans édition française. Les termes de sujet sont fondés sur les exemples du [guide de recherche](https://openlibrary.org/search/howto). Le premier filtre essayé (`Juvenile fiction` / `Juvenile literature`) renvoyait des romans pour adolescents, inadaptés à des enfants de 3 mois à 3 ans : il a été remplacé après un essai réel le 22/11/2026 (1 066 résultats, 20 livres jeunesse renvoyés, tous avec auteur et couverture). Limite connue : les titres sont ceux d'Open Library, souvent en anglais.

Le serveur envoie un User-Agent descriptif sans adresse personnelle et applique un délai maximal de 3 secondes. Il ne transmet ni l'identifiant de l'enfant, ni le parent, ni aucun élément de la chronologie. Chaque résultat sans titre ou clé est rejeté. Auteur et couverture sont facultatifs. Les URL de couverture ne sont acceptées qu'en HTTPS, sur `covers.openlibrary.org`, avec le chemin de couverture attendu.

Le résultat est choisi de façon déterministe : numéro ordinal du jour dans l'année modulo le nombre de résultats valides. Deux instances recevant les mêmes résultats choisissent donc le même élément pour une date donnée.

## Cache et droits

`public.evening_books` stocke une suggestion par date, partagée par toutes les familles. La contrainte unique sur `suggestion_date` arbitre les requêtes simultanées. Une lecture utilise le client Supabase de session et la politique RLS autorise `SELECT` aux rôles authentifiés. Seul le client serveur `service_role` peut insérer, avec `ON CONFLICT DO NOTHING`; il n'a aucun droit d'UPDATE ou DELETE dans le script 09. La table n'a aucun identifiant enfant ou famille.

Le cache conserve une ligne par jour sans mécanisme de purge prévu dans ce bonus. Les erreurs de recherche ou d'insertion ne sont pas mises en cache : la carte indique l'indisponibilité et une requête ultérieure peut réessayer.

## Erreurs et simulation

Les erreurs de réseau, délais, réponses non-2xx, JSON invalide, résultats inutilisables, indisponibilité Supabase et conflits illisibles sont convertis en état indisponible. Le serveur ne journalise qu'un code d'erreur ; aucun détail de requête ou donnée utilisateur n'est écrit dans les logs.

`OPEN_LIBRARY_BASE_URL` est optionnelle et vaut par défaut `https://openlibrary.org`. Pour une démonstration ou un test, la remplacer par une URL de serveur de test qui renvoie une erreur, un JSON invalide ou ne répond pas sous 3 secondes. Redémarrer l'application après le changement. Les tests unitaires simulent ces scénarios avec un `fetch` injecté et ne contactent pas Open Library.

## Configuration SQL et limites

`docs/sql/09_evening_books.sql` crée la table, sa politique de lecture et les droits minimaux. Ce fichier et l'extension de `docs/sql/05_tests_isolation.sql` sont livrés pour relecture ; ils n'ont pas été exécutés. Avant d'utiliser la fonctionnalité, appliquer le SQL après validation, puis jouer les contrôles d'isolation.

Open Library est un catalogue communautaire : la pertinence jeunesse, la présence d'une édition française, l'auteur et la couverture dépendent des métadonnées fournies par la source. L'encart ne garantit ni une tranche d'âge précise, ni une image toujours accessible, ni une recommandation éditoriale.
