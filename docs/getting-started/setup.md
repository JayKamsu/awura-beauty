# Mise en place

## Checklist préalable

- [ ] Node.js 20+
- [ ] Cursor + compte GitHub
- [ ] Projet Supabase + clés
- [ ] Stripe test + PayPal Sandbox
- [ ] API La Poste
- [ ] Compte Mondial Relay (enseigne + clé privée)
- [ ] Packshots produits exportés

## Étapes

1. Cloner le dépôt
2. `npm install`
3. Copier `.env.example` → `.env.local`
4. Remplir toutes les clés (voir [variables](../environment/variables.md))
5. `npm run dev`

## Vérifications

- Header + footer visibles
- Bascule dark / light fonctionnelle
- Sélecteur langue (FR/EN) et devise (EUR/USD/GBP)
- Aucune clé secrète dans le dépôt (`git status` ne doit pas lister `.env.local`)
