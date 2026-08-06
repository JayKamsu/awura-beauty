# Awura Beauty

Site e-commerce premium de soins naturels — Next.js, TypeScript, Tailwind, Supabase.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-Private-lightgrey)](#)

## Aperçu

Awura Beauty est une boutique en ligne avec diagnostic capillaire, blog, panier et compte client. Le design system suit une palette nature (crème, vert forêt, terracotta) en mode clair et sombre.

## Stack

| Couche | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Styles | Tailwind CSS v4 + tokens CSS |
| Auth / data | Supabase |
| Paiements | Stripe, PayPal |
| Livraison | La Poste, Mondial Relay |
| i18n | i18next / react-i18next |
| Thème | next-themes (class strategy) |

## Démarrage rapide

### Prérequis

- Node.js 20+
- Compte GitHub
- Clés Supabase, Stripe (test), PayPal Sandbox, La Poste, Mondial Relay

### Installation

```bash
git clone https://github.com/JayKamsu/awura-beauty.git
cd awura-beauty
npm install
cp .env.example .env.local
```

Renseigne `.env.local` avec tes clés (jamais committer ce fichier).

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |

## Architecture

```
app/                  # Routes App Router
components/
  layout/             # Header, footer, shell
  providers/          # Theme, i18n, préférences
  ui/                 # Composants réutilisables
features/             # Modules métier autonomes
lib/
  connectors/         # Supabase, Stripe, PayPal, La Poste, Mondial Relay
  i18n/               # Config + locales
docs/                 # Documentation projet
```

Conventions détaillées : [docs/architecture](./docs/architecture/overview.md) et [`.cursor/rules/awura.mdc`](./.cursor/rules/awura.mdc).

## Design system

Couleurs via tokens Tailwind uniquement (`bg-primary`, `text-accent`, …) — aucun hex en dur dans les composants.

Voir [docs/design-system/colors.md](./docs/design-system/colors.md).

## Documentation

| Section | Contenu |
| --- | --- |
| [Getting started](./docs/getting-started/setup.md) | Installation & première config |
| [Architecture](./docs/architecture/overview.md) | Structure & conventions |
| [Design system](./docs/design-system/colors.md) | Palette, typo, thème |
| [Environnement](./docs/environment/variables.md) | Variables `.env` |
| [Intégrations](./docs/integrations/overview.md) | Supabase, paiements, livraison |
| [Features](./docs/features/overview.md) | Modules métier |

## Contribution

1. Crée une branche depuis `main`
2. Respecte les règles Cursor du projet
3. Ouvre une PR claire (quoi / pourquoi / comment tester)

## Licence

Projet privé — tous droits réservés © Awura Beauty.
