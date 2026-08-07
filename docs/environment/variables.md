# Variables d'environnement

Fichier local : `.env.local` (gitignored).  
Modèle versionné : `.env.example`.

## Liste

### Supabase

| Variable | Public | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL projet |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | non | Service role (serveur uniquement) |

### Stripe

| Variable | Public | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | oui | Clé publishable test |
| `STRIPE_SECRET_KEY` | non | Clé secrète test |
| `STRIPE_WEBHOOK_SECRET` | non | Secret webhook |

### PayPal

| Variable | Public | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | oui | Client ID Sandbox |
| `PAYPAL_CLIENT_SECRET` | non | Secret Sandbox |

### La Poste

| Variable | Public | Description |
| --- | --- | --- |
| `LAPOSTE_API_KEY` | non | Clé API pro |
| `LAPOSTE_CONTRACT_NUMBER` | non | N° contrat |

### Mondial Relay

| Variable | Public | Description |
| --- | --- | --- |
| `MONDIAL_RELAY_ENSEIGNE` | non | Code enseigne |
| `MONDIAL_RELAY_PRIVATE_KEY` | non | Clé privée |
| `MONDIAL_RELAY_BRAND_CODE` | non | Code marque / brand |
| `MONDIAL_RELAY_MODE` | non | `sandbox` ou `production` |

### App

| Variable | Public | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | oui | URL du site (`http://localhost:3000` en local, `https://awurabeauty.com` en prod) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | oui | E-mail contact public |
| `ADMIN_EMAILS` | non | Allowlist e-mails admin (serveur) |
| `ADMIN_DEV_BYPASS` | non | `false` en production |

## Déploiement (prod)

1. Héberger l’app Next.js sur **Vercel** (recommandé) relié au repo GitHub.
2. Domaine Hostinger **awurabeauty.com** → DNS vers Vercel.
3. Dans Vercel → Settings → Environment Variables : copier depuis `.env.example` (valeurs prod), surtout `NEXT_PUBLIC_SITE_URL=https://awurabeauty.com` et `SUPABASE_SERVICE_ROLE_KEY`.
4. `ADMIN_DEV_BYPASS=false` obligatoire en production.

## Sécurité

- Ne jamais committer `.env.local`
- Ne jamais exposer les secrets dans le client ou les logs
- Accès API uniquement via `lib/application/container` / adapters `lib/infrastructure`
