# Architecture hexagonale Awura Beauty

## Couches

| Couche | Rôle | Emplacement |
| --- | --- | --- |
| **Domain** | Types métier + règles pures | `lib/domain/` |
| **Application** | Ports (interfaces) + composition | `lib/application/ports.ts`, `container.ts` |
| **Infrastructure** | Adapters externes | `lib/infrastructure/` |
| **Presentation** | UI + routes HTTP minces | `features/`, `app/`, `app/api/` |

```
UI / API  →  container (ports)  →  adapters  →  Supabase / Stripe / PayPal / La Poste / MR / Firebase
```

## Adapters

| Adapter | Path | Config |
| --- | --- | --- |
| Supabase | `infrastructure/supabase/` | plus tard / déjà partiel |
| Stripe / PayPal | `infrastructure/payments/` | plus tard |
| La Poste / Mondial Relay | `infrastructure/shipping/` | plus tard |
| Firebase notifications | `infrastructure/notifications/firebase.ts` | stub prêt |

Les adapters non configurés restent utilisables en mode fallback/démo/stub.

## Règles

1. `app/api` et `features` appellent le **container** (ou le domaine pour les types), pas les SDK externes.
2. Un nouvel intégrateur = nouvel adapter qui implémente un port existant (ou un port ajouté dans `ports.ts`).
3. Pas de dépendances croisées entre `features/*`.
4. Hygiène : étendre avant de créer ; ~8 fichiers max par dossier feuille ; supprimer les fichiers ponctuels.

## Modules UI

`features/shop`, `diagnostic`, `blog`, `cart`, `checkout`, `account`, `auth`, `admin`, `home`, `about`.
