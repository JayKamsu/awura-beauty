---
name: awura-architecture
description: >-
  Architecture hexagonale Awura Beauty orientée production (domain/ports/adapters),
  sécurité admin, hygiène des fichiers, stubs intégrations. À utiliser dès qu'on
  crée ou modifie des modules, API, adapters ou la structure du repo.
---

# Architecture Awura (production first)

**Cible unique : la production.** Dev/local = copie contrainte de la prod.
Pas de raccourcis « on sécurisera plus tard », pas de bypass laissés actifs,
pas de secrets faibles commités.

## Couches

| Couche | Path |
| --- | --- |
| Domain | `lib/domain` |
| Ports + container | `lib/application/ports.ts`, `container.ts` |
| Adapters | `lib/infrastructure/{supabase,payments,shipping,notifications}` |
| Presentation | `features/*`, `app/*`, `app/api/*` |

Flux : **UI/API → `container` → adapter → service externe**.

## Sécurité production (obligatoire)

- Admin UI + `/api/admin/*` : JWT Bearer + `requireAdminFromRequest`
- Rôle : `app_metadata.role === "admin"` et/ou `ADMIN_EMAILS` (serveur)
- Écritures / listes admin : `createAdminSupabaseClient()` (service_role en prod)
- `ADMIN_DEV_BYPASS` : `false` en prod ; hors prod uniquement sans JWT
- Upload admin : MIME image + taille max 5 Mo
- `SUPABASE_SERVICE_ROLE_KEY` jamais en `NEXT_PUBLIC_*`
- Pages compte / panier / commande / admin : noindex

## Ajouter une intégration

1. Port dans `lib/application/ports.ts` (si besoin)
2. Adapter dans `lib/infrastructure/<service>/` (peut rester stub)
3. Brancher dans `lib/application/container.ts`
4. Env dans `.env.example` avec valeurs **prod-ready** (pas de bypass par défaut)

Adapters : Supabase, Stripe, PayPal, La Poste, Mondial Relay, Firebase (stub).

## Hygiène

- Étendre avant de créer ; ~8 fichiers / dossier feuille.
- Scripts one-shot → supprimer après usage.
- Checklist : fichier référencé ? sinon supprimer.
