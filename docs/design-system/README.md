# Design system Awura Beauty

Source de vérité : charte graphique officielle (Adobe Illustrator).  
Toute UI (site, admin, composants) doit respecter ce dossier.

## Documents

| Fichier | Contenu |
| --- | --- |
| [brand.md](./brand.md) | Essence, piliers, ton, textures |
| [colors.md](./colors.md) | Palettes Adulte / Enfant, tokens CSS & Tailwind |
| [typography.md](./typography.md) | Montserrat, hiérarchie |
| [logo.md](./logo.md) | Duafe, logo complet, interdits |
| [product-sheet.md](./product-sheet.md) | Structure fiche produit (5 blocs) |

## Implémentation code

| Artefact | Path |
| --- | --- |
| Tokens CSS | `app/globals.css` |
| Fonts | `app/layout.tsx` (Montserrat) |
| Admin marque | `/admin/marque` + table `site_brand_settings` |
| SQL | `supabase/migrate-site-brand.sql` |
| QR produits | générés (lib `qrcode`) + URL gérable admin / produit |
| Duafe | SVG intégré + upload admin ; favicon `app/icon.tsx` |
| Règle Cursor | `.cursor/rules/awura.mdc` + `.cursor/rules/design-system.mdc` |

## Checklist rapide

1. Couleurs = tokens sémantiques (`bg-primary`, `text-accent`…) — jamais d’hex en composant
2. Univers Adulte (défaut site) ≠ univers Enfant (pastel) — pas de mix dans une même section
3. Typo = Montserrat (ExtraBold titres via `font-serif` / `font-extrabold`, Regular corps, Light légendes)
4. Logo / Duafe : clear space, pas d’opacité, pas de déformation, couleurs officielles uniquement
5. Fiche produit : Nom → Bénéfices → Composition → Utilisation → QR/lien
6. Textures / motifs africains en filigrane subtil, camaïeu palette
7. Ton : héritage africain + luxe + naturel + modernité (pas low-cost, pas clinique)
