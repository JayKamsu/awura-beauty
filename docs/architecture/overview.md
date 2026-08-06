# Architecture

## Principes

1. **App Router** : pages et layouts dans `app/`
2. **Features isolées** : chaque domaine métier vit dans `features/<nom>/` (composants, hooks, appels via connectors)
3. **Connecteurs** : tout accès externe passe par `lib/connectors/`
4. **UI partagée** : `components/ui` pour boutons, inputs, etc.
5. **Layout global** : `components/layout` (annonce, header, footer)
6. **i18n** : aucun texte utilisateur en dur — toujours `t("clé")`

## Modules prévus

| Feature | Rôle |
| --- | --- |
| `boutique` | Catalogue, fiches produit |
| `diagnostic` | Diagnostic capillaire |
| `blog` | Articles |
| `panier` | Panier & checkout |
| `compte` | Auth / espace client |

Pas de dépendances croisées entre modules : partager uniquement via `components/ui` et `lib/`.

## Providers

- `ThemeProvider` — next-themes (`attribute="class"`)
- `I18nProvider` — i18next
- `PreferencesProvider` — langue + devise (localStorage)
