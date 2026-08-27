# Features

Chaque fonctionnalité est un module autonome sous `features/`.

| Module | Routes cibles | Description |
| --- | --- | --- |
| Boutique | `/boutique` | Catalogue et fiches produit |
| Diagnostic | `/diagnostic-capillaire` | Parcours diagnostic |
| À propos | `/a-propos` | Présentation marque |
| Blog | `/blog` | Contenu éditorial |
| Contact | `/contact` | Formulaire / infos |
| Légal | `/mentions-legales`, `/conditions-utilisation`, `/politique-de-retour`, `/confidentialite`, `/informations-entreprise` | Mentions, CGU/CGV, retours, RGPD, fiche entreprise |
| Compte | `/compte` | Espace client |
| Recherche | `/recherche` | Recherche produits |
| Panier | `/panier` | Panier et checkout |

## Structure type d'un module

```
features/<nom>/
  components/
  hooks/
  types.ts
  index.ts
```

Les appels data/paiement/livraison restent dans `lib/connectors/`.
