# Couleurs

Deux univers **distincts** — ne jamais les mélanger dans une même interface ou section.

## Univers Adulte — « Protection & Tendresse » (site par défaut)

| Nom | Hex | Usage |
| --- | --- | --- |
| Vert Forêt | `#0F3D2E` | Dominant / force / authenticité → `primary` |
| Doré Chaud | `#E59136` | Accent / prestige / CTA → `accent` |
| Vert Sauge | `#A6BB9A` | Secondaire / douceur → `accent-light` |
| Beige Sable | `#E6D9C1` | Fond clair chaleureux → `background` |
| Noir d’ébène | `#1A1A1A` | Texte / logo sombre → `foreground` |
| Blanc | `#FFFFFF` | Sur Vert Forêt (packaging, contraste) |

## Univers Enfant — « Douceur des Origines »

Uniquement pour une vraie gamme / parcours enfant. Bascule **entière** de la section.

| Nom | Hex |
| --- | --- |
| Vert Pastel | `#A5D2AC` |
| Pêche Doux | `#FFD8C2` |
| Crème Clair | `#FFF5E6` |
| Lavande Légère | `#E6D6F7` |

## Tokens CSS (raw)

```css
:root {
  --awura-green-forest: #0f3d2e;
  --awura-gold-warm: #e59136;
  --awura-green-sage: #a6bb9a;
  --awura-beige-sand: #e6d9c1;
  --awura-green-pastel: #a5d2ac;
  --awura-peach-soft: #ffd8c2;
  --awura-cream-light: #fff5e6;
  --awura-lavender-light: #e6d6f7;
  --awura-black-ebony: #1a1a1a;
  --awura-white: #ffffff;
}
```

## Tokens sémantiques (code)

Source : `app/globals.css`. Utiliser les utilitaires Tailwind, jamais d’hex en composant.

| Token Tailwind | Light (Adulte) | Dark (dérivé charte) | Usage |
| --- | --- | --- | --- |
| `background` | Beige Sable `#E6D9C1` | Vert Forêt profond `#0A281F` | Fond page |
| `background-alt` | Sable clair `#F0E8D8` | Forêt `#143D2E` | Sections |
| `primary` | Vert Forêt `#0F3D2E` | Sauge `#A6BB9A` | Boutons, barres, titres forts |
| `accent` | Doré Chaud `#E59136` | Doré Chaud `#E59136` | CTA, liens, éclat |
| `accent-light` | Vert Sauge `#A6BB9A` | Or clair `#F0B06A` | Secondaire |
| `foreground` | Ébène `#1A1A1A` | Sable `#E6D9C1` | Texte |
| `muted` | `#5A6B5C` | `#A6BB9A` | Secondaire |
| `border` | `#D4C4A8` | `#2A4A3C` | Bordures |

## Règle

```
❌ hex / rgb en dur dans un composant
✅ bg-primary, text-accent, border-border, bg-background-alt…
```
