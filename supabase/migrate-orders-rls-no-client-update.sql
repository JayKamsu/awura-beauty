-- Sécurité commandes : plus de UPDATE client sur payment/status.
-- Les mises à jour paiement / livraison passent par service_role (API serveur).

drop policy if exists "Users can update own pending orders" on public.orders;
