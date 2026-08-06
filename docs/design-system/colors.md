# Design system — couleurs

Source de vérité : variables CSS dans `app/globals.css`, mappées en utilitaires Tailwind.

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `background` | `#FAF3EC` | `#14201A` | Fond principal |
| `background-alt` | `#F3E9DF` | `#1B2A22` | Sections alternées |
| `primary` | `#1B3323` | `#2E5A3E` | Header barre annonce, footer, boutons |
| `accent` | `#8C6F59` | `#C79A78` | Logo, accents |
| `accent-light` | `#B49076` | `#D9B79B` | Icônes, détails |
| `foreground` | `#1E1E1E` | `#F3E9DF` | Texte principal |
| `muted` | `#6B6B63` | `#A9A79E` | Nav, sous-titres |
| `border` | `#E5DACC` | `#2C3B32` | Bordures |

## Règle

Ne jamais écrire un hex dans un composant. Utiliser `bg-primary`, `text-accent`, `border-border`, etc.

## Typographie

- Titres : `font-serif` (Cormorant Garamond)
- Corps : `font-sans` (Source Sans 3)

## Thème

Bascule via `next-themes` (classe `.dark` sur `<html>`). Le bouton est dans le header.
