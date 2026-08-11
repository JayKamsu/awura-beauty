-- Intégration Colissimo SLS REST : historique de suivi + chemin d'étiquette privé.
-- label_url reste utilisé par Mondial Relay (URL PDF distante) ; label_path est
-- réservé aux étiquettes que l'on héberge nous-mêmes (bucket privé shipping-labels).

alter table public.orders
  add column if not exists label_path text,
  add column if not exists carrier_status_history jsonb not null default '[]'::jsonb,
  add column if not exists last_tracking_sync_at timestamptz;

create index if not exists orders_last_tracking_sync_idx
  on public.orders (last_tracking_sync_at);
