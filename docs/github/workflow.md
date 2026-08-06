# Workflow GitHub

## Dépôt

- Remote : `https://github.com/JayKamsu/awura-beauty.git`
- Branche principale : `main`
- Visibilité : privée

## Branches

| Branche | Usage |
| --- | --- |
| `main` | Production / référence stable |
| `feat/*` | Nouvelles fonctionnalités |
| `fix/*` | Correctifs |
| `docs/*` | Documentation seule |

## Commits

Messages courts, orientés *pourquoi* :

```text
feat: ajouter le layout header/footer
docs: documenter les variables Mondial Relay
```

## Pull requests

- Titre clair
- Résumé (quoi / pourquoi)
- Plan de test
- Pas de secrets dans le diff

## Secrets CI (plus tard)

Configurer dans GitHub → Settings → Secrets and variables :

- `NEXT_PUBLIC_SUPABASE_URL`
- clés serveur (Stripe, PayPal, La Poste, Mondial Relay) pour les workflows de preview si besoin
