# Intégrations

Tous les appels externes passent par `lib/connectors/`. Aucun composant UI n'importe directement un SDK tiers.

## Connecteurs prévus

| Connecteur | Service | Statut |
| --- | --- | --- |
| `supabase` | Auth, DB, storage | À brancher |
| `stripe` | Paiement carte | À brancher |
| `paypal` | Paiement PayPal | À brancher |
| `laposte` | Expédition / tracking | À brancher |
| `mondial-relay` | Points Relais | À brancher |

## Paiements

Checkout : Stripe + PayPal Sandbox en phase de développement.

## Livraison

- **La Poste** : envoi domicile / Colissimo
- **Mondial Relay** : retrait en Point Relais

Les clés sont documentées dans [environment/variables.md](../environment/variables.md).
