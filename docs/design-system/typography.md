# Typographie

## Police officielle (UI digitale)

**Montserrat** — seule police de l’interface.

| Rôle | Graisse | Classes |
| --- | --- | --- |
| Titres / accroches | ExtraBold (800) | `font-serif` (alias display) ou `font-extrabold` |
| Sous-titres | Bold (700) | `font-bold` |
| Corps | Regular (400) | `font-sans` (défaut body) |
| Légendes / secondaire | Light (300) | `font-light` + `text-muted` |

## Packaging uniquement

Une serif type **Minion** peut apparaître sur les étiquettes produit (nom) — **pas** pour l’UI web.

## Implémentation

- Chargement : `next/font/google` → Montserrat dans `app/layout.tsx`
- `--font-awura-sans` = Montserrat
- `font-serif` = même famille, graisse ExtraBold (titres de la maquette)

## À éviter

- Inter, Roboto, Arial, system-ui comme police de marque
- Mélanger une serif éditoriale avec Montserrat sur le site (hors packaging)
