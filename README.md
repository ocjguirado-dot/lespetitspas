This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Variables d’environnement

Copiez `.env.example` vers `.env.local` en local et renseignez les valeurs depuis les environnements correspondants. Pour Vercel Preview, configurer :

- `NEXT_PUBLIC_APP_URL` : URL de l’aperçu Preview.
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : projet Supabase local/staging.
- `SUPABASE_SERVICE_ROLE_KEY` : clé serveur privée, jamais préfixée par `NEXT_PUBLIC_`.
- `RESEND_API_KEY` et `EMAIL_FROM` : identifiants d’envoi Resend.
- `EMAIL_TEST_RECIPIENT` : en Preview avec `onboarding@resend.dev`, adresse exacte du compte Resend autorisé ; ne pas utiliser un alias `+`.

Les valeurs de `.env.example` sont fictives et ne permettent aucun envoi.

## Invitation d'un parent

Depuis la fiche d'un enfant, un membre du staff peut rattacher une adresse email puis envoyer une invitation. Le serveur crée le lien `family_members` avant de demander à Supabase Auth un `hashed_token`; l'application construit ensuite `/auth/confirm` et envoie l'email avec Resend. Aucun mot de passe n'est envoyé. Après clic, le parent confirme explicitement le lien puis choisit son mot de passe dans `/auth/set-password`.

Le rôle `parent` et le rattachement aux enfants sont créés par le trigger `on_auth_user_created`. Si l'adresse correspond déjà à un compte parent actif (par exemple pour une fratrie), l'enfant est rattaché à ce compte et aucun nouvel email n'est envoyé. Les pages de confirmation ne consomment pas le jeton lors du chargement : la vérification se fait au clic sur « Continuer ». Le chemin de redirection est limité à `/auth/set-password`.

Avant d'activer les invitations, relire puis appliquer manuellement `docs/sql/08_grants_invitation.sql` afin que la clé `service_role` ait uniquement `SELECT`, `INSERT` et `DELETE` sur `public.family_members`. Ne jamais exécuter cette clé dans le navigateur. En Preview, les emails restent redirigés vers `EMAIL_TEST_RECIPIENT` par le module Resend existant. Le texte annonce une validité de 24 h : vérifier que la durée d'expiration des jetons d'invitation dans la configuration Auth Supabase est bien de 24 h, car l'application ne peut pas régler ni vérifier ce paramètre à l'exécution.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
