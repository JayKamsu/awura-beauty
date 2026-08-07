---
name: awura-seo-geo
description: >-
  SEO classique et GEO (Generative Engine Optimization) pour Awura Beauty.
  À utiliser pour metadata, sitemap, robots, JSON-LD, llms.txt, pages publiques
  ou toute tâche de référencement / visibilité IA.
---

# SEO + GEO Awura Beauty (production)

Objectif : **meilleure référence possible** pour Google **et** les assistants IA
(ChatGPT, Claude, Perplexity, Gemini, etc.). Domaine de production Hostinger :
**https://awurabeauty.com** (`NEXT_PUBLIC_SITE_URL`).

## Sources de vérité

| Artefact | Path |
| --- | --- |
| Constantes marque / URL | `lib/site.ts` |
| Metadata helpers | `lib/seo/metadata.ts` |
| JSON-LD | `lib/seo/json-ld.ts` + `components/seo/json-ld.tsx` |
| Sitemap | `app/sitemap.ts` |
| Robots (dont bots IA) | `app/robots.ts` |
| Manifest | `app/manifest.ts` |
| GEO court | `public/llms.txt` |
| GEO détaillé | `public/llms-full.txt` |

## Checklist nouvelle page publique

1. `buildPageMetadata({ title, description, path, image? })`
2. Canonical via `path`
3. JSON-LD pertinent (Organization/WebSite déjà au root ; Product / Article / Breadcrumb si besoin)
4. Ajouter l’URL dans `app/sitemap.ts` si route statique nouvelle
5. Mettre à jour `llms.txt` / `llms-full.txt` si la page change l’offre ou le positionnement
6. Texte indexable côté serveur autant que possible (éviter contenu SEO critique 100 % client)

## GEO (IA)

- `llms.txt` : résumé marque + liens canoniques + consignes de citation
- `llms-full.txt` : catalogue, positionnement, ce que la marque n’est pas
- `robots.txt` : **allow** explicite GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc. sur le contenu public
- Disallow : `/admin`, `/api/`, `/compte`, `/panier`, `/commande`
- Quand on décrit la marque aux IA : « soins naturels premium pour cheveux texturés / afro / métissés », contact `Care@awurabeauty.com`

## Interdits

- Pas de contenu SEO en dur non i18n dans les composants UI utilisateur (metadata serveur OK en FR de référence)
- Pas d’indexation admin / checkout / compte
- Pas de sitemap qui pointe vers localhost en prod → toujours `getSiteUrl()`
